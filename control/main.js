const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron')
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const isDashboard = process.argv.includes('--dashboard');

let controlWin
let tray = null
let dashboardProcess = null

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (controlWin) {
      if (!controlWin.isVisible()) controlWin.show();
      controlWin.focus();
    }
  });
}

// Caminho para arquivo de configuração (pasta AppData compartilhada)
const dataDir = path.join(os.homedir(), 'AppData', 'Local', 'dashboardGastos');
const dataPath = path.join(dataDir, 'transactions.json');

// Garantir que a pasta de dados existe
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ==== INICIAR DASHBOARD AUTOMATICAMENTE ====
function startDashboard() {
  let dashboardEntry;

  if (app.isPackaged) {
    dashboardEntry = path.join(process.resourcesPath, 'dashboard', 'main.js');
  } else {
    dashboardEntry = path.join(__dirname, '..', 'dashboard', 'main.js');
  }

  dashboardProcess = spawn(process.execPath, [dashboardEntry, '--dashboard'], {
    detached: true,
    stdio: 'ignore'
  });

  dashboardProcess.unref();
  console.log('Dashboard iniciado automaticamente');
}

// ==== AUTO-INICIAR COM O WINDOWS ====
app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: true,
  path: process.execPath,
  args: ['--hidden']
});

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

function saveTransactions(transactions) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(transactions, null, 2));
  } catch (error) {
    console.error('Erro ao salvar transações:', error);
  }
}

// ==== TRAY ====
function createTray() {
  const iconPath = path.join(__dirname, 'icon.png');
  const trayIcon = nativeImage.createFromPath(iconPath);

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir Painel',
      click: () => {
        if (controlWin) {
          controlWin.show();
          controlWin.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        app.isQuitting = true;
        if (dashboardProcess) {
          dashboardProcess.kill();
        }
        app.quit();
      }
    }
  ]);

  tray.setToolTip('💰 Dashboard de Gastos');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (controlWin) {
      if (controlWin.isVisible()) {
        controlWin.hide();
      } else {
        controlWin.show();
        controlWin.focus();
      }
    }
  });
}

// ==== WINDOWS ====
function createControlWindow() {
  const iconPath = path.join(__dirname, 'icon.png');

  controlWin = new BrowserWindow({
    width: 900,
    height: 650,
    title: '💰 Painel de Controle - Dashboard de Gastos',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  controlWin.loadFile('./www/control.html')

  controlWin.on('minimize', (event) => {
    event.preventDefault();
    controlWin.hide();
  });

  controlWin.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      controlWin.hide();
    } else {
      if (dashboardProcess) {
        dashboardProcess.kill();
      }
    }
  });

  controlWin.on('closed', () => {
    controlWin = null;
  });
}

// ==== IPC ====
ipcMain.handle('add-transaction', async (event, transaction) => {
  const transactions = loadTransactions();
  transactions.push({
    ...transaction,
    data: new Date().toLocaleDateString('pt-BR')
  });
  saveTransactions(transactions);
  return transactions;
});

ipcMain.handle('load-transactions', async () => {
  return loadTransactions();
});

ipcMain.handle('delete-transaction', async (event, index) => {
  const transactions = loadTransactions();
  transactions.splice(index, 1);
  saveTransactions(transactions);
  return transactions;
});

// 🚀 INICIALIZAÇÃO
app.whenReady().then(() => {
  createControlWindow()
  createTray()

  // 🔒 EVITA LOOP INFINITO
  if (!isDashboard) {
    startDashboard()
  }
})

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', () => {
  // mantém no tray
});