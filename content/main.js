const { app, BrowserWindow, screen, ipcMain } = require('electron')
const wallpaper = require('electron-as-wallpaper')
const path = require('path');


let dashboardWin, controlWin // <<< GLOBAIS


function createDashboardWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  dashboardWin = new BrowserWindow({
    width: width,
    height: height,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    focusable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  dashboardWin.loadFile('./www/index.html')

  dashboardWin.once('ready-to-show', () => {
    wallpaper.attach(dashboardWin, {
      transparent: true,
      forwardMouseInput: true,
      forwardKeyboardInput: true
    })
  })
}

function createControlWindow() {
  controlWin = new BrowserWindow({
    width: 400,
    height: 300,
    resizable: true,
    minimizable: true,
    maximizable: false,
    title: 'Painel de Controle - Dashboard',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  controlWin.loadFile('./www/control.html') // Criar um novo HTML para controle

  controlWin.on('close', (event) => {
    event.preventDefault()
    controlWin.hide()
  })

  controlWin.show()
}



// ===== IPC =====
ipcMain.on('add-transaction', (event, transaction) => {
  if (dashboardWin) {
    dashboardWin.webContents.send('update-transaction', transaction);
  }
})


app.whenReady().then(() => {
  createDashboardWindow()
  createControlWindow()
})