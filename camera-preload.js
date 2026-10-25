// Lets the hidden camera page talk to the app, and nothing else.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('shrimpCam', {
  send: m => ipcRenderer.send('cam-msg', m),
  onCommand: cb => ipcRenderer.on('cam-cmd', (e, c) => cb(c))
});
