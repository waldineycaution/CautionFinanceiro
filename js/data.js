/* ═══════════════════════════════════════════════
   data.js — Constantes, Acesso a Dados e Cálculos
   ═══════════════════════════════════════════════ */

// FILIAIS é dinâmico — lido de State.filiais para permitir criação/remoção
// Fallback para o array padrão caso State ainda não tenha carregado
var _FILIAIS_DEFAULT = ['1046','1073','1114','1144','1413','1510','1560','2098','TBE','Extras'];
Object.defineProperty(window, 'FILIAIS', {
  get: function() {
    return (typeof State !== 'undefined' && State.filiais && State.filiais.length > 0)
      ? State.filiais
      : _FILIAIS_DEFAULT;
  },
  configurable: true
});

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

const ESCALAS = ['6x1','5x2','4x2','4x3','12x36','Folguista','Integral','Meio período'];

const CARGOS = [
  'Gerente','Subgerente','Supervisor(a)','Vendedor(a)',
  'Caixa','Assistente','Estoquista','Coordenador(a)'
];

// ── CHAVES ────────────────────────────────────

function curKey()             { return `${State.month}-${State.year}`; }
function makeKey(month, year) { return `${month}-${year}`; }

/** Mês de referência para cálculos (mês anterior ao atual) */
function refMonth() {
  let m = State.month - 1;
  let y = State.year;
  if (m < 0) { m = 11; y--; }
  return { month: m, year: y };
}

// ── ACESSO AOS FUNCIONÁRIOS ───────────────────

function getEmployees(filial) {
  if (!State.employees[filial]) State.employees[filial] = [];
  return State.employees[filial];
}

function getActiveEmployees(filial) {
  return getEmployees(filial).filter(e => e.ativo !== false);
}

function getDismissedEmployees(filial) {
  return getEmployees(filial).filter(e => e.ativo === false);
}

function getAllDismissed() {
  const result = [];
  FILIAIS.forEach(f => getDismissedEmployees(f).forEach(e => result.push({ ...e, filial: f })));
  return result;
}

function saveEmployee(filial, emp) {
  const list = getEmployees(filial);
  const idx  = list.findIndex(e => e.id === emp.id);
  if (idx >= 0) list[idx] = { ...emp };
  else          list.push({ ...emp, filial, ativo: true });
}

function dismissEmployee(filial, empId) {
  const list = getEmployees(filial);
  const emp  = list.find(e => e.id === empId);
  if (!emp) return;
  emp.ativo       = false;
  emp.desligadoEm = new Date().toISOString().slice(0, 10);
}

// ── ACESSO AOS DADOS MENSAIS ──────────────────

function getMonthData(filial) {
  const k = curKey();
  if (!State.db[k])         State.db[k] = {};
  if (!State.db[k][filial]) State.db[k][filial] = { receita: 0, lancamentos: {}, despesasExtras: [] };
  const d = State.db[k][filial];
  if (!d.lancamentos)    d.lancamentos    = {};
  if (!d.despesasExtras) d.despesasExtras = [];
  return d;
}

function getFilial(filial) {
  return {
    get receita()        { return getMonthData(filial).receita; },
    set receita(v)       { getMonthData(filial).receita = v; },
    get lancamentos()    { return getMonthData(filial).lancamentos; },
    get despesasExtras() { return getMonthData(filial).despesasExtras; },
    get func()           { return getActiveEmployees(filial); }
  };
}

function getLancamento(filial, empId) {
  const md  = getMonthData(filial);
  const eid = String(empId);
  if (!md.lancamentos[eid]) {
    md.lancamentos[eid] = { hasFaltas: false, faltas: 0, hasBonif: false, bonif: 0, saved: false, custoTotal: 0, aPagar: 0, savedAt: null };
  }
  return md.lancamentos[eid];
}

// ── DESPESAS EXTRAS ───────────────────────────

function getDespesasExtras(filial) {
  return getMonthData(filial).despesasExtras;
}

function addDespesaExtra(filial, despesa) {
  getMonthData(filial).despesasExtras.push({
    id: Date.now(),
    criadoEm: new Date().toISOString().slice(0, 10),
    ...despesa
  });
}

function removeDespesaExtra(filial, id) {
  const md = getMonthData(filial);
  md.despesasExtras = md.despesasExtras.filter(d => d.id !== id);
}

function totalDespesasExtras() {
  return FILIAIS.reduce((sum, f) => {
    return sum + getDespesasExtras(f).reduce((s, d) => s + (d.valor || 0), 0);
  }, 0);
}

// ── FOLGAS E DIAS TRABALHADOS ─────────────────

function folgasNoMes(escala, month, year) {
  const dias = new Date(year, month + 1, 0).getDate();
  switch (escala) {
    case '6x1':          return Math.floor(dias / 7);
    case '5x2':          return Math.floor((dias / 7) * 2);
    case '4x2':          return Math.floor((dias / 6) * 2);
    case '4x3':          return Math.floor((dias / 7) * 3);
    case '12x36':        return Math.floor(dias / 2);
    case 'Integral':
    case 'Meio período': return Math.floor((dias / 7) * 2);
    case 'Folguista':    return Math.floor(dias / 2);
    default:             return 0;
  }
}

function diasTrabalhados(escala, month, year) {
  return new Date(year, month + 1, 0).getDate() - folgasNoMes(escala, month, year);
}

// ── CÁLCULOS DE CUSTO ─────────────────────────

function vtMensal(emp, month, year) {
  if (!(emp.hb && emp.vt)) return 0;
  return (emp.vtv || 0) * diasTrabalhados(emp.escala, month, year);
}

function vrMensal(emp, month, year) {
  if (!(emp.hb && emp.vr)) return 0;
  return (emp.vrv || 0) * diasTrabalhados(emp.escala, month, year);
}

function diaUtil(emp)  { return (emp.salario || 0) / 26; }
function diaVT(emp)    { return (emp.hb && emp.vt) ? (emp.vtv || 0) : 0; }
function diaVR(emp)    { return (emp.hb && emp.vr) ? (emp.vrv || 0) : 0; }

function empCost(emp, month, year) {
  const ref = refMonth();
  const m = (month !== undefined) ? month : ref.month;
  const y = (year  !== undefined) ? year  : ref.year;
  let total = emp.salario || 0;
  if (emp.hb) {
    total += vtMensal(emp, m, y);
    total += vrMensal(emp, m, y);
    total += (emp.extras || []).length * 150;
  }
  return total;
}

function descontoFalta(emp, qtdFaltas) {
  if (!qtdFaltas) return 0;
  return (diaUtil(emp) + diaVT(emp) + diaVR(emp)) * qtdFaltas;
}

// ── CUSTO DO FUNCIONÁRIO NO DASHBOARD ────────

/**
 * Retorna o custo do funcionário para o dashboard.
 * Prioridade: valor confirmado em Lançamentos → estimado pelo salário atual.
 *
 * @param {string}  filialCode
 * @param {object}  emp
 * @param {number}  [month] - mês para cálculo histórico (gráfico anual)
 * @param {number}  [year]
 */
function empCostDash(filialCode, emp, month, year) {
  const m = (month !== undefined) ? month : State.month;
  const y = (year  !== undefined) ? year  : State.year;
  const k = makeKey(m, y);
  const lk = State.db[k]?.[filialCode]?.lancamentos?.[String(emp.id)];

  // Se há lançamento salvo com custoTotal > 0, usa o confirmado
  if (lk && lk.saved && lk.custoTotal > 0) {
    return lk.custoTotal;
  }

  // Senão, estima com base no salário atual e mês de referência
  const refM = m > 0 ? m - 1 : 11;
  const refY = m > 0 ? y : y - 1;
  const faltas = lk ? (lk.hasFaltas ? lk.faltas || 0 : 0) : 0;
  return Math.max(0, empCost(emp, refM, refY) - descontoFalta(emp, faltas));
}

/** Custo total da filial no dashboard (confirmado + estimado) */
function filialCostDash(filialCode) {
  return getActiveEmployees(filialCode).reduce((sum, e) => sum + empCostDash(filialCode, e), 0);
}

/** Custo total de todos os funcionários + despesas extras */
function totalCostDash() {
  let total = 0;
  FILIAIS.forEach(f => {
    total += filialCostDash(f);
    total += getDespesasExtras(f).reduce((s, d) => s + (d.valor || 0), 0);
  });
  return total;
}

/** Quantos funcionários têm lançamento salvo no mês atual */
function totalSaved() {
  const k = curKey();
  let count = 0;
  FILIAIS.forEach(f => {
    getActiveEmployees(f).forEach(e => {
      const lk = State.db[k]?.[f]?.lancamentos?.[String(e.id)];
      if (lk && lk.saved) count++;
    });
  });
  return count;
}

/** Verifica se alguma filial tem lançamento salvo (para label do dashboard) */
function hasAnySaved() {
  const k = curKey();
  return FILIAIS.some(f =>
    getActiveEmployees(f).some(e => {
      const lk = State.db[k]?.[f]?.lancamentos?.[String(e.id)];
      return lk && lk.saved;
    })
  );
}

// ── TOTALIZADORES LEGADOS ─────────────────────

function filialCost(code)     { return getActiveEmployees(code).reduce((s, e) => s + empCost(e), 0); }
function filialCostReal(code) { return filialCostDash(code); }
function totalRevenue()       { return FILIAIS.reduce((s, f) => s + (getMonthData(f).receita || 0), 0); }
function totalCost()          { return FILIAIS.reduce((s, f) => s + filialCost(f), 0); }
function totalEmployees()     { return FILIAIS.reduce((s, f) => s + getActiveEmployees(f).length, 0); }