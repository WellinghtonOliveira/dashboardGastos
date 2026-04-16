let transactions = [];

const formatBRL = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
    
    list.innerHTML = '';
    count.textContent = transactions.length;

    if (transactions.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Nenhuma transação registrada</p>';
        return;
    }

    transactions.slice().reverse().forEach((trans, idx) => {
        const realIdx = transactions.length - 1 - idx;
        const div = document.createElement('div');
        div.className = `transaction-item ${trans.tipo}`;
        div.innerHTML = `
            <div class="trans-info">
                <div class="trans-descricao">${trans.descricao || trans.categoria}</div>
                <div class="trans-categoria">${trans.categoria} • ${trans.data}</div>
            </div>
            <div class="trans-valor ${trans.tipo}">
                ${trans.tipo === 'entrada' ? '+' : '-'} ${formatBRL(trans.valor)}
            </div>
            <button class="btn-delete" onclick="deletarTransacao(${realIdx})">✕</button>
        `;
        list.appendChild(div);
    });
}

// Deletar transação
async function deletarTransacao(index) {
    if (confirm('Tem certeza que deseja deletar esta transação?')) {
        try {
            transactions = await window.electronAPI.deleteTransaction(index);
            atualizarLista();
            mostrarSucesso('Transação deletada!');
        } catch (error) {
            console.error('Erro ao deletar:', error);
            mostrarErro('Erro ao deletar transação');
        }
    }
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
        mostrarSucesso('✅ Transação adicionada com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar transação:', error);
        mostrarErro('Erro ao adicionar transação');
    }
});

function mostrarErro(msg) {
    const errorDiv = document.getElementById('error-msg');
    const successDiv = document.getElementById('success-msg');
    
    errorDiv.textContent = msg;
    errorDiv.classList.add('show');
    successDiv.classList.remove('show');
    
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 3000);
}

function mostrarSucesso(msg) {
    const successDiv = document.getElementById('success-msg');
    const errorDiv = document.getElementById('error-msg');
    
    successDiv.textContent = msg;
    successDiv.classList.add('show');
    errorDiv.classList.remove('show');
    
    setTimeout(() => {
        successDiv.classList.remove('show');
    }, 3000);
}

// Carregar transações quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', carregarTransacoes);
