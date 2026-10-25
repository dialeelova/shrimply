const { app, BrowserWindow, ipcMain, screen, Tray, Menu, session } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let win, tray;

// In the installed app only one Shrimply can run at a time
const gotLock = app.isPackaged ? app.requestSingleInstanceLock() : true;
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => showWindow());
  app.whenReady().then(() => {
    // the camera helper is our own page, so it may use the camera (and nothing else)
    session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => cb(permission === 'media'));
    session.defaultSession.setPermissionCheckHandler((wc, permission) => permission === 'media');
    createWindow(); createTray();
  });
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
  const night = process.argv.includes('--night') ? '1' : '0';   // "npm run night" shows the sleeping look
  win.loadFile('index.html', { query: { test: demo, night } });
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

// ---------- camera mode ----------
// A hidden window watches the webcam and sends back a few numbers about head and shoulders.
// Video never leaves that window. It is served from a tiny local server (127.0.0.1 only).
let camWin = null, camServer = null, camPort = 0;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm' };

function startCamServer() {
  return new Promise(resolve => {
    if (camServer) return resolve(camPort);
    const root = path.join(__dirname, 'assets', 'camera');
    camServer = http.createServer((req, res) => {
      const url = decodeURIComponent((req.url || '/').split('?')[0]);
      const file = path.normalize(path.join(root, url === '/' ? 'camera.html' : url));
      if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }        // only files inside assets/camera
      fs.readFile(file, (err, buf) => {
        if (err) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
        res.end(buf);
      });
    });
    camServer.listen(0, '127.0.0.1', () => { camPort = camServer.address().port; resolve(camPort); });
  });
}

async function startCamera() {
  if (camWin) { camWin.destroy(); camWin = null; }          // start fresh (also retries after an error)
  const port = await startCamServer();
  camWin = new BrowserWindow({
    show: false, width: 320, height: 240,
    webPreferences: {
      preload: path.join(__dirname, 'camera-preload.js'),
      contextIsolation: true, nodeIntegration: false,
      backgroundThrottling: false          // keep watching even though the window is hidden
    }
  });
  camWin.on('closed', () => { camWin = null; });
  camWin.loadURL('http://127.0.0.1:' + port + '/camera.html');
}

function stopCamera() {
  if (camWin) { camWin.destroy(); camWin = null; }       // closing the window turns the camera light off
  if (win && !win.isDestroyed()) win.webContents.send('cam-msg', { type: 'status', state: 'stopped', text: '' });
}

ipcMain.on('camera', (e, msg) => {
  if (msg.cmd === 'start') startCamera();
  else if (msg.cmd === 'stop') stopCamera();
  else if (camWin) camWin.webContents.send('cam-cmd', msg);     // fast / preview
});
ipcMain.on('cam-msg', (e, msg) => { if (win && !win.isDestroyed()) win.webContents.send('cam-msg', msg); });
