# GestãoPro — Painel Financeiro

Sistema de gestão financeira para múltiplas filiais.  
Mobile-first, offline-first, pronto para Firebase + Google Sheets.

---

## 📁 Estrutura de Arquivos

```
gestaopro/
│
├── index.html                  ← Ponto de entrada (apenas HTML estrutural)
│
├── css/
│   ├── main.css                ← Reset, variáveis CSS, layout base, header, nav
│   ├── components.css          ← Cards, filial rows, employee rows, botões, formulários
│   └── modals.css              ← Overlays e bottom sheets
│
├── js/
│   ├── state.js                ← Estado global da aplicação (objeto State)
│   ├── data.js                 ← Constantes, funções de acesso a dados, seed data
│   ├── utils.js                ← Formatadores, helpers de DOM, toast, toggles
│   │
│   ├── views/
│   │   ├── dashboard.js        ← View do Dashboard
│   │   ├── filiais.js          ← View de lista de filiais + detalhe por filial
│   │   ├── gastos.js           ← View de lançamentos (todos os funcionários)
│   │   └── config.js           ← View de configurações e integrações
│   │
│   └── modals/
│       ├── employee.js         ← Modal: adicionar/editar/excluir funcionário
│       ├── revenue.js          ← Modal: lançar receita por filial
│       └── benefit.js          ← Modal: adicionar benefício customizado
│
└── README.md                   ← Este arquivo
```

---

## 🏪 Filiais Cadastradas

`1046` `1073` `1114` `1144` `1413` `1510` `1560` `2098` `TBE` `Extras`

---

## ✅ Funcionalidades Implementadas

- [x] Dashboard com receita, gastos, saldo e margem %
- [x] Gráfico de barras por mês (ano completo)
- [x] Navegação por mês/ano
- [x] Lista de filiais com saldo individual
- [x] Detalhe por filial (funcionários, receita, gastos)
- [x] Cadastro de funcionário (nome, cargo, escala, salário)
- [x] Toggle de benefícios: VT, VR + benefícios customizados
- [x] Escala de trabalho (6x1, 5x2, 4x3, 12x36...)
- [x] Lançamentos consolidados por mês (ranking de custos)
- [x] Lançar receita por filial
- [x] Design mobile-first estilo fintech

---

## 🚀 Próximos Passos

### Firebase
Trocar `State.db` por `Firestore`:
```js
// Em data.js — substituir as funções getDB() / getFilial()
import { doc, getDoc, setDoc } from 'firebase/firestore';
```

### Google Sheets
Criar `js/integrations/sheets.js` com a função `exportToSheets()`:
- Uma aba por filial
- Colunas: Nome, Cargo, Escala, Salário, VT, VR, Extras, Custo Total

### PWA (App no celular)
Adicionar na raiz:
- `manifest.json` → ícone, nome, cor tema
- `sw.js` → Service Worker para cache offline

### Hospedagem (GitHub Pages)
```bash
git init
git add .
git commit -m "feat: initial GestãoPro"
git remote add origin https://github.com/SEU_USUARIO/gestaopro.git
git push -u origin main
# Ativar GitHub Pages nas configurações do repo → Branch: main / root
```

---

## 🎨 Variáveis de Design (css/main.css)

| Variável         | Uso                         |
|------------------|-----------------------------|
| `--orange`       | Cor primária / CTA          |
| `--green`        | Valores positivos / saldo   |
| `--red`          | Valores negativos / gastos  |
| `--blue`         | Acentos informativos        |
| `--navy`         | Background principal        |
| `--card`         | Background dos cards        |
| `--text2`        | Texto secundário / labels   |

---

## 📐 Como Adicionar uma Nova View

1. Criar `js/views/minhaview.js` com função `renderMinhaView()`
2. Adicionar `<script src="js/views/minhaview.js"></script>` no `index.html`
3. Adicionar item no `bottom-nav` (HTML) e no `navigate()` (app.js)
4. Adicionar case em `renderApp()` (app.js)
