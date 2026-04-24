let transactions = [];
let flowChart = null;
let categoryChart = null;

const formatBRL = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDate = (dateStr) => {
  const [day, month, year] = dateStr.split('/');
  return new Date(year, month - 1, day);
};

// ==================== SCROLL HANDLER ====================
document.addEventListener('DOMContentLoaded', () => {
  const table = document.getElementById('transactions-body');
  const scrollUp = document.getElementById('scroll-up');
  const scrollDown = document.getElementById('scroll-down');
  
  if (table && scrollUp && scrollDown) {
    const scrollAmount = 150;
    
    scrollUp.addEventListener('click', () => {
      table.scrollTop -= scrollAmount;
    });
    
    scrollDown.addEventListener('click', () => {
      table.scrollTop += scrollAmount;
    });
  }
});

// ==================== CARREGAR DADOS ====================
async function loadTransactions() {
  try {
    transactions = await window.electronAPI.loadTransactions();
    updateAllMetrics();
    updateCharts();
    updateTransactionsList();
    updateSyncStatus(true);
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    updateSyncStatus(false);
  }
}

// ==================== MÉTRICAS ====================
function updateAllMetrics() {
  const entrada = transactions
    .filter(t => t.tipo === 'entrada')
    .reduce((acc, t) => acc + (t.valor || 0), 0);

  const saida = transactions
    .filter(t => t.tipo === 'saida')
    .reduce((acc, t) => acc + (t.valor || 0), 0);

  const saldo = entrada - saida;
  const savingsRate = entrada > 0 ? ((saldo / entrada) * 100).toFixed(1) : 0;

  // Atualizar entradas
  document.getElementById('total-entrada').textContent = formatBRL(entrada);
  document.getElementById('count-entrada').textContent = 
    `${transactions.filter(t => t.tipo === 'entrada').length} transações`;

  // Atualizar saídas
  document.getElementById('total-saida').textContent = formatBRL(saida);
  document.getElementById('count-saida').textContent = 
    `${transactions.filter(t => t.tipo === 'saida').length} transações`;

  // Atualizar saldo
  document.getElementById('total-saldo').textContent = formatBRL(saldo);
  const percentChange = entrada > 0 ? ((saldo / entrada) * 100).toFixed(1) : 0;
  document.getElementById('percent-saldo').textContent = `${percentChange}% do total`;

  // Atualizar taxa de poupança
  document.getElementById('savings-rate').textContent = `${savingsRate}%`;
}

// ==================== GRÁFICOS ====================
function updateCharts() {
  updateFlowChart();
  updateCategoryChart();
}

function updateFlowChart() {
  const entrada = transactions
    .filter(t => t.tipo === 'entrada')
    .reduce((acc, t) => acc + (t.valor || 0), 0);

  const saida = transactions
    .filter(t => t.tipo === 'saida')
    .reduce((acc, t) => acc + (t.valor || 0), 0);

  const ctx = document.getElementById('flowChart');
  
  if (flowChart) {
    flowChart.destroy();
  }

  flowChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Entradas', 'Saídas'],
      datasets: [{
        data: [entrada, saida],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 2,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: 'rgba(255, 255, 255, 0.8)',
            padding: 16,
            font: { size: 12, weight: '600' }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          callbacks: {
            label: (context) => {
              const value = formatBRL(context.parsed);
              const percentage = ((context.parsed / (entrada + saida)) * 100).toFixed(1);
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function updateCategoryChart() {
  const categories = {};
  
  transactions
    .filter(t => t.tipo === 'saida')
    .forEach(t => {
      const cat = t.categoria || 'Outros';
      categories[cat] = (categories[cat] || 0) + t.valor;
    });

  const labels = Object.keys(categories);
  const data = Object.values(categories);

  const colors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(168, 85, 247, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(6, 182, 212, 0.8)',
    'rgba(249, 115, 22, 0.8)'
  ];

  const ctx = document.getElementById('categoryChart');
  
  if (categoryChart) {
    categoryChart.destroy();
  }

  categoryChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Gastos por Categoria',
        data: data,
        backgroundColor: colors.slice(0, labels.length),
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: colors.map(c => c.replace('0.8', '1')).slice(0, labels.length)
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          callbacks: {
            label: (context) => {
              const value = formatBRL(context.parsed.x);
              const total = data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed.x / total) * 100).toFixed(1);
              return `${value} (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: false,
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.6)',
            callback: (value) => formatBRL(value)
          }
        },
        y: {
          stacked: false,
          grid: {
            display: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)',
            font: { weight: '600' }
          }
        }
      }
    }
  });
}

// ==================== TABELA DE TRANSAÇÕES ====================
function updateTransactionsList() {
  const list = document.getElementById('transactions-list');
  list.innerHTML = '';

  if (transactions.length === 0) {
    list.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.4);">
          📭 Nenhuma transação registrada
        </td>
      </tr>
    `;
    return;
  }

  // Ordenar por data (mais recentes primeiro)
  const sorted = [...transactions].sort((a, b) => {
    const dateA = formatDate(a.data || '01/01/2000');
    const dateB = formatDate(b.data || '01/01/2000');
    return dateB - dateA;
  });

  // Mostrar apenas 10 mais recentes
  sorted.slice(0, 10).forEach(transaction => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${transaction.data || '--'}</td>
      <td>${transaction.descricao || transaction.categoria}</td>
      <td>${transaction.categoria}</td>
      <td>
        <span class="transaction-type ${transaction.tipo}">
          ${transaction.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída'}
        </span>
      </td>
      <td>
        <span class="transaction-value ${transaction.tipo}">
          ${transaction.tipo === 'entrada' ? '+' : '-'} ${formatBRL(transaction.valor)}
        </span>
      </td>
    `;
    list.appendChild(row);
  });
}

// ==================== ATUALIZAR DATA ====================
function updateDate() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const formatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  document.getElementById('current-date').textContent = formatted;
}

// ==================== STATUS DE SINCRONIZAÇÃO ====================
function updateSyncStatus(synced) {
  const status = document.getElementById('sync-status');
  const lastUpdate = document.getElementById('last-update');
  
  if (synced) {
    status.textContent = '✓ Sincronizado';
    status.className = 'synced';
  } else {
    status.textContent = '✗ Erro de sincronização';
    status.className = 'error';
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  lastUpdate.textContent = `Última atualização: ${timeStr}`;
}

// ==================== LISTENERS ====================
window.electronAPI.onTransactionsUpdated((event, data) => {
  transactions = data;
  updateAllMetrics();
  updateCharts();
  updateTransactionsList();
  updateSyncStatus(true);
});

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
  loadTransactions();
  updateDate();
});

