const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage } = require('electron')
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const isDashboard = process.argv.includes('--dashboard');
const startHidden = process.argv.includes('--hidden');

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

const dataDir = path.join(os.homedir(), 'AppData', 'Local', 'dashboardGastos');
const dataPath = path.join(dataDir, 'transactions.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function startDashboard() {
  const appPath = app.getAppPath();

  dashboardProcess = spawn(process.execPath, [appPath, '--dashboard'], {
    detached: true,
    stdio: 'inherit'
  });

  dashboardProcess.unref();
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

function saveTransactions(transactions) {
  try {
    fs.writeFileSync(dataPath, JSON.stringify(transactions, null, 2));
  } catch (error) {
    console.error('Erro ao salvar transações:', error);
  }
}

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

  tray.setToolTip('Dashboard de Gastos');
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

function createControlWindow() {
  const iconPath = path.join(__dirname, 'icon.png');

  controlWin = new BrowserWindow({
    width: 900,
    height: 650,
    title: 'Painel de Controle - Dashboard de Gastos',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  controlWin.loadFile(path.join(__dirname, 'www', 'control.html'));

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

app.whenReady().then(() => {
  if (isDashboard) {
    require('./dashboard/main.js');
  } else {
    createControlWindow();
    createTray();
    startDashboard();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', () => { });