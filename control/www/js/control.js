let transactions = [];

const formatBRL = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Ícones por categoria
const categoryIcons = {
    'Alimentação': '🍔',
    'Transporte': '🚗',
    'Saúde': '⚕️',
    'Lazer': '🎮',
    'Educação': '📚',
    'Trabalho': '💼',
    'Fixo': '📌',
    'Outros': '📦'
};

// Carregar transações ao iniciar
async function carregarTransacoes() {
    try {
        transactions = await window.electronAPI.loadTransactions();
        atualizarLista();
    } catch (error) {
        console.error('Erro ao carregar transações:', error);
        mostrarErro('Erro ao carregar transações');
    }
}

// Função para atualizar lista de transações
function atualizarLista() {
    const list = document.getElementById('transaction-list');
    const count = document.getElementById('trans-count');
    
    count.textContent = transactions.length;

    if (transactions.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="icon">📭</div>
                <p>Nenhuma transação ainda</p>
            </div>
        `;
        return;
    }

    list.innerHTML = '';
    
    transactions.slice().reverse().forEach((trans, idx) => {
        const realIdx = transactions.length - 1 - idx;
        const icon = categoryIcons[trans.categoria] || '📦';
        
        const div = document.createElement('div');
        div.className = `transaction-item ${trans.tipo}`;
        div.innerHTML = `
            <div class="trans-icon">${icon}</div>
            <div class="trans-info">
                <div class="trans-descricao">${trans.descricao || trans.categoria}</div>
                <div class="trans-meta">
                    <span class="trans-categoria">${trans.categoria}</span>
                    <span class="trans-data">${trans.data}</span>
                </div>
            </div>
            <div class="trans-actions">
                <div class="trans-valor ${trans.tipo}">
                    ${trans.tipo === 'entrada' ? '+' : '-'} ${formatBRL(trans.valor)}
                </div>
                <button class="btn-delete" onclick="deletarTransacao(${realIdx})" title="Excluir">🗑️</button>
            </div>
        `;
        list.appendChild(div);
    });
}

// Deletar transação
function deletarTransacao(index) {
    // Criar modal de confirmação customizado
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.innerHTML = `
        <div class="confirm-overlay"></div>
        <div class="confirm-box">
            <p>Tem certeza que deseja deletar esta transação?</p>
            <div class="confirm-buttons">
                <button class="btn-cancel" id="btn-cancel">Cancelar</button>
                <button class="btn-confirm" id="btn-confirm">Deletar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Adicionar estilos se não existirem
    if (!document.getElementById('confirm-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'confirm-modal-styles';
        style.textContent = `
            .confirm-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 10000; }
            .confirm-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); }
            .confirm-box { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 24px; border-radius: 12px; text-align: center; min-width: 280px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
            .confirm-box p { color: #1f2937; font-size: 16px; margin-bottom: 20px; font-weight: 500; }
            .confirm-buttons { display: flex; gap: 12px; justify-content: center; }
            .btn-cancel, .btn-confirm { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; }
            .btn-cancel { background: #e5e7eb; color: #374151; }
            .btn-cancel:hover { background: #d1d5db; }
            .btn-confirm { background: #ef4444; color: white; }
            .btn-confirm:hover { background: #dc2626; }
        `;
        document.head.appendChild(style);
    }
    
    // Event listeners
    document.getElementById('btn-cancel').onclick = () => {
        document.body.removeChild(modal);
    };
    
    document.getElementById('btn-confirm').onclick = async () => {
        document.body.removeChild(modal);
        try {
            transactions = await window.electronAPI.deleteTransaction(index);
            atualizarLista();
            mostrarSucesso('Transação deletada!');
        } catch (error) {
            console.error('Erro ao deletar:', error);
            mostrarErro('Erro ao deletar transação');
        }
    };
}

// Evento do botão Adicionar
document.getElementById('add-btn').addEventListener('click', async () => {
    const desc = document.getElementById('f-desc').value.trim();
    const val = parseFloat(document.getElementById('f-val').value);
    const tipo = document.getElementById('f-tipo').value;
    const cat = document.getElementById('f-cat').value;

    // Validação
    if (!desc) {
        mostrarErro('Preencha a descrição');
        return;
    }

    if (!val || isNaN(val) || val <= 0) {
        mostrarErro('Digite um valor válido (maior que 0)');
        return;
    }

    try {
        transactions = await window.electronAPI.addTransaction({ 
            tipo, 
            valor: val, 
            categoria: cat,
            descricao: desc
        });

        // Limpar campos
        document.getElementById('f-desc').value = '';
        document.getElementById('f-val').value = '';
        document.getElementById('f-tipo').value = 'saida';
        document.getElementById('f-cat').value = 'Alimentação';
        
        // Atualizar lista
        atualizarLista();
        
        // Mostrar sucesso
        mostrarSucesso('Transação adicionada com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar transação:', error);
        mostrarErro('Erro ao adicionar transação');
    }
});

function mostrarErro(msg) {
    const container = document.getElementById('alert-container');
    const alert = document.getElementById('alert-msg');
    
    // Reset completo
    container.classList.remove('show');
    alert.className = 'alert';
    
    // Forçar reflow
    void container.offsetWidth;
    
    alert.textContent = msg;
    alert.classList.add('error');
    container.classList.add('show');
    
    // Remover após 3 segundos
    setTimeout(() => {
        container.classList.remove('show');
    }, 3000);
}

function mostrarSucesso(msg) {
    const container = document.getElementById('alert-container');
    const alert = document.getElementById('alert-msg');
    
    // Reset completo
    container.classList.remove('show');
    alert.className = 'alert';
    
    // Forçar reflow
    void container.offsetWidth;
    
    alert.textContent = msg;
    alert.classList.add('success');
    container.classList.add('show');
    
    // Remover após 3 segundos
    setTimeout(() => {
        container.classList.remove('show');
    }, 3000);
}

// Carregar transações quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', carregarTransacoes);
