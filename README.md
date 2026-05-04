# 📊 Dashboard de Gastos Pessoais

## 📌 Visão Geral
O **Dashboard de Gastos Pessoais** é uma aplicação desktop desenvolvida com Electron para controle financeiro básico.

O projeto é dividido em duas partes:
- **Painel de Controle** → responsável por adicionar, editar e remover dados
- **Dashboard** → responsável por exibir os dados visualmente

Os dados são armazenados localmente no computador do usuário.

---

## ⚠️ Status do Projeto
- Em desenvolvimento
- Execução apenas local
- Não está empacotado em `.exe`
- Rodando via `npm start`

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js instalado

### Instalação
``bash
npm install
``
### Execução
``
npm start
``

### Estrutura 

``
control/
 ├── main.js
 ├── preload.js
 ├── www/
 │    └── control.html
 ├── dashboard/
 │    ├── main.js
 │    ├── preload.js
 │    └── www/
 │         └── index.html
``
