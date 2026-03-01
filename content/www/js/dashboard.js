Chart.defaults.color = 'rgba(255,255,255,0.5)';
Chart.defaults.font.size = 10;

const state = { 
    movimentacoes: [
        { tipo: "saida", valor: 450, categoria: "Fixo" },
        { tipo: "saida", valor: 59.90, categoria: "À Toa" },
        { tipo: "entrada", valor: 120, categoria: "Provento" }
    ]
};

const formatBRL = (v) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function calcularResumo() {
    const entradas = state.movimentacoes
        .filter(m => m.tipo === "entrada")
        .reduce((acc, m) => acc + m.valor, 0);

    const saidas = state.movimentacoes
        .filter(m => m.tipo === "saida")
        .reduce((acc, m) => acc + m.valor, 0);

    const saldo = entradas - saidas;
    const taxa = entradas ? ((saldo / entradas) * 100).toFixed(0) : 0;

    document.querySelectorAll(".metric-item")[0].querySelector(".val").textContent = formatBRL(entradas);
    document.querySelectorAll(".metric-item")[1].querySelector(".val").textContent = formatBRL(saidas);
    document.querySelectorAll(".metric-item")[2].querySelector(".val").textContent = formatBRL(saldo);
    document.querySelectorAll(".metric-item")[4].querySelector(".val").textContent = taxa + "%";
    document.querySelectorAll(".progress-fill")[0].style.width = taxa + "%";
}

function atualizarTabela() {
    const list = document.getElementById("log-list");
    list.innerHTML = "";

    state.movimentacoes.slice().reverse().forEach(m => {
        const row = document.createElement("tr");
        row.innerHTML = `
    <td>${new Date().toLocaleDateString()}</td>
    <td>${m.categoria}</td>
    <td><span class="tag">${m.categoria.toUpperCase()}</span></td>
    <td class="amt" style="color:${m.tipo === " entrada" ? "#00ffa3" : "#ff4d4d"}">
    ${m.tipo === "entrada" ? "+" : "-"} ${formatBRL(m.valor)}
</td>
`;
        list.appendChild(row);
    });
}

function atualizarGraficoCategorias() {
    const categorias = {};
    state.movimentacoes.forEach(m => {
        if (m.tipo === "saida") {
            categorias[m.categoria] = (categorias[m.categoria] || 0) + m.valor;
        }
    });

    catChart.data.labels = Object.keys(categorias);
    catChart.data.datasets[0].data = Object.values(categorias);
    catChart.update();
}

function adicionar() {
    const desc = document.getElementById("f-desc").value;
    const val = parseFloat(document.getElementById("f-val").value);
    const cat = document.getElementById("f-cat").value;
    const tipo = document.getElementById("f-tipo").value;

    if (!desc || !val) return;

    state.movimentacoes.push({
        tipo,
        valor: val,
        categoria: cat
    });

    calcularResumo();
    atualizarTabela();
    atualizarGraficoCategorias();

    document.getElementById("f-desc").value = "";
    document.getElementById("f-val").value = "";
}

const flowChart = new Chart(document.getElementById("flowChart"), {
    type: "line",
    data: {
        labels: ["Semana 1", "Semana 2", "Semana 3", "Semana 4"],
        datasets: [{
            data: [1200, 2100, 1800, 3000],
            borderColor: "#00d1ff",
            fill: true,
            backgroundColor: "rgba(0,209,255,0.05)",
            tension: 0.4,
            pointRadius: 0
        }]
    },
    options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            y: { display: false },
            x: { grid: { display: false } }
        }
    }
});

const catChart = new Chart(document.getElementById("catChart"), {
    type: "doughnut",
    data: {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: [
                "#00ffa3",
                "#00d1ff",
                "#ff4d4d",
                "rgba(255,255,255,0.2)"
            ],
            borderWidth: 0
        }]
    },
    options: {
        maintainAspectRatio: false,
        cutout: "80%",
        plugins: {
            legend: {
                position: "bottom",
                labels: { boxWidth: 8 }
            }
        }
    }
});

calcularResumo();
atualizarTabela();
atualizarGraficoCategorias();