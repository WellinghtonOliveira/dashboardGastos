const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  enableClick: () => ipcRenderer.send('enable-click'),
  disableClick: () => ipcRenderer.send('disable-click')
});
