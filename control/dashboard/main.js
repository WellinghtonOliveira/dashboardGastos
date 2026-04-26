const { app, BrowserWindow, screen, ipcMain } = require('electron')
const wallpaper = require('electron-as-wallpaper')
const path = require('path');
const fs = require('fs');
const os = require('os');

const startHidden = process.argv.includes('--hidden');
const isDashboard = process.argv.includes('--dashboard');

let dashboardWin

const dataDir = path.join(os.homedir(), 'AppData', 'Local', 'dashboardGastos');
const dataPath = path.join(dataDir, 'transactions.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!isDashboard) {
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true,
    path: process.execPath,
    args: ['--hidden']
  });
}

function loadTransactions() {
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao carregar transações:', error);
  }
  return [];
}

function watchTransactionFile() {
  fs.watchFile(dataPath, () => {
    const transactions = loadTransactions();
    if (dashboardWin) {
      dashboardWin.webContents.send('transactions-updated', transactions);
    }
  });
}

function createDashboardWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  dashboardWin = new BrowserWindow({
    x: 0,
    y: 0,
    width: width,
    height: height,
    show: true,
    frame: true,
    transparent: false,
    resizable: true,
    skipTaskbar: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false
    }
  });

  dashboardWin.loadFile(path.join(__dirname, 'www', 'index.html'));

  dashboardWin.once('ready-to-show', () => {
    dashboardWin.show();

    wallpaper.attach(dashboardWin, {
      transparent: true,
      forwardMouseInput: true,
      forwardKeyboardInput: false
    })

    watchTransactionFile();
  })

  dashboardWin.on('closed', () => {
    dashboardWin = null;
  })
}
app.whenReady().then(() => {
  createDashboardWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

console.log('isDashboard:', isDashboard);
console.log('startHidden:', startHidden);