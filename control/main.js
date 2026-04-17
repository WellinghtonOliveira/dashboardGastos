const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron')
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

let controlWin
let tray = null
let dashboardProcess = null

// Caminho para arquivo de configuração (pasta AppData compartilhada)
const dataDir = path.join(os.homedir(), 'AppData', 'Local', 'dashboardGastos');
const dataPath = path.join(dataDir, 'transactions.json');

// Garantir que a pasta de dados existe
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ==== INICIAR DASHBOARD AUTOMATICAMENTE ====
function startDashboard() {
  let dashboardPath;
  
  // Verificar se está em modo de produção (compilado)
  if (app.isPackaged) {
    // Em produção, o dashboard está na pasta extraResources
    dashboardPath = path.join(process.resourcesPath, 'dashboard', 'main.js');
  } else {
    // Em desenvolvimento, o dashboard está na pasta ../dashboard
    dashboardPath = path.join(__dirname, '..', 'dashboard', 'main.js');
  }
  
  dashboardProcess = spawn(process.execPath, [dashboardPath], {
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
    resizable: true,
    minimizable: true,
    maximizable: true,
    title: '💰 Painel de Controle - Dashboard de Gastos',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  controlWin.loadFile('./www/control.html')

  // Minimizar para o tray ao minimizar
  controlWin.on('minimize', (event) => {
    event.preventDefault();
    controlWin.hide();
  });

  // Ao fechar, minimizar para o tray ao invés de sair
  controlWin.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      controlWin.hide();
    } else {
      // Fechar o dashboard quando o control for fechado definitivamente
      if (dashboardProcess) {
        dashboardProcess.kill();
        console.log('Dashboard fechado junto com o control');
      }
    }
  });

  controlWin.on('closed', () => {
    controlWin = null;
  });
}

// ==== IPC HANDLERS ====
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
  createControlWindow()
  createTray()
  startDashboard()
})

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', () => {
  // Não sair quando todas as janelas forem fechadas (fica no tray)
});
