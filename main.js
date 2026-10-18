const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let win;

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
      autoplayPolicy: 'no-user-gesture-required'   // lets the reminder chime play on its own
    }
  });

  // "npm run demo" starts a fast test mode (reminders after 10 seconds)
  const demo = process.argv.includes('--test') ? '1' : '0';
  win.loadFile('index.html', { query: { test: demo } });
}

ipcMain.on('quit', () => app.quit());
ipcMain.on('minimize', () => win.minimize());
// shrink or grow the window (100% = 360 x 420), keeping the bottom-right corner in place
ipcMain.on('scale', (e, s) => {
  const w = Math.round(360 * s), h = Math.round(420 * s);
  const b = win.getBounds();
  win.setBounds({ x: b.x + b.width - w, y: b.y + b.height - h, width: w, height: h });
});
// a reminder fired: bring the window back if it was minimized
ipcMain.on('attention', () => { if (win.isMinimized()) win.restore(); });

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
