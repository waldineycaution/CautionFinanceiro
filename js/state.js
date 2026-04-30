/* ═══════════════════════════════════════════════
   state.js — Global Application State
   ═══════════════════════════════════════════════ */

const State = {
  // ── Navigation
  tab:      'dash',
  filial:   null,
  emp:      null,

  // ── Gastos tab navigation (3 levels)
  gastoFilial: null,
  gastoEmp:    null,

  // ── Dashboard drill-down navigation
  dashFilial: null,   // filial selecionada no dashboard
  dashEmp:    null,   // funcionário selecionado no dashboard

  // ── Despesas tab navigation
  despesasMode:   null,   // null | 'rescisao' | 'nova-despesa'
  despesasFilial: null,   // filial selecionada no fluxo de rescisão
  despesasEmp:    null,   // funcionário desligado selecionado

  // ── Date
  month: new Date().getMonth(),
  year:  new Date().getFullYear(),

  // ── UI
  viewMode: 'mensal',

  // ── Cadastro permanente de funcionários (independente do mês)
  // Estrutura: employees['1046'] = [{ id, nome, cargo, ..., ativo, desligadoEm, filial }]
  employees: {},

  // ── Filiais (dinâmico — editável pelo usuário)
  filiais: ['1046','1073','1114','1144','1413','1510','1560','2098','TBE','Extras'],

  // ── Metas do usuário
  goals: { folha: 35, margem: 25 },

  // ── Dados mensais — chave "mes-ano"
  // Estrutura: db['3-2026']['1046'] = { receita, lancamentos, despesasExtras }
  db: {}
};