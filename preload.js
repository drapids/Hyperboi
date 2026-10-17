const { contextBridge, ipcRenderer } = require('electron');

const on = (ch, fn) => {
  const h = (_e, d) => fn(d);
  ipcRenderer.on(ch, h);
  return () => ipcRenderer.removeListener(ch, h);
};

contextBridge.exposeInMainWorld('hb', {
  info: () => ipcRenderer.invoke('info'),
  detect: () => ipcRenderer.invoke('detect'),
  pick: () => ipcRenderer.invoke('pick'),
  install: () => ipcRenderer.invoke('install'),
  refreshMod: () => ipcRenderer.invoke('refreshMod'),
  hookEnabled: (on) => ipcRenderer.invoke('hookEnabled', on),
  launch: () => ipcRenderer.invoke('launch'),
  openFolder: () => ipcRenderer.invoke('openFolder'),
  cfg: (c) => ipcRenderer.invoke('cfg', c),
  event: (k, a) => ipcRenderer.invoke('event', k, a),
  slots: (s, n) => ipcRenderer.invoke('slots', s, n),
  runs: (r) => ipcRenderer.invoke('runs', r),
  hotkeys: (m, on) => ipcRenderer.invoke('hotkeys', m, on),
  resetHotkeys: () => ipcRenderer.invoke('resetHotkeys'),
  mini: () => ipcRenderer.invoke('mini'),
  miniData: (d) => ipcRenderer.send('miniData', d),
  win: (a) => ipcRenderer.send('win', a),
  external: (u) => ipcRenderer.invoke('external', u),
  on
});
