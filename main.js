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
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });

  win.loadFile('index.html');
}

ipcMain.on('quit', () => app.quit());
ipcMain.on('minimize', () => win.minimize());

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
