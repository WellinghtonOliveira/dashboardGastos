const { app, BrowserWindow, screen, ipcMain } = require('electron')
const wallpaper = require('electron-as-wallpaper')
const path = require('path');
const fs = require('fs');
const os = require('os');

let dashboardWin

// Caminho para arquivo de configuração (pasta AppData compartilhada)
const dataDir = path.join(os.homedir(), 'AppData', 'Local', 'dashboardGastos');
const dataPath = path.join(dataDir, 'transactions.json');

// Garantir que a pasta de dados existe
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ==== AUTO-INICIAR COM O WINDOWS ====
app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: true,
  path: process.execPath,
  args: ['--hidden']
});

// Verificar se foi iniciado com --hidden (início automático)
const startHidden = process.argv.includes('--hidden');
const isDashboard = process.argv.includes('--dashboard');

// ==== FUNÇÕES DE ARQUIVO ====
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
  // Observar mudanças no arquivo e repassar para o dashboard
  fs.watchFile(dataPath, (curr, prev) => {
    const transactions = loadTransactions();
    if (dashboardWin) {
      dashboardWin.webContents.send('transactions-updated', transactions);
    }
  });
}

// ==== WINDOWS ====
function createDashboardWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  dashboardWin = new BrowserWindow({
    x: 0,
    y: 0,
    width: width,
    height: height,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: false
    }
  });

  // Carregar arquivo local
  dashboardWin.loadFile('./www/index.html')

  dashboardWin.once('ready-to-show', () => {
    if (!startHidden || isDashboard) {
      dashboardWin.show();
    }

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

// ==== IPC HANDLERS ====
ipcMain.handle('load-transactions', async () => {
  return loadTransactions();
});

app.whenReady().then(() => {
  createDashboardWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

