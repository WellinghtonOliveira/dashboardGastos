const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Carregar todas as transações
  loadTransactions: () => ipcRenderer.invoke('load-transactions'),
  
  // Listener para quando dados são atualizados
  onTransactionsUpdated: (callback) => ipcRenderer.on('transactions-updated', callback)
});
