const { app, BrowserWindow, Menu, ipcMain, net, protocol, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// `npm run dev` passes --dev to load the Vite dev server; otherwise the built game in /dist is used.
const DEV = process.argv.includes('--dev');
const DEV_URL = 'http://localhost:5173';
const DIST = path.join(__dirname, '..', 'dist');
// The game is served from app://headshot-haven/ rather than file://, so client-side routes
// (/play/gridshot, /leaderboards…) and absolute asset paths work exactly like on the website.
const APP_ORIGIN = 'app://headshot-haven';

// Desktop preferences that must be known before Chromium starts (stored next to the app's data).
const CONFIG_FILE = path.join(app.getPath('userData'), 'desktop-settings.json');

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeConfig(patch) {
  const next = { ...readConfig(), ...patch };
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2));
  return next;
}

// "Unlock frame rate": turn off VSync and Chromium's frame cap so the game can render above the
// monitor's refresh rate, like a native shooter. These switches only work at startup.
const FRAME_RATE_UNLOCKED = readConfig().unlockFrameRate === true;
if (FRAME_RATE_UNLOCKED) {
  app.commandLine.appendSwitch('disable-frame-rate-limit');
  app.commandLine.appendSwitch('disable-gpu-vsync');
}

ipcMain.handle('frame-rate:get', () => ({ unlocked: readConfig().unlockFrameRate === true, active: FRAME_RATE_UNLOCKED }));
ipcMain.handle('frame-rate:set', (_event, unlocked) => {
  writeConfig({ unlockFrameRate: unlocked });
  return { active: FRAME_RATE_UNLOCKED };
});
ipcMain.handle('app:relaunch', () => {
  app.relaunch();
  app.exit(0);
});
ipcMain.handle('app:quit', () => app.quit());

// The window has no title bar, so the game draws its own minimize / fullscreen / close buttons.
const senderWindow = (event) => BrowserWindow.fromWebContents(event.sender);
ipcMain.handle('window:minimize', (event) => senderWindow(event)?.minimize());
ipcMain.handle('window:toggle-fullscreen', (event) => {
  const win = senderWindow(event);
  if (!win) return false;
  win.setFullScreen(!win.isFullScreen());
  return win.isFullScreen();
});

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

function serveBuiltGame() {
  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url);
    let file = path.normalize(path.join(DIST, decodeURIComponent(pathname)));
    if (!file.startsWith(DIST)) return new Response('Forbidden', { status: 403 });
    // Unknown paths are app routes: hand them to the React router via index.html.
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
    return net.fetch(pathToFileURL(file).toString());
  });
}

function isInternal(url) {
  return url.startsWith(APP_ORIGIN) || (DEV && url.startsWith(DEV_URL));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: 'Headshot Haven',
    backgroundColor: '#07080b',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    // Frameless, like a game: the navigation bar doubles as the drag area (see .is-desktop styles).
    frame: false,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
      // Keep timers and animation running at full speed even when the window loses focus.
      backgroundThrottling: false,
    },
  });

  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
  });

  // GitHub, sign-up links etc. open in the player's normal browser, never inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (isInternal(url)) return;
    event.preventDefault();
    if (/^https?:/.test(url)) shell.openExternal(url);
  });

  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    } else if (DEV && input.key === 'F12') {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  win.loadURL(DEV ? DEV_URL : `${APP_ORIGIN}/`);
  return win;
}

// Only one copy of the app at a time; launching it again focuses the open window.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    serveBuiltGame();
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
