const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path');
const fs = require('fs');
const os = require('os');

let controlWin

// Caminho para arquivo de configuração (pasta AppData compartilhada)
const dataDir = path.join(os.homedir(), 'AppData', 'Local', 'dashboardGastos');
const dataPath = path.join(dataDir, 'transactions.json');

// Garantir que a pasta de dados existe
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

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

// ==== WINDOWS ====
function createControlWindow() {
  controlWin = new BrowserWindow({
    width: 500,
    height: 700,
    resizable: true,
    minimizable: true,
    maximizable: true,
    title: '💰 Painel de Controle - Dashboard de Gastos',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  });

  controlWin.loadFile('./www/control.html')

  controlWin.on('closed', () => {
    controlWin = null;
  })
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
})

app.on('window-all-closed', () => {
  app.quit()
})
