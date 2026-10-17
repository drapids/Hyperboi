const { app, BrowserWindow, ipcMain, dialog, globalShortcut, shell, net, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile, spawn } = require('child_process');

const EXE = 'project_garden-Win64-Shipping.exe';
const MOD_VERSION = '7';
const LAUNCHER = 'project_garden.exe';

let win = null;
let mini = null;
let store = {};
let storePath = '';
let lastCmd = '';
let events = [];
let evtCounter = 0;
let gameRunning = false;
let lastState = null;
let lastStateMtime = 0;
let pollTimer = null;
let procTimer = null;

const defaultHotkeys = {
  god: 'F1',
  nocd: 'F2',
  infmeter: 'F3',
  airjumps: 'F4',
  nokill: 'F5',
  ghost: 'F6',
  slowmo: 'F7',
  save1: 'F8',
  load1: 'F9',
  boost: 'F10',
  freeze: 'Shift+F1',
  fevercam: 'Shift+F2',
  timer: 'Shift+F3',
  overlay: 'Shift+F4'
};

function hookSource() {
  return app.isPackaged ? path.join(process.resourcesPath, 'hook') : path.join(__dirname, 'hook');
}

function loadStore() {
  storePath = path.join(app.getPath('userData'), 'hyperboi.json');
  try {
    store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  } catch {
    store = {};
  }
  store.hotkeys = Object.assign({}, defaultHotkeys, store.hotkeys || {});
  if (store.hotkeysOn === undefined) store.hotkeysOn = true;
  store.slots = store.slots || {};
  store.runs = store.runs || {};
}

function saveStore() {
  try {
    fs.mkdirSync(path.dirname(storePath), { recursive: true });
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
  } catch {}
}

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function win64From(p) {
  if (!p) return null;
  let s;
  try {
    s = fs.statSync(p);
  } catch {
    return null;
  }
  if (s.isFile()) {
    const base = path.basename(p).toLowerCase();
    if (base === EXE.toLowerCase()) return path.dirname(p);
    if (base === LAUNCHER.toLowerCase()) p = path.dirname(p);
    else return null;
  }
  const candidates = [
    p,
    path.join(p, 'project_garden', 'Binaries', 'Win64'),
    path.join(p, 'Windows', 'project_garden', 'Binaries', 'Win64'),
    path.join(p, 'Binaries', 'Win64')
  ];
  for (const c of candidates) {
    if (exists(path.join(c, EXE))) return c;
  }
  return findExe(p, 5);
}

function findExe(dir, depth) {
  if (depth < 0) return null;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const e of entries) {
    if (e.isFile() && e.name.toLowerCase() === EXE.toLowerCase()) return dir;
  }
  for (const e of entries) {
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
      const r = findExe(path.join(dir, e.name), depth - 1);
      if (r) return r;
    }
  }
  return null;
}

function autoFind() {
  const home = os.homedir();
  const roots = [
    path.join(home, 'Downloads'),
    path.join(home, 'Desktop'),
    path.join(home, 'Documents'),
    path.join(home, 'Games'),
    path.join(home, 'AppData', 'Roaming', 'itch', 'apps'),
    'C:\\Games'
  ];
  for (const r of roots) {
    let entries;
    try {
      entries = fs.readdirSync(r, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.isDirectory() && /hyper|ballin|garden/i.test(e.name)) {
        const hit = findExe(path.join(r, e.name), 5);
        if (hit) return hit;
      }
    }
  }
  return null;
}

function processPath() {
  return new Promise((resolve) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', "(Get-Process 'project_garden-Win64-Shipping' -ErrorAction SilentlyContinue | Select-Object -First 1).Path"],
      { windowsHide: true, timeout: 8000 },
      (err, out) => resolve(err ? null : (out || '').trim() || null)
    );
  });
}

function checkProcess() {
  if (process.platform !== 'win32') return;
  execFile('tasklist.exe', ['/FI', `IMAGENAME eq ${EXE}`, '/NH', '/FO', 'CSV'], { windowsHide: true, timeout: 5000 }, async (err, out) => {
    const running = !err && out.toLowerCase().includes(EXE.toLowerCase());
    if (running && !gameRunning && !store.gameDir) {
      const p = await processPath();
      const w = win64From(p);
      if (w) {
        store.gameDir = w;
        saveStore();
        pushInfo();
      }
    }
    if (running !== gameRunning) {
      gameRunning = running;
      pushInfo();
    }
  });
}

function hookLayout(w) {
  if (!w) return null;
  const nested = path.join(w, 'ue4ss');
  const base = exists(path.join(nested, 'UE4SS.dll')) || exists(path.join(nested, 'Mods')) ? nested : w;
  const proxyDll = ['dwmapi.dll', 'xinput1_3.dll'].find((d) => exists(path.join(w, d)));
  const offDll = ['dwmapi.dll', 'xinput1_3.dll'].find((d) => exists(path.join(w, d + '.hyperboi-off')));
  return {
    base,
    mods: path.join(base, 'Mods'),
    mod: path.join(base, 'Mods', 'Hyperboi'),
    bridge: path.join(base, 'Mods', 'Hyperboi', 'bridge'),
    proxyDll,
    offDll,
    ue4ss: exists(path.join(base, 'UE4SS.dll')),
    settings: path.join(base, 'UE4SS-settings.ini')
  };
}

function info() {
  const w = store.gameDir && exists(path.join(store.gameDir, EXE)) ? store.gameDir : null;
  const h = hookLayout(w);
  return {
    gameDir: w,
    gameRunning,
    ue4ss: !!(h && h.ue4ss),
    modInstalled: !!(h && exists(path.join(h.mod, 'Scripts', 'main.lua'))),
    modCurrent: modCurrent(),
    modVersion: MOD_VERSION,
    hookEnabled: !!(h && h.proxyDll),
    hookDisabled: !!(h && !h.proxyDll && h.offDll),
    hotkeys: store.hotkeys,
    hotkeysOn: store.hotkeysOn,
    slots: store.slots,
    runs: store.runs,
    cfg: store.cfg || null,
    names: store.names || {},
    platform: process.platform
  };
}

function pushInfo() {
  if (win && !win.isDestroyed()) win.webContents.send('info', info());
}

function send(ch, data) {
  if (win && !win.isDestroyed()) win.webContents.send(ch, data);
  if (mini && !mini.isDestroyed() && (ch === 'state' || ch === 'mini')) mini.webContents.send(ch, data);
}

function parseState(raw) {
  if (!raw || !raw.includes('end=1')) return null;
  const s = { vars: [], binds: [], touched: {}, slots: {} };
  for (const line of raw.split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i < 0) continue;
    const k = line.slice(0, i);
    const v = line.slice(i + 1);
    if (k === 'var') {
      const [owner, name, t, val] = v.split('|');
      s.vars.push({ owner, name, t, v: val });
    } else if (k === 'bind') {
      s.binds.push(v.split('|'));
    } else if (k === 'touched') {
      const [c, n] = v.split('|');
      (s.touched[c] = s.touched[c] || []).push(n);
    } else if (k === 'pos' || k === 'vel') {
      s[k] = v.split(',').map(Number);
    } else if (k === 'slot') {
      const [n, p] = v.split('|');
      s.slots[n] = p.split(',').map(Number);
    } else {
      s[k] = v;
    }
  }
  return s;
}

function poll() {
  const h = hookLayout(store.gameDir);
  let link = 'offline';
  if (h) {
    const sp = path.join(h.bridge, 'state.txt');
    try {
      const st = fs.statSync(sp);
      const fresh = Date.now() - st.mtimeMs < 2500;
      if (st.mtimeMs !== lastStateMtime) {
        lastStateMtime = st.mtimeMs;
        const parsed = parseState(fs.readFileSync(sp, 'utf8'));
        if (parsed) {
          lastState = parsed;
          trackMapBest(parsed);
        }
      }
      if (fresh) link = 'live';
      else if (gameRunning) link = 'waiting';
    } catch {
      if (gameRunning) link = 'waiting';
    }
    let error = null;
    try {
      const ep = path.join(h.bridge, 'error.txt');
      const est = fs.statSync(ep);
      if (Date.now() - est.mtimeMs < 10000) error = fs.readFileSync(ep, 'utf8');
    } catch {}
    send('state', { link, state: link === 'live' ? lastState : null, error, gameRunning });
  } else {
    send('state', { link: gameRunning ? 'waiting' : 'offline', state: null, error: null, gameRunning });
  }
}

function writeCmd() {
  const h = hookLayout(store.gameDir);
  if (!h || !exists(h.mod)) return;
  const c = store.cfg || {};
  const lines = [];
  const b = (x) => (x ? '1' : '0');
  for (const k of ['god', 'nocd', 'infmeter', 'airjumps', 'nokill', 'ghost', 'freeze', 'fevercam', 'spin']) lines.push(`${k}=${b(c[k])}`);
  for (const k of ['pspeed', 'wspeed', 'jump', 'grav', 'air', 'scale']) lines.push(`${k}=${Number(c[k] ?? 1)}`);
  lines.push(`fov=${Number(c.fov ?? 0)}`);
  for (const [key, val] of Object.entries(c.locks || {})) lines.push(`lock=${key}|${val}`);
  const now = Date.now();
  events = events.filter((e) => now - e.t < 6000);
  for (const e of events) lines.push(`evt=${e.id}|${e.kind}|${e.arg ?? ''}`);
  const out = lines.join('\n') + '\n';
  if (out === lastCmd) return;
  try {
    fs.mkdirSync(h.bridge, { recursive: true });
    fs.writeFileSync(path.join(h.bridge, 'cmd.txt'), out);
    lastCmd = out;
  } catch {}
}

function pushEvent(kind, arg) {
  evtCounter += 1;
  events.push({ id: Math.floor(Date.now() / 10) * 100 + (evtCounter % 100), kind, arg, t: Date.now() });
  writeCmd();
}

function registerHotkeys() {
  globalShortcut.unregisterAll();
  if (!store.hotkeysOn) return;
  for (const [action, acc] of Object.entries(store.hotkeys)) {
    if (!acc) continue;
    try {
      globalShortcut.register(acc, () => {
        if (action === 'overlay') return toggleMini();
        if (win && !win.isDestroyed()) win.webContents.send('hotkey', action);
      });
    } catch {}
  }
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = net.request({ url, headers: { 'User-Agent': 'Hyperboi', Accept: 'application/vnd.github+json' } });
    let body = '';
    req.on('response', (res) => {
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`github said ${res.statusCode}`));
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function download(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const req = net.request({ url, headers: { 'User-Agent': 'Hyperboi' }, redirect: 'follow' });
    req.on('response', (res) => {
      if (res.statusCode >= 400) return reject(new Error(`download failed (${res.statusCode})`));
      const total = Number(res.headers['content-length'] || 0);
      let got = 0;
      const out = fs.createWriteStream(dest);
      res.on('data', (d) => {
        got += d.length;
        out.write(d);
        if (total) onProgress(got / total);
      });
      res.on('end', () => out.end(resolve));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

function expand(zip, dest) {
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', `Expand-Archive -LiteralPath '${zip.replace(/'/g, "''")}' -DestinationPath '${dest.replace(/'/g, "''")}' -Force`],
      { windowsHide: true, timeout: 120000 },
      (err, _o, se) => (err ? reject(new Error((se || err.message).trim())) : resolve())
    );
  });
}

function pickAsset(releases) {
  const ok = (a) => /^UE4SS.*\.zip$/i.test(a.name) && !/zDEV|zCustom|source/i.test(a.name);
  const order = [...releases].sort((a, b) => (b.tag_name === 'experimental-latest') - (a.tag_name === 'experimental-latest'));
  for (const r of order) {
    if (r.draft) continue;
    const a = (r.assets || []).find(ok);
    if (a) return { url: a.browser_download_url, name: a.name, tag: r.tag_name };
  }
  return null;
}

function syncMod() {
  const h = hookLayout(store.gameDir);
  if (!h || !h.ue4ss || !exists(h.mods)) return false;
  const src = path.join(hookSource(), 'Hyperboi', 'Scripts');
  const dst = path.join(h.mod, 'Scripts');
  let changed = false;
  try {
    fs.mkdirSync(dst, { recursive: true });
    fs.mkdirSync(h.bridge, { recursive: true });
    fs.mkdirSync(path.join(h.mod, 'maps'), { recursive: true });
    if (!exists(path.join(h.mod, 'enabled.txt'))) fs.writeFileSync(path.join(h.mod, 'enabled.txt'), '');
    for (const f of fs.readdirSync(src)) {
      const a = fs.readFileSync(path.join(src, f));
      const target = path.join(dst, f);
      if (!exists(target) || !a.equals(fs.readFileSync(target))) {
        fs.writeFileSync(target, a);
        changed = true;
      }
    }
  } catch {
    return false;
  }
  if (changed) {
    store.modSyncedAt = Date.now();
    saveStore();
  }
  return changed;
}

function modCurrent() {
  const h = hookLayout(store.gameDir);
  if (!h) return false;
  const src = path.join(hookSource(), 'Hyperboi', 'Scripts');
  try {
    return fs.readdirSync(src).every((f) => {
      const t = path.join(h.mod, 'Scripts', f);
      return exists(t) && fs.readFileSync(path.join(src, f)).equals(fs.readFileSync(t));
    });
  } catch {
    return false;
  }
}

function copyMod() {
  const h = hookLayout(store.gameDir);
  fs.mkdirSync(h.mods, { recursive: true });
  fs.cpSync(path.join(hookSource(), 'Hyperboi'), h.mod, { recursive: true, force: true });
  fs.mkdirSync(h.bridge, { recursive: true });
  fs.writeFileSync(path.join(h.mod, 'enabled.txt'), '');
  const txt = path.join(h.mods, 'mods.txt');
  if (exists(txt)) {
    let t = fs.readFileSync(txt, 'utf8');
    if (/^\s*Hyperboi\s*:/m.test(t)) t = t.replace(/^\s*Hyperboi\s*:.*$/m, 'Hyperboi : 1');
    else t = `Hyperboi : 1\n` + t;
    fs.writeFileSync(txt, t);
  }
  const json = path.join(h.mods, 'mods.json');
  if (exists(json)) {
    try {
      const arr = JSON.parse(fs.readFileSync(json, 'utf8'));
      if (Array.isArray(arr)) {
        const e = arr.find((m) => m.mod_name === 'Hyperboi');
        if (e) e.mod_enabled = true;
        else arr.unshift({ mod_name: 'Hyperboi', mod_enabled: true });
        fs.writeFileSync(json, JSON.stringify(arr, null, 4));
      }
    } catch {}
  }
  if (exists(h.settings)) {
    let s = fs.readFileSync(h.settings, 'utf8');
    s = s.replace(/^(\s*ConsoleEnabled\s*=\s*)\d/m, '$10').replace(/^(\s*GuiConsoleEnabled\s*=\s*)\d/m, '$10').replace(/^(\s*GuiConsoleVisible\s*=\s*)\d/m, '$10');
    fs.writeFileSync(h.settings, s);
  }
  lastCmd = '';
  writeCmd();
}

async function installHook() {
  const step = (msg, p) => send('install', { msg, p });
  if (!store.gameDir) throw new Error("can't find the game yet. point me at it first");
  if (gameRunning) throw new Error('close hyperballin first, it locks the files');
  let h = hookLayout(store.gameDir);
  if (!h.ue4ss) {
    step('asking github for ue4ss', 0.05);
    const rel = await getJson('https://api.github.com/repos/UE4SS-RE/RE-UE4SS/releases?per_page=15');
    const asset = pickAsset(rel);
    if (!asset) throw new Error("couldn't find a ue4ss download on github");
    const zip = path.join(os.tmpdir(), `hyperboi-${asset.name}`);
    step(`downloading ${asset.name}`, 0.1);
    await download(asset.url, zip, (p) => step(`downloading ${asset.name}`, 0.1 + p * 0.6));
    step('unzipping into the game', 0.75);
    await expand(zip, store.gameDir);
    try {
      fs.unlinkSync(zip);
    } catch {}
    store.ue4ssTag = asset.tag;
  }
  h = hookLayout(store.gameDir);
  if (!h.proxyDll && h.offDll) fs.renameSync(path.join(store.gameDir, h.offDll + '.hyperboi-off'), path.join(store.gameDir, h.offDll));
  step('dropping the hyperboi brain in', 0.9);
  copyMod();
  saveStore();
  step('done. launch the game', 1);
  pushInfo();
  return info();
}

function setHookEnabled(on) {
  const h = hookLayout(store.gameDir);
  if (!h) throw new Error('no game folder');
  if (gameRunning) throw new Error('close the game first');
  if (on && h.offDll) fs.renameSync(path.join(store.gameDir, h.offDll + '.hyperboi-off'), path.join(store.gameDir, h.offDll));
  if (!on && h.proxyDll) fs.renameSync(path.join(store.gameDir, h.proxyDll), path.join(store.gameDir, h.proxyDll + '.hyperboi-off'));
  pushInfo();
  return info();
}

function createMini() {
  const { workArea } = screen.getPrimaryDisplay();
  mini = new BrowserWindow({
    width: 340,
    height: 118,
    x: workArea.x + workArea.width - 360,
    y: workArea.y + 20,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, backgroundThrottling: false }
  });
  mini.setAlwaysOnTop(true, 'screen-saver');
  mini.setIgnoreMouseEvents(true);
  mini.loadFile(path.join(__dirname, 'src', 'mini.html'));
  mini.on('closed', () => (mini = null));
}

function toggleMini() {
  if (mini && !mini.isDestroyed()) {
    mini.close();
    mini = null;
  } else {
    createMini();
  }
  send('miniOpen', !!mini);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1240,
    height: 800,
    minWidth: 980,
    minHeight: 660,
    frame: false,
    backgroundColor: '#07010f',
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, backgroundThrottling: false }
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.once('ready-to-show', () => win.show());
  win.on('closed', () => {
    win = null;
    if (mini) mini.close();
  });
}

ipcMain.handle('info', () => info());
ipcMain.handle('detect', async () => {
  let w = null;
  if (gameRunning) w = win64From(await processPath());
  if (!w) w = autoFind();
  if (w) {
    store.gameDir = w;
    saveStore();
  }
  pushInfo();
  return info();
});
ipcMain.handle('pick', async () => {
  const r = await dialog.showOpenDialog(win, {
    title: 'find hyperballin',
    properties: ['openFile', 'openDirectory'],
    filters: [{ name: 'Hyperballin', extensions: ['exe'] }]
  });
  if (r.canceled || !r.filePaths[0]) return info();
  const w = win64From(r.filePaths[0]);
  if (!w) throw new Error("that's not hyperballin (no project_garden exe in there)");
  store.gameDir = w;
  saveStore();
  syncMod();
  pushInfo();
  return info();
});
ipcMain.handle('install', () => installHook());
ipcMain.handle('refreshMod', () => {
  copyMod();
  return info();
});
ipcMain.handle('hookEnabled', (_e, on) => setHookEnabled(on));
function runQuiet(cmd, args, ms) {
  return new Promise((resolve) => execFile(cmd, args, { windowsHide: true, timeout: ms }, (err, out) => resolve(err ? '' : out || '')));
}

async function killStuckGame() {
  if (process.platform !== 'win32') return;
  await runQuiet('taskkill.exe', ['/F', '/T', '/IM', EXE], 8000);
  await runQuiet('taskkill.exe', ['/F', '/T', '/IM', LAUNCHER], 5000);
  await runQuiet('taskkill.exe', ['/F', '/IM', 'CrashReportClient.exe'], 5000);
  for (let i = 0; i < 20; i++) {
    const out = await runQuiet('tasklist.exe', ['/FI', `IMAGENAME eq ${EXE}`, '/NH', '/FO', 'CSV'], 5000);
    if (!out.toLowerCase().includes(EXE.toLowerCase())) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  gameRunning = false;
  pushInfo();
}

ipcMain.handle('launch', async () => {
  if (!store.gameDir) throw new Error('no game folder yet');
  if (gameRunning) await killStuckGame();
  const root = path.resolve(store.gameDir, '..', '..', '..');
  const launcher = path.join(root, LAUNCHER);
  const exe = exists(launcher) ? launcher : path.join(store.gameDir, EXE);
  spawn(exe, [], { cwd: path.dirname(exe), detached: true, stdio: 'ignore' }).unref();
  return true;
});
ipcMain.handle('openFolder', () => store.gameDir && shell.openPath(store.gameDir));
ipcMain.handle('cfg', (_e, cfg) => {
  store.cfg = cfg;
  writeCmd();
  clearTimeout(ipcMain._saveT);
  ipcMain._saveT = setTimeout(saveStore, 600);
  return true;
});
ipcMain.handle('event', (_e, kind, arg) => {
  pushEvent(kind, arg);
  return true;
});
ipcMain.handle('slots', (_e, slots, names) => {
  store.slots = slots;
  if (names) store.names = names;
  saveStore();
  return true;
});
ipcMain.handle('runs', (_e, runs) => {
  store.runs = runs;
  saveStore();
  return true;
});
ipcMain.handle('hotkeys', (_e, map, on) => {
  if (map) store.hotkeys = Object.assign({}, defaultHotkeys, map);
  if (on !== undefined) store.hotkeysOn = on;
  saveStore();
  registerHotkeys();
  return info();
});
ipcMain.handle('resetHotkeys', () => {
  store.hotkeys = { ...defaultHotkeys };
  saveStore();
  registerHotkeys();
  return info();
});
ipcMain.handle('mini', () => {
  toggleMini();
  return !!mini;
});
ipcMain.on('miniData', (_e, d) => {
  if (mini && !mini.isDestroyed()) mini.webContents.send('mini', d);
});
ipcMain.on('win', (_e, a) => {
  if (!win) return;
  if (a === 'min') win.minimize();
  if (a === 'max') (win.isMaximized() ? win.unmaximize() : win.maximize());
  if (a === 'close') win.close();
});
const BUILDER_URL = 'https://drapids.github.io/Hyperboi/builderballin/';

function mapsDir() {
  const h = hookLayout(store.gameDir);
  if (!h || !exists(h.mod)) return null;
  const d = path.join(h.mod, 'maps');
  fs.mkdirSync(d, { recursive: true });
  return d;
}

function readMapMeta(file, full) {
  try {
    const data = JSON.parse(fs.readFileSync(full, 'utf8'));
    if (data.format !== 'builderballin') return null;
    const st = fs.statSync(full);
    return {
      file,
      name: (data.meta && data.meta.name) || file.replace(/\.hbmap$/i, ''),
      author: (data.meta && data.meta.author) || '',
      description: (data.meta && data.meta.description) || '',
      difficulty: (data.meta && data.meta.difficulty) || '',
      gems: (data.meta && data.meta.gems) || {},
      parts: data.build ? (data.build.parts || []).length : 0,
      marbles: data.build ? (data.build.marbles || []).length : 0,
      spawners: data.build ? (data.build.spawners || []).length : 0,
      zones: data.build ? (data.build.zones || []).length : 0,
      checkpoints: data.build ? data.build.checkpoints || 0 : 0,
      ready: !!data.build,
      added: st.mtimeMs
    };
  } catch {
    return null;
  }
}

function listMaps() {
  const d = mapsDir();
  if (!d) return { ok: false, maps: [] };
  const maps = [];
  for (const f of fs.readdirSync(d)) {
    if (!/\.hbmap$/i.test(f)) continue;
    const m = readMapMeta(f, path.join(d, f));
    if (m) maps.push(m);
  }
  maps.sort((a, b) => b.added - a.added);
  const clean = (v) => String(v || '').replace(/[|\r\n]/g, ' ');
  try {
    fs.writeFileSync(path.join(d, 'index.txt'), maps.filter((m) => m.ready).map((m) => [m.file, clean(m.name), clean(m.author), clean(m.difficulty)].join('|')).join('\n') + '\n');
  } catch {}
  return { ok: true, maps, best: store.mapBest || {} };
}

function addMapFiles(paths) {
  const d = mapsDir();
  if (!d) throw new Error('Set up the game and install the hook first');
  const added = [];
  const skipped = [];
  for (const src of paths) {
    let text;
    try {
      text = fs.readFileSync(src, 'utf8');
      const data = JSON.parse(text);
      if (data.format !== 'builderballin') throw new Error();
      if (!data.build) {
        skipped.push(`${path.basename(src)} (export it again from Builderballin)`);
        continue;
      }
    } catch {
      skipped.push(`${path.basename(src)} (not a map)`);
      continue;
    }
    const base = path.basename(src).replace(/\.(hbmap|json)$/i, '').replace(/[^a-z0-9 _.-]/gi, '_') || 'map';
    let name = `${base}.hbmap`;
    let i = 2;
    while (exists(path.join(d, name)) && fs.readFileSync(path.join(d, name), 'utf8') !== text) name = `${base} (${i++}).hbmap`;
    fs.writeFileSync(path.join(d, name), text);
    added.push(name);
  }
  return { added, skipped, ...listMaps() };
}

let lastFinish = null;
function trackMapBest(state) {
  if (!state || !state.map_file || !state.map_finish) return;
  const key = `${state.map_file}|${state.map_finish}`;
  if (key === lastFinish) return;
  lastFinish = key;
  const t = parseFloat(state.map_finish);
  store.mapBest = store.mapBest || {};
  const prev = store.mapBest[state.map_file];
  if (!prev || t < prev) {
    store.mapBest[state.map_file] = t;
    saveStore();
  }
}

ipcMain.handle('maps:list', () => listMaps());
ipcMain.handle('maps:pick', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Add maps', properties: ['openFile', 'multiSelections'], filters: [{ name: 'Builderballin maps', extensions: ['hbmap', 'json'] }] });
  if (r.canceled) return { added: [], skipped: [], ...listMaps() };
  return addMapFiles(r.filePaths);
});
ipcMain.handle('maps:add', (_e, paths) => addMapFiles(paths || []));
ipcMain.handle('maps:remove', (_e, file) => {
  const d = mapsDir();
  if (d && /^[^\\/]+\.hbmap$/i.test(file) && exists(path.join(d, file))) fs.unlinkSync(path.join(d, file));
  return listMaps();
});
ipcMain.handle('maps:folder', () => {
  const d = mapsDir();
  if (d) shell.openPath(d);
});
ipcMain.handle('maps:builder', () => shell.openExternal(BUILDER_URL));
ipcMain.handle('maps:log', () => {
  const h = hookLayout(store.gameDir);
  if (!h) return 'Find the game first.';
  const out = [];
  for (const [f, label] of [['maps_log.txt', 'Maps'], ['menu_log.txt', 'Menu'], ['log.txt', 'Mod']]) {
    const p = path.join(h.bridge, f);
    if (!exists(p)) continue;
    const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/).filter(Boolean);
    out.push(`${label}\n${lines.slice(-60).join('\n')}`);
  }
  if (exists(path.join(h.bridge, 'menu_dump.txt'))) out.push('Menu: found the main menu and read its layout.');
  return out.length ? out.join('\n\n') : 'Nothing yet. Start the game with the hook on, then check again.';
});

ipcMain.handle('external', (_e, url) => {
  if (/^https:\/\//.test(url)) shell.openExternal(url);
});

app.whenReady().then(() => {
  loadStore();
  if (!store.gameDir) {
    const w = autoFind();
    if (w) {
      store.gameDir = w;
      saveStore();
    }
  }
  syncMod();
  createWindow();
  registerHotkeys();
  checkProcess();
  setInterval(() => {
    if (syncMod()) pushInfo();
  }, 15000);
  procTimer = setInterval(checkProcess, 2000);
  pollTimer = setInterval(poll, 150);
  setInterval(writeCmd, 1000);
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  clearInterval(pollTimer);
  clearInterval(procTimer);
});
app.on('window-all-closed', () => app.quit());
