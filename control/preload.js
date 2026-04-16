const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Salvar transação
  addTransaction: (transaction) => ipcRenderer.invoke('add-transaction', transaction),
  
  // Carregar todas as transações
  loadTransactions: () => ipcRenderer.invoke('load-transactions'),
  
  // Deletar transação
  deleteTransaction: (index) => ipcRenderer.invoke('delete-transaction', index)
});
