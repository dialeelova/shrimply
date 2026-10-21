const { app, BrowserWindow, ipcMain, screen, Tray, Menu } = require('electron');
const path = require('path');

let win, tray;

// In the installed app only one Shrimply can run at a time
const gotLock = app.isPackaged ? app.requestSingleInstanceLock() : true;
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => showWindow());
  app.whenReady().then(() => { createWindow(); createTray(); });
  app.on('window-all-closed', () => app.quit());
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  win = new BrowserWindow({
    width: 360,
    height: 420,
    x: width - 380,   // bottom-right corner of the screen
    y: height - 440,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    hasShadow: false,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      autoplayPolicy: 'no-user-gesture-required'   // lets the reminder sounds play on their own
    }
  });

  // "npm run demo" starts a fast test mode (reminders after a few seconds)
  const demo = process.argv.includes('--test') ? '1' : '0';
  win.loadFile('index.html', { query: { test: demo } });
}

function showWindow() {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
}

// ---------- tray icon (next to the clock) ----------
function buildTrayMenu() {
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show Shrimply', click: showWindow },
    { label: 'Hide Shrimply', click: () => win.hide() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]));
}
function createTray() {
  tray = new Tray(path.join(__dirname, 'assets', 'icon.ico'));
  tray.setToolTip('Shrimply');
  tray.on('click', () => (win.isVisible() ? win.hide() : showWindow()));
  buildTrayMenu();
}

// ---------- messages from the window ----------
ipcMain.on('minimize', () => win.minimize());
// the x button: the installed app hides to the tray; while developing it just quits
ipcMain.on('hide', (e, showHint) => {
  if (!app.isPackaged) return app.quit();
  win.hide();
  if (showHint && tray.displayBalloon) {
    tray.displayBalloon({ title: 'Shrimply is still here', content: 'Click the tray icon to bring the shrimp back. Right-click it to quit.' });
  }
});
// a reminder fired: bring the window back if it was minimized or hidden
ipcMain.on('attention', () => { if (win.isMinimized()) win.restore(); if (!win.isVisible()) win.showInactive(); });
// shrink or grow the window (100% = 360 x 420), keeping the bottom-right corner in place
ipcMain.on('scale', (e, s) => {
  const w = Math.round(360 * s), h = Math.round(420 * s);
  const b = win.getBounds();
  win.setBounds({ x: b.x + b.width - w, y: b.y + b.height - h, width: w, height: h });
});
