const { app, BrowserWindow, screen, ipcMain } = require('electron')
const wallpaper = require('electron-as-wallpaper')
const path = require('path');


let win // <<< GLOBAL


function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  win = new BrowserWindow({
    width: width,
    height: height,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });


  win.loadFile('./www/index.html')

  // começa ignorando clique
  win.setIgnoreMouseEvents(true, { forward: true })

  win.once('ready-to-show', () => {
    wallpaper.attach(win)
  })
}



// ===== IPC =====
ipcMain.on('enable-click', () => {
  if (win) win.setIgnoreMouseEvents(false)
})

ipcMain.on('disable-click', () => {
  if (win) win.setIgnoreMouseEvents(true, { forward: true })
})


app.whenReady().then(createWindow)