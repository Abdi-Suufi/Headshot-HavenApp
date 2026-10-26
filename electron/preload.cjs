const { contextBridge, ipcRenderer } = require('electron');

// The small set of desktop-only features the game can use. The website doesn't have this object,
// which is how the UI knows to show desktop-only settings.
contextBridge.exposeInMainWorld('headshotDesktop', {
  getFrameRateUnlocked: () => ipcRenderer.invoke('frame-rate:get'),
  setFrameRateUnlocked: (unlocked) => ipcRenderer.invoke('frame-rate:set', Boolean(unlocked)),
  relaunch: () => ipcRenderer.invoke('app:relaunch'),
  quit: () => ipcRenderer.invoke('app:quit'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
});
