const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const ICONS = {
  heart: '<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  battery: '<rect x="2" y="7" width="17" height="10" rx="2.5"/><path d="M22 11v2M6 10v4M10 10v4M14 10v4"/>',
  wing: '<path d="M3 17c6 0 9-3 11-8 1.5 3 4 5 7 5-2 3-6 5-11 5-3 0-5-1-7-2z"/><path d="M14 9c-1-3-3-5-6-6"/>',
  skull: '<path d="M12 2a8 8 0 00-5 14.2V20h10v-3.8A8 8 0 0012 2z"/><circle cx="9" cy="11" r="1.6" fill="currentColor"/><circle cx="15" cy="11" r="1.6" fill="currentColor"/><path d="M10 20v-2M14 20v-2"/>',
  ghost: '<path d="M5 21V10a7 7 0 0114 0v11l-2.3-2-2.4 2-2.3-2-2.3 2-2.4-2z"/><circle cx="9.5" cy="10" r="1" fill="currentColor"/><circle cx="14.5" cy="10" r="1" fill="currentColor"/>',
  snow: '<path d="M12 2v20M4.9 6.9l14.2 10.2M19.1 6.9L4.9 17.1M9 3l3 3 3-3M9 21l3-3 3 3"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3.2"/>',
  spiral: '<path d="M12 12a1.5 1.5 0 113 0 3.5 3.5 0 01-7 0 5.5 5.5 0 0111 0 7.5 7.5 0 01-15 0A9.5 9.5 0 0121.5 12"/>',
  min: '<path d="M5 12h14"/>',
  max: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>'
};

const svg = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full">${ICONS[name] || ''}</svg>`;

const PAGES = [
  ['trip', 'Overview'],
  ['cheats', 'Cheats'],
  ['physics', 'Physics'],
  ['lab', 'Practice'],
  ['maps', 'Maps'],
  ['binds', 'Controls'],
  ['guts', 'Variables'],
  ['setup', 'Setup']
];

const CHEATS = [
  { id: 'god', name: 'God mode', icon: 'heart', desc: "Health stays full and you can't take damage." },
  { id: 'nocd', name: 'No cooldowns', icon: 'bolt', desc: 'Dashes, surfs and the rest are ready again right away.' },
  { id: 'infmeter', name: 'Infinite meter', icon: 'battery', desc: 'Stamina, energy and boost style bars stay full.' },
  { id: 'airjumps', name: 'Infinite air jumps', icon: 'wing', desc: 'Jump as many times as you want in the air.' },
  { id: 'nokill', name: 'No kill zones', icon: 'skull', desc: 'Kill zones stop resetting you, so you can fall anywhere.' },
  { id: 'ghost', name: 'Ghost mode', icon: 'ghost', desc: 'Turns off collision so you fly through walls and floors.' },
  { id: 'freeze', name: 'Freeze in place', icon: 'snow', desc: 'Holds you where you are, even mid-air.' },
  { id: 'fevercam', name: 'Fever cam', icon: 'eye', desc: 'Field of view swells in and out on its own.' },
  { id: 'spin', name: 'Spin cycle', icon: 'spiral', desc: 'The camera keeps turning and you have to deal with it.' }
];

const SLIDERS = [
  { id: 'pspeed', name: 'Your speed', min: 0.25, max: 4, step: 0.05, def: 1, q: [0.5, 1, 2], fmt: (v) => v.toFixed(2) + 'x', desc: 'Speeds up you, your moves and your abilities.' },
  { id: 'wspeed', name: 'World speed', min: 0.05, max: 2, step: 0.05, def: 1, q: [0.25, 0.5, 1], fmt: (v) => v.toFixed(2) + 'x', desc: 'Slow motion for learning hard sections.' },
  { id: 'jump', name: 'Jump height', min: 0.25, max: 5, step: 0.05, def: 1, q: [0.5, 1, 2], fmt: (v) => v.toFixed(2) + 'x', desc: 'How hard jumps push off.' },
  { id: 'grav', name: 'Gravity', min: -1, max: 3, step: 0.05, def: 1, q: [0, 1, 2], fmt: (v) => v.toFixed(2) + 'x', desc: 'Below zero and you fall up.' },
  { id: 'air', name: 'Air control', min: 0, max: 6, step: 0.05, def: 1, q: [0.5, 1, 3], fmt: (v) => v.toFixed(2) + 'x', desc: 'How much you can steer in the air.' },
  { id: 'scale', name: 'Size', min: 0.2, max: 5, step: 0.05, def: 1, q: [0.5, 1, 2], fmt: (v) => v.toFixed(2) + 'x', desc: 'Shrink down or get huge.' },
  { id: 'fov', name: 'Field of view', min: 50, max: 150, step: 1, def: 50, q: [50, 90, 120], fmt: (v) => (v <= 50 ? 'Game' : v + '°'), desc: 'Zoom out to see more of the course.' }
];

const PRESETS = [
  { name: 'Off', set: {} },
  { name: 'Practice', set: { nokill: true, nocd: true, infmeter: true, wspeed: 0.6 } },
  { name: 'Untouchable', set: { god: true, nocd: true, infmeter: true, airjumps: true, nokill: true, pspeed: 1.4 } },
  { name: 'Fever', set: { fevercam: true, scale: 0.5, grav: 0.45, pspeed: 1.6, airjumps: true, nokill: true } }
];

const MOVES = [
  { n: 'Dash', m: ['dash'], x: ['air', 'marble'], d: 'Quick burst along the ground' },
  { n: 'Air dash', m: ['airdash'], d: 'Burst while airborne' },
  { n: 'Air jump', m: ['airjump', 'doublejump'], d: 'Extra jump in the air' },
  { n: 'Marble dash', m: ['marbledash', 'marble'], d: 'Turn into the marble and launch' },
  { n: 'Floor surf', m: ['floorsurf', 'surf', 'slide'], d: 'Surf the floor without losing speed' },
  { n: 'Fast fall', m: ['fastfall', 'slam', 'dive'], d: 'Drop out of the air fast' },
  { n: 'Helicopter', m: ['heli', 'copter', 'hover'], d: 'Spin to hang in the air' },
  { n: 'Wall cling', m: ['wallcling', 'cling', 'wall'], d: 'Stick to a wall for a moment' },
  { n: 'Zen jump', m: ['zenjump', 'zen'], d: 'The big special jump' },
  { n: 'Somersault', m: ['somersault', 'flip'], d: 'Flip' },
  { n: 'Jump', m: ['jump'], x: ['air', 'zen'], d: 'Regular jump' },
  { n: 'Move', m: ['move'], d: 'Run around' },
  { n: 'Look', m: ['look', 'mouselook'], d: 'Camera' }
];

const HK_LABELS = {
  god: 'God mode',
  nocd: 'No cooldowns',
  infmeter: 'Infinite meter',
  airjumps: 'Infinite air jumps',
  nokill: 'No kill zones',
  ghost: 'Ghost mode',
  slowmo: 'Slow motion',
  save1: 'Save spot 1',
  load1: 'Warp to spot 1',
  boost: 'Boost forward',
  freeze: 'Freeze in place',
  fevercam: 'Fever cam',
  timer: 'Start or stop timer',
  overlay: 'Show overlay'
};

const GEMS = [
  { n: 'Diamond', c: '#bdebff', within: 0 },
  { n: 'Emerald', c: '#3fd39a', within: 0.02 },
  { n: 'Gold', c: '#ffc83a', within: 0.05 },
  { n: 'Steel', c: '#a9b4c8', within: 0.1 },
  { n: 'Rock', c: '#8a7b6b', within: 0.2 },
  { n: 'Coal', c: '#4a4a5a', within: Infinity }
];

const MODES = { 0: 'None', 1: 'On the ground', 2: 'On the ground', 3: 'In the air', 4: 'Swimming', 5: 'Flying', 6: 'Special move' };
const OWNERS = { char: 'You', cmc: 'Movement', ctrl: 'Controller', mode: 'Game mode', inst: 'Game' };

const defaults = () => ({ god: false, nocd: false, infmeter: false, airjumps: false, nokill: false, ghost: false, freeze: false, fevercam: false, spin: false, pspeed: 1, wspeed: 1, jump: 1, grav: 1, air: 1, scale: 1, fov: 0, locks: {} });

let info = null;
let cfg = defaults();
let link = 'offline';
let live = null;
let liveError = null;
let unit = 'kmh';
let page = 'trip';
let slots = {};
let names = {};
let runs = {};
let lastChar = null;
const stats = { top: 0, air: 0, total: 0, dist: 0, resp: 0, lastPos: null };
const spark = [];
let trail = [];
let trailLevel = '';
let showGhost = true;
const timer = { state: 'idle', start: 0, elapsed: 0, loop: false, route: [] };
let listening = null;

const level = () => (live && live.level) || 'unknown';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function toast(text, good = true) {
  const t = document.createElement('div');
  t.className = 'toast board rounded-lg px-4 py-2 dot text-xl';
  if (!good) t.style.color = '#ff8fb8';
  t.textContent = text.toUpperCase();
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

async function safely(fn, okMsg) {
  try {
    const r = await fn();
    if (okMsg) toast(okMsg);
    return r;
  } catch (e) {
    toast(String(e.message || e).replace(/^Error invoking remote method '[^']+': (Error: )?/, ''), false);
    return null;
  }
}

function setBoard(el, text, flap = true) {
  const old = el.dataset.v || '';
  if (old === text) return;
  el.dataset.v = text;
  if (!flap) {
    el.textContent = text;
    return;
  }
  const cell = (ch) => (ch === ' ' ? '&nbsp;' : esc(ch));
  el.innerHTML = [...text].map((ch, i) => (ch !== old[i] ? `<span class="flap" style="animation-delay:${i * 22}ms">${cell(ch)}</span>` : cell(ch))).join('');
}

function prettyKey(k) {
  if (!k) return '';
  const map = { SpaceBar: 'Space', LeftShift: 'Left Shift', RightShift: 'Right Shift', LeftControl: 'Left Ctrl', RightControl: 'Right Ctrl', LeftAlt: 'Left Alt', LeftMouseButton: 'Left click', RightMouseButton: 'Right click', MiddleMouseButton: 'Middle click', MouseX: 'Mouse', MouseY: 'Mouse', Mouse2D: 'Mouse', MouseScrollUp: 'Wheel up', MouseScrollDown: 'Wheel down', Gamepad_FaceButton_Bottom: 'Pad A', Gamepad_FaceButton_Right: 'Pad B', Gamepad_FaceButton_Left: 'Pad X', Gamepad_FaceButton_Top: 'Pad Y', Gamepad_LeftShoulder: 'LB', Gamepad_RightShoulder: 'RB', Gamepad_LeftTrigger: 'LT', Gamepad_RightTrigger: 'RT', Gamepad_Left2D: 'Left stick', Gamepad_Right2D: 'Right stick', Escape: 'Esc' };
  return map[k] || k.replace(/^Gamepad_/, 'Pad ').replace(/_/g, ' ');
}

const prettyAcc = (a) => (a ? a.replace(/CommandOrControl|Control/g, 'Ctrl').replace(/\+/g, ' + ').replace(/num(\d)/g, 'Num $1') : 'None');

function commit() {
  hb.cfg(cfg);
  renderToggles();
  renderSliders(false);
  pushMini();
}

function flip(id, silent) {
  cfg[id] = !cfg[id];
  commit();
  const c = CHEATS.find((x) => x.id === id);
  if (!silent) toast(`${c ? c.name : id} ${cfg[id] ? 'on' : 'off'}`, cfg[id]);
}

function cheatRow(c, small) {
  return `<button class="w-full flex items-center gap-4 ${small ? 'py-3' : 'py-4'} text-left border-b border-rail/60 -mx-2 px-2 rounded-md" data-cheat="${c.id}">
    <span class="w-5 h-5 shrink-0 text-lilac">${svg(c.icon)}</span>
    <span class="flex-1 min-w-0">
      <span class="block font-semibold">${c.name}</span>
      ${small ? '' : `<span class="block text-xs text-mute mt-0.5">${c.desc}</span><span class="chips flex flex-wrap gap-1"></span>`}
    </span>
    <span class="grab text-xs text-mute whitespace-nowrap"></span>
    <span class="key" data-hk="${c.id}"></span>
    <span class="lever"></span>
  </button>`;
}

function buildCheats() {
  $('#cheatGrid').innerHTML = CHEATS.map((c) => cheatRow(c, false)).join('');
  $('#quickGrid').innerHTML = CHEATS.slice(0, 6).map((c) => cheatRow(c, true)).join('');
  $$('[data-cheat]').forEach((b) => b.addEventListener('click', () => flip(b.dataset.cheat)));
  $('#presetRow').innerHTML = PRESETS.map((p, i) => `<button data-preset="${i}" class="btn h-8 px-3 text-xs font-medium hover:bg-rail/50 ${i ? 'border-l border-rail' : ''}">${p.name}</button>`).join('');
  $$('[data-preset]').forEach((b) =>
    b.addEventListener('click', () => {
      const p = PRESETS[+b.dataset.preset];
      cfg = Object.assign(defaults(), p.set, { locks: cfg.locks });
      commit();
      toast(p.name === 'Off' ? 'Everything off' : `${p.name} on`);
    })
  );
}

function renderToggles() {
  const touched = (live && live.touched) || {};
  $$('[data-cheat]').forEach((b) => {
    const id = b.dataset.cheat;
    const on = !!cfg[id];
    b.classList.toggle('is-on', on);
    b.classList.toggle('row-on', on);
    const list = touched[id] || [];
    const g = $('.grab', b);
    if (g) g.textContent = on && link === 'live' ? (list.length ? `Holding ${list.length}` : 'Looking') : '';
    const chips = $('.chips', b);
    if (chips) {
      const html = on && list.length ? list.slice(0, 8).map((n) => `<span class="mt-1.5 px-1.5 rounded bg-amber/10 text-amber text-[11px]">${esc(n)}</span>`).join('') + (list.length > 8 ? `<span class="mt-1.5 text-[11px] text-mute">and ${list.length - 8} more</span>` : '') : '';
      if (chips.innerHTML !== html) chips.innerHTML = html;
    }
  });
  $$('[data-preset]').forEach((b) => {
    const p = PRESETS[+b.dataset.preset];
    const d = defaults();
    const match = Object.keys(d).filter((k) => k !== 'locks').every((k) => (k in p.set ? p.set[k] : d[k]) === cfg[k]);
    b.classList.toggle('btn-main', match);
  });
}

const sliderVal = (s) => (s.id === 'fov' ? (cfg.fov > 0 ? cfg.fov : 50) : cfg[s.id]);

function buildSliders() {
  $('#sliderGrid').innerHTML = SLIDERS.map(
    (s) => `<div class="grid grid-cols-[190px_1fr_80px_140px] items-center gap-5 py-4" data-slider="${s.id}">
      <div><div class="font-semibold">${s.name}</div><div class="text-xs text-mute mt-0.5">${s.desc}</div></div>
      <input type="range" class="fader" min="${s.min}" max="${s.max}" step="${s.step}" aria-label="${s.name}">
      <div class="sval dot text-xl text-right"></div>
      <div class="flex justify-self-end rounded-md border border-rail overflow-hidden">${s.q.map((v, i) => `<button data-q="${v}" class="btn h-7 px-2 text-xs hover:bg-rail/50 ${i ? 'border-l border-rail' : ''}">${s.id === 'fov' && v === 50 ? 'Game' : v}</button>`).join('')}</div>
    </div>`
  ).join('');
  SLIDERS.forEach((s) => {
    const row = $(`[data-slider="${s.id}"]`);
    const input = $('input', row);
    const set = (v) => {
      v = Number(v);
      if (s.id === 'fov') cfg.fov = v <= 50 ? 0 : v;
      else cfg[s.id] = v;
      commit();
    };
    input.addEventListener('input', () => set(input.value));
    input.addEventListener('dblclick', () => set(s.def));
    $$('[data-q]', row).forEach((b) => b.addEventListener('click', () => set(b.dataset.q)));
  });
  renderSliders(true);
}

function renderSliders(force) {
  SLIDERS.forEach((s) => {
    const row = $(`[data-slider="${s.id}"]`);
    if (!row) return;
    const input = $('input', row);
    const v = sliderVal(s);
    if (force || document.activeElement !== input) input.value = v;
    input.style.setProperty('--fill', ((v - s.min) / (s.max - s.min)) * 100 + '%');
    const val = $('.sval', row);
    val.textContent = s.fmt(Number(v));
    val.classList.toggle('dot-dim', Number(v) === s.def);
  });
}

function buildNav() {
  $('#nav').innerHTML = PAGES.map(([id, label]) => `<button class="stop flex items-center gap-3 px-3.5 text-left" data-nav="${id}"><span class="ring shrink-0"></span><span class="lbl text-mute font-medium">${label}</span></button>`).join('');
  $$('[data-nav]').forEach((b) => b.addEventListener('click', () => go(b.dataset.nav)));
}

function go(p) {
  page = p;
  $$('[data-nav]').forEach((b) => b.classList.toggle('active', b.dataset.nav === p));
  $$('.page').forEach((s) => s.classList.toggle('active', s.dataset.page === p));
  if (p === 'lab') requestAnimationFrame(drawMap);
  if (p === 'guts') renderGuts(true);
  if (p === 'trip') requestAnimationFrame(drawSpark);
  if (p === 'maps') loadMaps();
}

function renderHotkeyBadges() {
  const hk = (info && info.hotkeys) || {};
  $$('[data-hk]').forEach((el) => {
    el.textContent = prettyAcc(hk[el.dataset.hk]);
    el.classList.toggle('opacity-40', !info || !info.hotkeysOn);
  });
}

function buildHotkeys() {
  const hk = info.hotkeys;
  $('#hkList').innerHTML = Object.keys(HK_LABELS)
    .map((k) => `<div class="flex items-center justify-between py-2 border-b border-rail/60 last:border-0"><span class="text-sm">${HK_LABELS[k]}</span><button class="key btn" data-rebind="${k}">${prettyAcc(hk[k])}</button></div>`)
    .join('');
  $$('[data-rebind]').forEach((b) =>
    b.addEventListener('click', () => {
      buildHotkeys();
      listening = b.dataset.rebind;
      const nb = $(`[data-rebind="${listening}"]`);
      nb.classList.add('listening');
      nb.textContent = 'Press a key';
    })
  );
  $('#hkToggle .lever').classList.toggle('is-on', !!info.hotkeysOn);
  renderHotkeyBadges();
}

function accFromEvent(e) {
  const k = e.key;
  if (['Shift', 'Control', 'Alt', 'Meta'].includes(k)) return null;
  let key = null;
  if (/^F\d{1,2}$/.test(k)) key = k;
  else if (e.code.startsWith('Numpad') && /\d/.test(e.code)) key = 'num' + e.code.slice(6);
  else if (/^Key[A-Z]$/.test(e.code)) key = e.code.slice(3);
  else if (/^Digit\d$/.test(e.code)) key = e.code.slice(5);
  else if (['Insert', 'Delete', 'Home', 'End', 'PageUp', 'PageDown'].includes(k)) key = k;
  else if (k.startsWith('Arrow')) key = k.slice(5);
  if (!key) return null;
  const mods = [];
  if (e.ctrlKey) mods.push('Ctrl');
  if (e.altKey) mods.push('Alt');
  if (e.shiftKey) mods.push('Shift');
  return [...mods, key].join('+');
}

window.addEventListener('keydown', async (e) => {
  if (!listening) return;
  e.preventDefault();
  const map = { ...info.hotkeys };
  if (e.key === 'Escape') {
    listening = null;
    buildHotkeys();
    return;
  }
  if (e.key === 'Backspace') map[listening] = '';
  else {
    const acc = accFromEvent(e);
    if (!acc) return;
    for (const k of Object.keys(map)) if (map[k] === acc) map[k] = '';
    map[listening] = acc;
  }
  listening = null;
  info = await hb.hotkeys(map);
  buildHotkeys();
});

function bindRow(label, keysHtml, sub = '') {
  return `<div class="flex items-center justify-between gap-3 py-2.5"><div class="min-w-0"><div class="text-sm font-medium truncate">${label}</div>${sub ? `<div class="text-xs text-mute">${sub}</div>` : ''}</div><div class="flex flex-wrap justify-end gap-1 shrink-0">${keysHtml}</div></div>`;
}

function renderBinds() {
  const binds = (live && live.binds) || [];
  const rows = [];
  const seen = new Set();
  for (const b of binds) {
    let label, key, extra = '';
    if (b[0] === 'imc') [label, key, extra] = [b[2].replace(/^IA_/, '').replace(/_/g, ' '), b[3], b[4] || ''];
    else if (b[0] === 'legacy') [label, key, extra] = [b[2], b[3], b[1] === 'axis' ? '' : b[4]];
    else if (b[0] === 'bp' && b[2] !== 'enhanced') [label, key] = [b[2] === 'key' || b[2] === 'axiskey' ? 'Other key the game listens for' : b[3], b[2] === 'key' || b[2] === 'axiskey' ? b[3] : ''];
    else continue;
    const id = label + key;
    if (seen.has(id)) continue;
    seen.add(id);
    rows.push({ label: label.replace(/([a-z])([A-Z])/g, '$1 $2'), key, extra });
  }
  if (!rows.length) {
    $('#bindsNote').textContent = link === 'live' ? "The game hasn't exposed any controls yet. Press Read again once you're in a level." : 'Not connected, so these are the usual Unreal defaults. Connect to read the real ones.';
    $('#gameBinds').innerHTML = [['Move', ['W', 'A', 'S', 'D']], ['Jump', ['Space']], ['Look', ['Mouse']], ['Pause', ['Esc']]].map(([l, ks]) => bindRow(l, ks.map((k) => `<span class="key">${k}</span>`).join(''))).join('');
    return;
  }
  $('#bindsNote').textContent = `Read live from the game. ${rows.length} bindings.`;
  const grouped = {};
  for (const r of rows) (grouped[r.label] = grouped[r.label] || []).push(r);
  $('#gameBinds').innerHTML = Object.entries(grouped)
    .map(([l, rs]) => {
      const hold = rs.find((r) => /hold/i.test(r.extra));
      return bindRow(esc(l), rs.filter((r) => r.key).map((r) => `<span class="key">${esc(prettyKey(r.key))}</span>`).join(''), hold ? 'Hold' : '');
    })
    .join('');
}

function moveKeys(mv) {
  const keys = new Set();
  for (const b of (live && live.binds) || []) {
    if (b[0] !== 'imc' && b[0] !== 'legacy') continue;
    const n = b[2].toLowerCase().replace(/[^a-z]/g, '').replace(/^ia/, '');
    if (mv.m.some((t) => n.includes(t)) && !(mv.x || []).some((t) => n.includes(t))) keys.add(prettyKey(b[3]));
  }
  return [...keys];
}

function renderMoves() {
  $('#movesList').innerHTML = MOVES.map((mv) => {
    const keys = moveKeys(mv);
    return bindRow(mv.n, keys.length ? keys.slice(0, 3).map((k) => `<span class="key">${esc(k)}</span>`).join('') : '<span class="text-xs text-mute">Unknown</span>', mv.d);
  }).join('');
}

function slotList() {
  const l = level();
  slots[l] = slots[l] || [null, null, null, null, null];
  names[l] = names[l] || ['Start', '', '', '', ''];
  return slots[l];
}

function renderSlots() {
  const list = slotList();
  const nm = names[level()];
  $('#slotGrid').innerHTML = list
    .map(
      (s, i) => `<div class="grid grid-cols-[28px_1fr_190px_auto] items-center gap-4 py-2.5">
        <span class="dot text-2xl ${s ? '' : 'dot-dim'}">${i + 1}</span>
        <input data-sname="${i}" value="${esc(nm[i] || '')}" placeholder="Name this spot" aria-label="Spot ${i + 1} name" class="field h-8 rounded-md px-3 text-sm min-w-0 bg-transparent border-transparent hover:border-rail">
        <span class="text-xs text-mute tabular-nums">${s ? s.map((n) => Math.round(n)).join(', ') : 'Empty'}</span>
        <span class="flex gap-1.5">
          <button data-ssave="${i}" class="btn btn-line h-8 px-3 rounded-md text-xs">Save here</button>
          <button data-sload="${i}" class="btn h-8 px-3 rounded-md text-xs ${s ? 'btn-main' : 'text-mute border border-rail/50'}" ${s ? '' : 'disabled'}>Warp</button>
          <button data-sclear="${i}" aria-label="Clear spot ${i + 1}" class="btn w-8 h-8 rounded-md grid place-items-center text-mute hover:text-rose ${s ? '' : 'invisible'}"><span class="w-3.5 h-3.5">${svg('x')}</span></button>
        </span>
      </div>`
    )
    .join('');
  $$('[data-ssave]').forEach((b) => b.addEventListener('click', () => saveSlot(+b.dataset.ssave)));
  $$('[data-sload]').forEach((b) => b.addEventListener('click', () => loadSlot(+b.dataset.sload)));
  $$('[data-sclear]').forEach((b) =>
    b.addEventListener('click', () => {
      slotList()[+b.dataset.sclear] = null;
      hb.slots(slots, names);
      renderSlots();
      drawMap();
    })
  );
  $$('[data-sname]').forEach((inp) =>
    inp.addEventListener('change', () => {
      names[level()][+inp.dataset.sname] = inp.value;
      hb.slots(slots, names);
    })
  );
}

function saveSlot(i) {
  if (link !== 'live' || !live.pos) return toast('Get in a level first', false);
  slotList()[i] = live.pos.slice();
  hb.slots(slots, names);
  renderSlots();
  drawMap();
  toast(`Spot ${i + 1} saved`);
}

function loadSlot(i) {
  const s = slotList()[i];
  if (!s) return toast(`Spot ${i + 1} is empty`, false);
  if (link !== 'live') return toast('Game not connected', false);
  hb.event('tp_goto', s.map((n) => n.toFixed(1)).join(','));
  if (timer.loop) {
    timer.state = 'armed';
    timer.elapsed = 0;
    timer.route = [];
    renderTimer();
  }
  toast(`Warped to ${names[level()][i] || 'spot ' + (i + 1)}`);
}

function fmtTime(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const c = Math.floor((ms % 1000) / 10);
  return `${m}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
}

function timerToggle() {
  if (timer.state === 'idle' || timer.state === 'armed') {
    timer.state = 'running';
    timer.start = performance.now();
    timer.route = [];
  } else if (timer.state === 'running') {
    timer.state = 'stopped';
    timer.elapsed = performance.now() - timer.start;
    recordRun(timer.elapsed);
  } else {
    timer.state = 'idle';
    timer.elapsed = 0;
  }
  renderTimer();
}

function gemFor(t, best) {
  const off = (t - best) / best;
  return GEMS.find((g) => off <= g.within + 1e-9);
}

function recordRun(t) {
  const l = level();
  const r = (runs[l] = runs[l] || { attempts: [], best: null, bestRoute: [] });
  const isBest = !r.best || t < r.best;
  r.attempts.unshift({ t, at: Date.now() });
  r.attempts = r.attempts.slice(0, 40);
  if (isBest) {
    r.best = t;
    const step = Math.max(1, Math.ceil(timer.route.length / 700));
    r.bestRoute = timer.route.filter((_, i) => i % step === 0);
    toast(`New best ${fmtTime(t)}`);
  } else {
    toast(`${fmtTime(t)}, ${((t - r.best) / 1000).toFixed(2)}s slower`, false);
  }
  hb.runs(runs);
  renderRuns();
}

function renderRuns() {
  const r = runs[level()];
  if (!r || !r.attempts.length) {
    $('#runList').innerHTML = '<p class="text-xs text-mute leading-relaxed">No runs on this level yet. Turn on auto-arm, warp to a spot, and the timer starts as soon as you move. Stop it with the hotkey when you finish.</p>';
    return;
  }
  $('#runList').innerHTML = r.attempts
    .slice(0, 14)
    .map((a, i) => {
      const g = gemFor(a.t, r.best);
      const d = a.t - r.best;
      return `<div class="grid grid-cols-[18px_70px_1fr_auto] items-center gap-2 py-1.5 border-b border-rail/40 last:border-0">
        <span class="gem" style="background:${g.c}"></span>
        <span class="text-xs text-mute">${g.n}</span>
        <span class="text-sm tabular-nums font-medium">${fmtTime(a.t)}</span>
        <span class="text-xs tabular-nums ${d === 0 ? 'text-amber' : 'text-mute'}">${d === 0 ? 'Best' : '+' + (d / 1000).toFixed(2)}</span>
      </div>`;
    })
    .join('');
}

function renderTimer() {
  const t = timer.state === 'running' ? performance.now() - timer.start : timer.elapsed;
  const s = fmtTime(t);
  $('#timerNum').textContent = s;
  setBoard($('#bTimer'), s, false);
  $('#bTimer').classList.toggle('dot-dim', timer.state === 'idle');
  $('#timerNum').classList.toggle('dot-dim', timer.state === 'idle');
  $('#timerSub').textContent = { idle: 'Stopped', armed: 'Armed. Starts when you move.', running: 'Running', stopped: 'Finished. Press again to clear.' }[timer.state];
  $('#timerGo').textContent = timer.state === 'running' ? 'Stop' : timer.state === 'stopped' ? 'Clear' : 'Start';
  $('#loopToggle .lever').classList.toggle('is-on', timer.loop);
}

const speedOf = (s) => (s && s.vel ? Math.hypot(s.vel[0], s.vel[1]) : 0);
const showSpeed = (us) => (unit === 'kmh' ? us * 0.036 : us);

function onState(msg) {
  const prevLink = link;
  link = msg.link;
  live = msg.state;
  liveError = msg.error;
  setBoard($('#bLink'), { offline: 'OFFLINE', waiting: 'WAITING', live: 'LINKED' }[link]);
  $('#bLink').style.color = { offline: '#ff8fb8', waiting: '', live: '#6fe3b4' }[link];
  $('#linkDot').style.background = { offline: '#ff8fb8', waiting: '#ffb21a', live: '#6fe3b4' }[link];
  if (prevLink !== link) {
    if (link === 'live') toast('Connected');
    renderLinkCard();
    renderSetup();
    renderBinds();
    renderMoves();
  }
  if (info && msg.gameRunning !== info.gameRunning) {
    info.gameRunning = msg.gameRunning;
    renderLinkCard();
    renderSetup();
  }
  $('#errBox').classList.toggle('hidden', !liveError);
  if (liveError) $('#errBox').textContent = liveError;
  if (link !== 'live' || !live) {
    renderNowPlaying();
    setBoard($('#bLevel'), '--------');
    setBoard($('#bSpeed'), '000', false);
    pushMini();
    return;
  }
  setBoard($('#bLevel'), live.map_status === 'loaded' && live.map_name ? live.map_name.toUpperCase().slice(0, 18) : (live.level || 'UNKNOWN').replace(/^LV_/, '').toUpperCase());
  if (live.level && live.level !== trailLevel) {
    trailLevel = live.level;
    trail = [];
    renderSlots();
    renderRuns();
  }
  if (lastChar && live.char && live.char !== lastChar) {
    stats.resp += 1;
    $('#stResp').textContent = stats.resp;
    renderBinds();
    renderMoves();
  }
  lastChar = live.char;
  const sp = speedOf(live);
  stats.top = Math.max(stats.top, sp);
  stats.total += 1;
  if (live.mode === '3') stats.air += 1;
  if (live.pos) {
    if (stats.lastPos) {
      const d = Math.hypot(live.pos[0] - stats.lastPos[0], live.pos[1] - stats.lastPos[1], live.pos[2] - stats.lastPos[2]);
      if (d < 4000) stats.dist += d;
    }
    stats.lastPos = live.pos;
    const last = trail[trail.length - 1];
    if (!last || Math.hypot(live.pos[0] - last[0], live.pos[1] - last[1]) > 40) {
      trail.push([live.pos[0], live.pos[1], sp]);
      if (trail.length > 5000) trail.shift();
    }
    if (timer.state === 'running') timer.route.push([live.pos[0], live.pos[1]]);
    $('#mapPos').textContent = `X ${Math.round(live.pos[0])}   Y ${Math.round(live.pos[1])}   Z ${Math.round(live.pos[2])}`;
  }
  if (timer.state === 'armed' && sp > 60) {
    timer.state = 'running';
    timer.start = performance.now();
    timer.route = [];
  }
  spark.push(sp);
  if (spark.length > 400) spark.shift();
  const shown = Math.round(showSpeed(sp));
  $('#speedNum').textContent = shown;
  setBoard($('#bSpeed'), String(shown).padStart(3, '0'), false);
  $('#topSpeed').textContent = Math.round(showSpeed(stats.top));
  $('#stAir').textContent = Math.round((stats.air / Math.max(1, stats.total)) * 100) + '%';
  $('#stDist').textContent = stats.dist > 100000 ? (stats.dist / 100000).toFixed(2) + ' km' : Math.round(stats.dist / 100) + ' m';
  $('#stMode').textContent = MODES[live.mode] || '-';
  renderToggles();
  if (page === 'guts') renderGuts(false);
  if (page === 'lab') drawMap();
  if (page === 'trip') drawSpark();
  renderNowPlaying();
  if (live.map_status && live.map_status !== 'none' && live.map_running === '1') setBoard($('#bTimer'), fmtSec(parseFloat(live.map_time || 0)), false);
  pushMini();
}

function renderLinkCard() {
  const t = $('#linkTitle');
  const h = $('#linkHelp');
  const c = $('#linkCta');
  c.classList.remove('hidden');
  const setup = () => go('setup');
  if (!info || !info.gameDir) {
    [t.textContent, h.textContent, c.textContent, c.onclick] = ["Can't find the game", 'Point Hyperboi at your Hyperballin folder.', 'Open setup', setup];
  } else if (!info.modInstalled || !info.ue4ss) {
    [t.textContent, h.textContent, c.textContent, c.onclick] = ['Hook not installed', 'One click in setup, then launch the game.', 'Open setup', setup];
  } else if (info.hookDisabled) {
    [t.textContent, h.textContent, c.textContent, c.onclick] = ['Hook is off', 'Turn it back on in setup.', 'Open setup', setup];
  } else if (link === 'live') {
    [t.textContent, h.textContent, c.textContent, c.onclick] = ['Connected', 'Changes hit the game instantly. Hotkeys work in game too.', 'Open cheats', () => go('cheats')];
  } else if (info.gameRunning || link === 'waiting') {
    t.textContent = 'Game is open';
    h.textContent = "Waiting for you to load into a level. If it stays like this, check setup.";
    c.classList.add('hidden');
  } else {
    [t.textContent, h.textContent, c.textContent, c.onclick] = ['Game is closed', 'Everything is installed.', 'Launch Hyperballin', () => safely(() => hb.launch(), 'Launching')];
  }
}

function renderSetup() {
  if (!info) return;
  $('#gamePath').textContent = info.gameDir || "Couldn't find it on its own. Press Browse and pick project_garden.exe or its folder.";
  const ok = [!!info.gameDir, !!info.gameDir && info.ue4ss && info.modInstalled && !info.hookDisabled, link === 'live'];
  ok.forEach((v, i) => {
    const li = $(`#step${i + 1}`);
    li.style.borderColor = v ? '#ffb21a' : 'transparent';
    $('.stepnum', li).classList.toggle('dot-dim', !v);
  });
  $('#installBtn').textContent = info.ue4ss && info.modInstalled ? 'Reinstall hook' : 'Install hook';
  $('#toggleHookBtn').textContent = info.hookDisabled ? 'Turn hook on' : 'Turn hook off';
  $('#launchBtn').textContent = info.gameRunning ? 'Game is running' : 'Launch game';
  $('#playText').textContent = ok[2] ? `Connected to ${live && live.level ? live.level : 'the game'}. You're set.` : 'Launch Hyperballin and load into a level. The board up top says LINKED when it works.';
}

function sizeCanvas(c) {
  const r = c.getBoundingClientRect();
  const dpr = devicePixelRatio || 1;
  if (r.width && c.width !== Math.round(r.width * dpr)) {
    c.width = Math.round(r.width * dpr);
    c.height = Math.round(r.height * dpr);
  }
  const x = c.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [x, r.width, r.height];
}

function drawSpark() {
  const [x, w, h] = sizeCanvas($('#spark'));
  if (!w) return;
  x.clearRect(0, 0, w, h);
  const cell = 4;
  const cols = Math.floor(w / cell);
  const rows = Math.floor(h / cell);
  const data = spark.slice(-cols);
  const max = Math.max(1500, ...spark) * 1.05;
  const off = cols - data.length;
  for (let i = 0; i < cols; i++) {
    const v = i >= off ? data[i - off] : 0;
    const lit = Math.round((v / max) * rows);
    for (let j = 0; j < rows; j++) {
      x.fillStyle = j < lit ? (j > rows * 0.8 ? '#ff8fb8' : '#ffb21a') : 'rgba(255,178,26,0.08)';
      x.fillRect(i * cell, h - (j + 1) * cell, cell - 1, cell - 1);
    }
  }
}

function lerpColor(a, b, t) {
  const pa = a.match(/\w\w/g).map((n) => parseInt(n, 16));
  const pb = b.match(/\w\w/g).map((n) => parseInt(n, 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
}

function drawMap() {
  const [x, w, h] = sizeCanvas($('#map'));
  if (!w) return;
  x.clearRect(0, 0, w, h);
  x.fillStyle = 'rgba(183,166,255,0.12)';
  for (let i = 12; i < w; i += 24) for (let j = 12; j < h; j += 24) x.fillRect(i, j, 1.5, 1.5);
  const ghost = (showGhost && runs[level()] && runs[level()].bestRoute) || [];
  const sl = (slots[level()] || []).filter(Boolean);
  const pts = [...trail.map((p) => [p[0], p[1]]), ...ghost, ...sl.map((s) => [s[0], s[1]])];
  if (live && live.pos) pts.push([live.pos[0], live.pos[1]]);
  if (!pts.length) {
    x.fillStyle = '#8c93bd';
    x.font = '13px "Familjen Grotesk", sans-serif';
    x.textAlign = 'center';
    x.fillText('Your path shows up here once you start moving.', w / 2, h / 2);
    return;
  }
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [a, b] of pts) {
    minX = Math.min(minX, a);
    maxX = Math.max(maxX, a);
    minY = Math.min(minY, b);
    maxY = Math.max(maxY, b);
  }
  const span = Math.max(maxX - minX, maxY - minY, 2000);
  const sc = (Math.min(w, h) - 40) / span;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const P = (a, b) => [w / 2 + (b - cy) * sc, h / 2 - (a - cx) * sc];
  if (ghost.length > 1) {
    x.setLineDash([4, 5]);
    x.strokeStyle = 'rgba(255,143,184,0.7)';
    x.lineWidth = 1.5;
    x.beginPath();
    ghost.forEach((p, i) => {
      const [u, v] = P(p[0], p[1]);
      i ? x.lineTo(u, v) : x.moveTo(u, v);
    });
    x.stroke();
    x.setLineDash([]);
  }
  x.lineWidth = 3;
  x.lineCap = 'round';
  for (let i = 1; i < trail.length; i++) {
    const [a, b] = P(trail[i - 1][0], trail[i - 1][1]);
    const [u, v] = P(trail[i][0], trail[i][1]);
    if (Math.hypot(u - a, v - b) > 80) continue;
    x.strokeStyle = lerpColor('#6b55d8', '#ffb21a', Math.min(trail[i][2] / 3000, 1));
    x.globalAlpha = 0.35 + 0.65 * (i / trail.length);
    x.beginPath();
    x.moveTo(a, b);
    x.lineTo(u, v);
    x.stroke();
  }
  x.globalAlpha = 1;
  (slots[level()] || []).forEach((s, i) => {
    if (!s) return;
    const [u, v] = P(s[0], s[1]);
    x.fillStyle = '#ebe8f7';
    x.fillRect(u - 8, v - 8, 16, 16);
    x.fillStyle = '#101735';
    x.font = '700 11px "Familjen Grotesk", sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(String(i + 1), u, v + 0.5);
  });
  if (live && live.pos) {
    const [u, v] = P(live.pos[0], live.pos[1]);
    x.strokeStyle = '#ffb21a';
    x.lineWidth = 2;
    x.beginPath();
    x.arc(u, v, 9, 0, Math.PI * 2);
    x.stroke();
    x.fillStyle = '#ffb21a';
    x.beginPath();
    x.arc(u, v, 4, 0, Math.PI * 2);
    x.fill();
  }
}

let gutsKeys = '';
let gutsOwner = 'all';

function renderGuts(force) {
  const vars = (live && live.vars) || [];
  const q = $('#gutsSearch').value.trim().toLowerCase();
  const shown = vars.filter((v) => (gutsOwner === 'all' || v.owner === gutsOwner) && (!q || v.name.toLowerCase().includes(q)));
  const keys = shown.map((v) => v.owner + ':' + v.name).join('\n');
  const rows = $('#gutsRows');
  if (force || keys !== gutsKeys) {
    gutsKeys = keys;
    const owners = ['all', ...new Set(vars.map((v) => v.owner))];
    $('#gutsOwners').innerHTML = owners.map((o, i) => `<button data-owner="${o}" class="btn h-10 px-3.5 text-xs font-medium hover:bg-rail/50 ${i ? 'border-l border-rail' : ''} ${o === gutsOwner ? 'btn-main' : ''}">${o === 'all' ? 'All' : OWNERS[o] || o}</button>`).join('');
    $$('[data-owner]').forEach((b) =>
      b.addEventListener('click', () => {
        gutsOwner = b.dataset.owner;
        renderGuts(true);
      })
    );
    if (!shown.length) {
      rows.innerHTML = `<p class="px-5 py-10 text-center text-sm text-mute">${link === 'live' ? 'No variables match that search.' : 'Connect to the game and its variables show up here.'}</p>`;
      return;
    }
    rows.innerHTML = shown
      .map((v) => {
        const key = v.owner + ':' + v.name;
        const locked = key in cfg.locks;
        const isBool = v.t === 'BoolProperty';
        return `<div class="vrow grid grid-cols-[100px_1fr_80px_130px_160px_56px] gap-3 items-center px-5 py-2 border-b border-rail/40 ${locked ? 'row-on' : ''}" data-key="${esc(key)}">
          <div class="text-xs text-mute">${OWNERS[v.owner] || v.owner}</div>
          <div class="text-sm truncate" title="${esc(v.name)}">${esc(v.name)}</div>
          <div class="text-xs text-mute">${{ BoolProperty: 'Yes / no', IntProperty: 'Whole', Int64Property: 'Whole', ByteProperty: 'Small', FloatProperty: 'Decimal', DoubleProperty: 'Decimal' }[v.t] || v.t}</div>
          <div class="gval text-sm tabular-nums text-amber truncate"></div>
          <div>${isBool ? `<button class="gflip btn btn-line h-8 px-3 rounded-md text-xs">Flip</button>` : `<input class="gset field w-full h-8 rounded-md px-2.5 text-xs" aria-label="New value for ${esc(v.name)}" placeholder="${locked ? 'Locked at ' + esc(cfg.locks[key]) : 'Type, then Enter'}">`}</div>
          <div><button class="glock btn" aria-label="Lock ${esc(v.name)}"><span class="lever ${locked ? 'is-on' : ''}"></span></button></div>
        </div>`;
      })
      .join('');
    $$('.vrow', rows).forEach((row) => {
      const key = row.dataset.key;
      const getV = () => ((live && live.vars) || []).find((v) => v.owner + ':' + v.name === key);
      const send = (val) => {
        if (key in cfg.locks) {
          cfg.locks[key] = val;
          commit();
        } else hb.event('set', `${key}|${val}`);
      };
      const inp = $('.gset', row);
      if (inp)
        inp.addEventListener('keydown', (e) => {
          if (e.key !== 'Enter' || inp.value === '' || isNaN(Number(inp.value))) return;
          send(inp.value);
          toast(`${key.split(':')[1]} set to ${inp.value}`);
          inp.value = '';
          inp.blur();
        });
      const fl = $('.gflip', row);
      if (fl) fl.addEventListener('click', () => send(getV() && getV().v === '1' ? '0' : '1'));
      $('.glock', row).addEventListener('click', () => {
        const v = getV();
        if (key in cfg.locks) delete cfg.locks[key];
        else if (v) cfg.locks[key] = v.v;
        commit();
        renderGuts(true);
      });
    });
  }
  for (const v of shown) {
    const cell = rows.querySelector(`[data-key="${CSS.escape(v.owner + ':' + v.name)}"] .gval`);
    if (cell) {
      const txt = v.t === 'BoolProperty' ? (v.v === '1' ? 'Yes' : 'No') : v.v;
      if (cell.textContent !== txt) cell.textContent = txt;
    }
  }
}

let mapsData = { ok: false, maps: [], best: {} };
const GEM_ORDER = ['diamond', 'emerald', 'gold', 'steel', 'rock'];
const GEM_COLOR = { diamond: '#bdebff', emerald: '#3fd39a', gold: '#ffc83a', steel: '#a9b4c8', rock: '#8a7b6b', coal: '#4a4a5a' };

function earnedGem(gems, t) {
  if (!t) return null;
  for (const g of GEM_ORDER) if (gems && gems[g] && t <= gems[g]) return g;
  return 'coal';
}

const fmtSec = (t) => fmtTime(t * 1000);

async function loadMaps() {
  mapsData = await window.hb.maps.list();
  renderMaps();
}

function renderMaps() {
  const box = $('#mapsList');
  if (!box) return;
  if (!mapsData.ok) {
    box.innerHTML = '<p class="py-8 text-center text-sm text-mute">Set up the game and install the hook first, then your maps live here.</p>';
    return;
  }
  if (!mapsData.maps.length) {
    box.innerHTML = '<p class="py-8 text-center text-sm text-mute">No maps yet. Make one in Builderballin, export it, and drop the file here.</p>';
    return;
  }
  const playing = live && live.map_file && live.map_status && live.map_status !== 'none' ? live.map_file : null;
  box.innerHTML = mapsData.maps
    .map((m) => {
      const best = (mapsData.best || {})[m.file];
      const gem = earnedGem(m.gems, best);
      const gemTimes = GEM_ORDER.filter((g) => m.gems && m.gems[g]).map((g) => `<span class="inline-flex items-center gap-1"><span class="gem" style="background:${GEM_COLOR[g]}"></span>${m.gems[g]}s</span>`).join('');
      return `<div class="grid grid-cols-[1fr_auto] gap-4 items-center py-4 border-b border-rail/60 last:border-0">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-semibold text-base">${esc(m.name)}</span>
            ${m.difficulty ? `<span class="px-1.5 rounded bg-lilac/15 text-lilac text-[11px] font-medium">${esc(m.difficulty)}</span>` : ''}
            ${m.author ? `<span class="text-xs text-mute">by ${esc(m.author)}</span>` : ''}
            ${playing === m.file ? '<span class="px-1.5 rounded bg-mint/15 text-mint text-[11px] font-medium">Playing</span>' : ''}
          </div>
          ${m.description ? `<p class="text-xs text-mute mt-1 truncate">${esc(m.description)}</p>` : ''}
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-mute">
            <span>${m.parts} parts, ${m.zones} zones, ${m.checkpoints} checkpoint${m.checkpoints === 1 ? '' : 's'}</span>
            ${gemTimes ? `<span class="flex items-center gap-3">${gemTimes}</span>` : ''}
            ${best ? `<span class="flex items-center gap-1.5 text-chalk"><span class="gem" style="background:${GEM_COLOR[gem]}"></span>Best ${fmtSec(best)}</span>` : ''}
          </div>
        </div>
        <div class="flex gap-1.5">
          ${m.ready ? `<button class="btn btn-main h-9 px-4 rounded-lg text-sm" data-play="${esc(m.file)}">Play</button>` : '<span class="text-xs text-rose self-center">Export it again</span>'}
          <button class="btn w-9 h-9 rounded-lg grid place-items-center text-mute hover:text-rose" data-remove="${esc(m.file)}" aria-label="Remove ${esc(m.name)}"><span class="w-4 h-4">${svg('x')}</span></button>
        </div>
      </div>`;
    })
    .join('');
  $$('[data-play]', box).forEach((b) =>
    b.addEventListener('click', () => {
      if (link !== 'live') return toast('Get into a level first', false);
      window.hb.event('map_load', b.dataset.play);
      toast('Loading map');
    })
  );
  $$('[data-remove]', box).forEach((b) =>
    b.addEventListener('click', async () => {
      mapsData = await window.hb.maps.remove(b.dataset.remove);
      renderMaps();
      toast('Map removed');
    })
  );
}

function renderNowPlaying() {
  const np = $('#nowPlaying');
  if (!np) return;
  const on = link === 'live' && live && live.map_status && live.map_status !== 'none';
  np.classList.toggle('hidden', !on);
  if (!on) {
    if (renderNowPlaying.was) renderMaps();
    renderNowPlaying.was = false;
    return;
  }
  if (!renderNowPlaying.was) renderMaps();
  renderNowPlaying.was = true;
  const st = live.map_status;
  setBoard($('#npName'), (live.map_name || live.map_file || '').toUpperCase().slice(0, 28));
  $('#npTime').textContent = fmtSec(parseFloat(live.map_time || 0));
  $('#npTime').classList.toggle('dot-dim', live.map_running !== '1' && !live.map_finish);
  $('#npCp').textContent = live.map_cp || '0/0';
  $('#npDeaths').textContent = live.map_deaths || '0';
  $('#npMsg').textContent = st.startsWith('loading') ? `Building the map, ${st.replace('loading ', '')} parts` : st === 'waiting' ? 'Waiting for you to load into a level' : st === 'error' ? live.map_error || 'Something went wrong' : live.map_msg || (live.map_finish ? `Finished in ${fmtSec(parseFloat(live.map_finish))}` : live.map_running === '1' ? 'Go go go' : 'Move to start the timer');
  if (live.map_finish && live.map_finish !== renderNowPlaying.fin) {
    renderNowPlaying.fin = live.map_finish;
    toast(`Finished in ${fmtSec(parseFloat(live.map_finish))}`);
    setTimeout(loadMaps, 400);
  }
}

function wireMaps() {
  $('#mapsBuilder').addEventListener('click', () => window.hb.maps.builder());
  $('#mapsFolder').addEventListener('click', () => window.hb.maps.folder());
  $('#mapsRefresh').addEventListener('click', loadMaps);
  const afterAdd = (r) => {
    if (!r) return;
    mapsData = r;
    renderMaps();
    if (r.added && r.added.length) toast(r.added.length === 1 ? 'Map added' : `${r.added.length} maps added`);
    if (r.skipped && r.skipped.length) toast(`Skipped ${r.skipped.join(', ')}`, false);
  };
  $('#mapsAdd').addEventListener('click', async () => afterAdd(await safely(() => window.hb.maps.pick())));
  $('#npRestart').addEventListener('click', () => window.hb.event('map_restart', ''));
  $('#npRespawn').addEventListener('click', () => window.hb.event('map_respawn', ''));
  $('#npUnload').addEventListener('click', () => {
    window.hb.event('map_unload', '');
    toast('Left the map');
  });
  const drop = $('#mapsDrop');
  window.addEventListener('dragover', (e) => {
    if (page !== 'maps') return;
    e.preventDefault();
    drop.classList.add('border-amber', 'text-amber');
  });
  window.addEventListener('dragleave', (e) => {
    if (e.relatedTarget) return;
    drop.classList.remove('border-amber', 'text-amber');
  });
  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    drop.classList.remove('border-amber', 'text-amber');
    if (page !== 'maps') go('maps');
    const paths = [...e.dataTransfer.files].map((f) => window.hb.maps.pathFor(f)).filter(Boolean);
    if (paths.length) afterAdd(await safely(() => window.hb.maps.add(paths)));
  });
}

function pushMini() {
  const active = CHEATS.filter((c) => cfg[c.id]).map((c) => c.name);
  if (cfg.wspeed !== 1) active.push(`World ${cfg.wspeed}x`);
  if (cfg.pspeed !== 1) active.push(`You ${cfg.pspeed}x`);
  const t = timer.state === 'running' ? performance.now() - timer.start : timer.elapsed;
  hb.miniData({ speed: Math.round(showSpeed(speedOf(live))), unit: unit === 'kmh' ? 'KM/H' : 'U/S', active, timer: timer.state === 'idle' ? '' : fmtTime(t), link });
}

function hotkey(a) {
  if (CHEATS.some((c) => c.id === a)) return flip(a);
  if (a === 'slowmo') {
    cfg.wspeed = cfg.wspeed < 1 ? 1 : 0.35;
    commit();
    return toast(cfg.wspeed < 1 ? 'Slow motion on' : 'Slow motion off', cfg.wspeed < 1);
  }
  if (a === 'save1') return saveSlot(0);
  if (a === 'load1') return loadSlot(0);
  if (a === 'boost') {
    hb.event('boost', 3000);
    return toast('Boost');
  }
  if (a === 'timer') {
    timerToggle();
    return toast({ running: 'Timer started', stopped: 'Timer stopped', idle: 'Timer cleared', armed: 'Timer armed' }[timer.state]);
  }
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const PAL = ['#070a1c', '#141a45', '#2b2a78', '#5a47b8', '#9a86f2', '#d79ae0', '#ff8fb8', '#ffb21a'].map((hx) => {
  const [r, g, b] = hx.match(/\w\w/g).map((n) => parseInt(n, 16));
  return (255 << 24) | (b << 16) | (g << 8) | r;
});

function makeSky(canvas, px) {
  const ctx = canvas.getContext('2d');
  let img = null;
  let buf = null;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width / px));
    const h = Math.max(1, Math.round(r.height / px));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      img = ctx.createImageData(w, h);
      buf = new Uint32Array(img.data.buffer);
    }
  };
  return (t) => {
    resize();
    if (!img) return;
    const w = canvas.width;
    const h = canvas.height;
    const fever = document.body.classList.contains('trip') ? 1 : 0;
    const mx = w * 0.74 + Math.sin(t * 0.05) * w * 0.04;
    const my = h * 0.3 + Math.cos(t * 0.07) * h * 0.03;
    const mr = h * 0.16;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const wave = Math.sin(x * 0.035 + t * 0.6) * (2 + fever * 6) + Math.sin(x * 0.011 - t * 0.25) * (4 + fever * 8);
        const hz = h * 0.68 + wave;
        let v;
        if (y < hz) {
          const k = y / hz;
          v = 0.4 + Math.pow(k, 1.6) * 5.4 + Math.sin(y * 0.09 + x * 0.02 + t * (0.3 + fever)) * 0.18;
          const dx = (x - mx) / mr;
          const dy = (y - my) / mr;
          const d2 = dx * dx + dy * dy;
          if (d2 < 1) {
            const nz = Math.sqrt(1 - d2);
            const l = Math.max(0, -dx * 0.55 - dy * 0.6 + nz * 0.6);
            v = 2.2 + l * 4.4 + Math.sin((dx + dy * 0.6) * 9 + t * 0.4) * 0.35;
          } else if (d2 < 1.6) {
            v += (1.6 - d2) * 0.9;
          }
        } else {
          const g = (y - hz) / (h - hz + 1);
          v = 2.6 - g * 2.4;
          const spread = (x - w / 2) / (g * w * 0.5 + 1);
          const railW = 0.05 + 0.02 / (g + 0.05);
          if (Math.abs(Math.abs(spread) - 0.42) < railW * 0.35) v = 7;
          else if (Math.abs(spread) < 0.42) {
            const z = 1 / (g + 0.02);
            if ((z * 0.9 + t * 2.2) % 3 < 0.7) v = Math.max(v, 3.4 - g);
          }
        }
        if (v < 0) v = 0;
        if (v > 7) v = 7;
        const b = Math.floor(v);
        const idx = v - b > BAYER[(y & 3) * 4 + (x & 3)] ? Math.min(7, b + 1) : b;
        buf[y * w + x] = PAL[idx];
      }
    }
    ctx.putImageData(img, 0, 0);
  };
}

function startSky() {
  const main = makeSky($('#sky'), 4);
  const hero = makeSky($('#heroSky'), 3);
  const loader = $('#loaderSky') ? makeSky($('#loaderSky'), 4) : null;
  let last = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loop = (ms) => {
    if (ms - last > 90) {
      last = ms;
      const t = ms / 1000;
      document.body.classList.toggle('trip', !!(cfg.fevercam || cfg.spin));
      if ($('#loaderSky')) loader(t);
      else {
        main(t);
        if (page === 'trip') hero(t * 1.3);
      }
    }
    if (timer.state === 'running') renderTimer();
    if (!reduce || timer.state === 'running') requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  if (reduce) {
    main(0);
    hero(0);
    if (loader) loader(0);
  }
}

function wire() {
  $$('[data-icon]').forEach((el) => (el.innerHTML = svg(el.dataset.icon)));
  $$('[data-win]').forEach((b) => b.addEventListener('click', () => hb.win(b.dataset.win)));
  const miniState = (o) => $('#miniBtn').classList.toggle('btn-main', o);
  $('#miniBtn').addEventListener('click', async () => miniState(await hb.mini()));
  hb.on('miniOpen', miniState);
  $('#unitBtn').addEventListener('click', () => {
    unit = unit === 'kmh' ? 'us' : 'kmh';
    const u = unit === 'kmh' ? 'KM/H' : 'U/S';
    $('#unitBtn').textContent = u;
    $('#bUnit').textContent = u;
    $('#topSpeed').textContent = Math.round(showSpeed(stats.top));
  });
  $$('[data-act]').forEach((b) =>
    b.addEventListener('click', () => {
      const a = b.dataset.act;
      if (a === 'resetphys') {
        for (const s of SLIDERS) cfg[s.id] = s.id === 'fov' ? 0 : 1;
        commit();
        return toast('Physics reset');
      }
      if (link !== 'live') return toast('Game not connected', false);
      if (a === 'launch') hb.event('launch', 2200);
      if (a === 'boost') hb.event('boost', 3000);
      if (a === 'stop') hb.event('stop', '');
      toast({ launch: 'Launched', boost: 'Boost', stop: 'Stopped' }[a]);
    })
  );
  $('#mapGhost').addEventListener('click', () => {
    showGhost = !showGhost;
    $('#mapGhost').textContent = showGhost ? 'Hide best run' : 'Show best run';
    drawMap();
  });
  $('#mapClear').addEventListener('click', () => {
    trail = [];
    drawMap();
  });
  $('#timerGo').addEventListener('click', timerToggle);
  $('#timerReset').addEventListener('click', () => {
    timer.state = 'idle';
    timer.elapsed = 0;
    renderTimer();
  });
  $('#loopToggle').addEventListener('click', () => {
    timer.loop = !timer.loop;
    renderTimer();
    toast(`Auto-arm ${timer.loop ? 'on' : 'off'}`, timer.loop);
  });
  $('#bindsRefresh').addEventListener('click', () => {
    hb.event('binds', '');
    toast('Reading controls');
  });
  $('#hkToggle').addEventListener('click', async () => {
    info = await hb.hotkeys(null, !info.hotkeysOn);
    buildHotkeys();
    toast(`Hotkeys ${info.hotkeysOn ? 'on' : 'off'}`, info.hotkeysOn);
  });
  $('#hkReset').addEventListener('click', async () => {
    info = await hb.resetHotkeys();
    buildHotkeys();
  });
  $('#gutsSearch').addEventListener('input', () => renderGuts(true));
  const refresh = (r) => {
    if (r) info = r;
    renderSetup();
    renderLinkCard();
  };
  $('#detectBtn').addEventListener('click', async () => {
    const r = await safely(() => hb.detect());
    if (r) toast(r.gameDir ? 'Found it' : "Couldn't find it. Try Browse", !!r.gameDir);
    refresh(r);
  });
  $('#pickBtn').addEventListener('click', async () => refresh(await safely(() => hb.pick())));
  $('#installBtn').addEventListener('click', async () => {
    $('#installBtn').disabled = true;
    const r = await safely(() => hb.install(), 'Hook installed');
    $('#installBtn').disabled = false;
    if (!r) {
      $('#installMsg').textContent = '';
      $('#installBar').style.width = '0';
    }
    refresh(r);
  });
  hb.on('install', (d) => {
    $('#installMsg').textContent = d.msg;
    $('#installBar').style.width = d.p * 100 + '%';
  });
  $('#launchBtn').addEventListener('click', () => safely(() => hb.launch(), 'Launching'));
  $('#toggleHookBtn').addEventListener('click', async () => refresh(await safely(() => hb.hookEnabled(!!info.hookDisabled), info.hookDisabled ? 'Hook on' : 'Hook off')));
  $('#refreshModBtn').addEventListener('click', async () => refresh(await safely(() => hb.refreshMod(), 'Mod reinstalled')));
  $('#openFolderBtn').addEventListener('click', () => hb.openFolder());
  hb.on('info', refresh);
  hb.on('state', onState);
  hb.on('hotkey', hotkey);
  addEventListener('resize', () => {
    drawSpark();
    drawMap();
  });
}

async function boot() {
  const word = 'HYPERBOI';
  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const msgs = ['Looking for Hyperballin', 'Reading your settings', 'Checking the hook', 'Ready'];
  const ldWord = $('#ldWord');
  const ball = $('#ldBall');
  const settle = word.split('').map((_, i) => 6 + i * 3);
  let frame = 0;
  const flapper = setInterval(() => {
    frame += 1;
    ldWord.textContent = word
      .split('')
      .map((ch, i) => (frame >= settle[i] ? ch : glyphs[(Math.random() * glyphs.length) | 0]))
      .join('');
    if (frame > settle[settle.length - 1]) clearInterval(flapper);
  }, 70);
  const t0 = performance.now();
  const progress = setInterval(() => {
    const p = Math.min(1, (performance.now() - t0) / 2600);
    ball.style.left = p * 100 + '%';
    $('#ldMsg').textContent = msgs[Math.min(msgs.length - 1, Math.floor(p * msgs.length))];
  }, 40);
  buildNav();
  buildCheats();
  buildSliders();
  wire();
  wireMaps();
  startSky();
  info = await hb.info();
  if (info.cfg) cfg = Object.assign(defaults(), info.cfg, { locks: info.cfg.locks || {} });
  slots = info.slots || {};
  names = info.names || {};
  runs = info.runs || {};
  buildHotkeys();
  renderSlots();
  renderRuns();
  renderBinds();
  renderMoves();
  renderSetup();
  renderLinkCard();
  renderTimer();
  commit();
  go(info.gameDir && info.modInstalled ? 'trip' : 'setup');
  await new Promise((r) => setTimeout(r, Math.max(0, 2800 - (performance.now() - t0))));
  clearInterval(progress);
  $('#loader').classList.add('gone');
  setTimeout(() => $('#loader').remove(), 800);
}

boot();
