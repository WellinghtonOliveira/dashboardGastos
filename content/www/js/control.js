const { ipcRenderer } = require('electron');

document.getElementById('add-btn').addEventListener('click', () => {
  const desc = document.getElementById('f-desc').value;
  const val = parseFloat(document.getElementById('f-val').value);
  const tipo = document.getElementById('f-tipo').value;
  const cat = document.getElementById('f-cat').value;

  if (!desc || !val) return;

  ipcRenderer.send('add-transaction', { tipo, valor: val, categoria: cat });

  // Limpar campos
  document.getElementById('f-desc').value = '';
  document.getElementById('f-val').value = '';
});