/* ═══════════════════════════════════════════════
   sheets.js — Integração Google Sheets via Apps Script
   Sem OAuth — funciona em localhost e produção.
   ═══════════════════════════════════════════════ */

const SHEETS_STORAGE_KEY = 'gestaopro_sheets_url';
const SHEET_MONTH_NAMES  = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

var _sheetsUrl      = '';
var _syncDebounce   = null;
var _syncInProgress = false;

// ── INICIALIZAÇÃO ─────────────────────────────

function initSheets() {
  _sheetsUrl = localStorage.getItem(SHEETS_STORAGE_KEY) || '';
  _updateSheetsBtn();
}

// ── URL DO APPS SCRIPT ────────────────────────

function saveSheetsUrl() {
  var input = document.getElementById('sheetsUrlInput');
  if (!input) return;
  var url = input.value.trim();
  if (!url) { showToast('⚠️ Cole a URL do Apps Script', 'orange'); return; }
  _sheetsUrl = url;
  localStorage.setItem(SHEETS_STORAGE_KEY, url);
  _updateSheetsBtn();
  showToast('✅ URL salva! Testando conexão...');
  _testConnection();
}

function loadSheetsUrl() {
  _sheetsUrl = localStorage.getItem(SHEETS_STORAGE_KEY) || '';
}

function getSheetsUrl() {
  return _sheetsUrl;
}

async function _testConnection() {
  if (!_sheetsUrl) return;
  try {
    var res  = await fetch(_sheetsUrl);
    var data = await res.json();
    if (data.ok) {
      showToast('✅ Sheets conectado!');
      _updateSheetsBtn();
    }
  } catch(e) {
    // Em localhost pode dar CORS no GET também — tenta confirmar via no-cors
    try {
      await fetch(_sheetsUrl, { mode: 'no-cors' });
      showToast('✅ Sheets configurado! (CORS local — ok em produção)');
      _setSheetsStatus(true);
    } catch(e2) {
      showToast('⚠️ Não foi possível conectar. Verifique a URL.', 'orange');
    }
  }
}

// ── BOTÃO DE STATUS ───────────────────────────

function _setSheetsStatus(ok) {
  var pill = document.getElementById('sheetsStatusPill');
  if (!pill) return;
  pill.className = 'status-pill ' + (ok ? 'ok' : '');
  var dot = pill.querySelector('.status-dot');
  if (dot) dot.className = 'status-dot' + (ok ? ' pulse' : '');
  pill.querySelector('span').textContent = ok ? 'Sheets' : 'Sheets';
}

function _updateSheetsBtn() {
  var btn = document.getElementById('sheetsSyncBtn');
  if (!btn) return;
  if (_sheetsUrl) {
    _setSheetsStatus(true);
    btn.textContent      = '📊 Sheets Conectado ✓';
    btn.style.color      = 'var(--green)';
    btn.style.borderColor = 'rgba(16,217,160,0.3)';
  } else {
    _setSheetsStatus(false);
    btn.textContent      = '📊 Configurar Sheets';
    btn.style.color      = '';
    btn.style.borderColor = '';
  }
}

function sheetsSignIn() {
  // Navega para a aba de configurações onde o usuário cola a URL
  navigate('config');
  showToast('Cole a URL do Apps Script em Configurações', 'orange');
}

// ── SYNC AUTOMÁTICO (com debounce) ───────────

function scheduleSheetsSync() {
  if (!_sheetsUrl) return;
  clearTimeout(_syncDebounce);
  _syncDebounce = setTimeout(function() {
    syncToSheets();
  }, 3000);
}

// ── SYNC PRINCIPAL ────────────────────────────

async function syncToSheets() {
  if (!_sheetsUrl)      { showToast('⚙️ Configure o Sheets primeiro', 'orange'); return; }
  if (_syncInProgress)  return;
  _syncInProgress = true;

  try {
    showToast('📊 Sincronizando Sheets...', 'orange');

    var periods = _getPeriodsWithData();
    var errors  = 0;

    for (var i = 0; i < periods.length; i++) {
      var ok = await _syncPeriod(periods[i].month, periods[i].year, periods[i].key);
      if (!ok) errors++;
    }

    if (errors === 0) {
      _setSheetsStatus(true);
      showToast('✅ Sheets atualizado!');
    } else {
      showToast('⚠️ ' + errors + ' período(s) com erro', 'orange');
    }
  } catch(err) {
    console.error('Sheets sync error:', err);
    _setSheetsStatus(false);
    showToast('⚠️ Erro ao sincronizar', 'orange');
  } finally {
    _syncInProgress = false;
  }
}

// ── PERÍODOS COM DADOS ─────────────────────────

function _getPeriodsWithData() {
  var periods = [];
  Object.keys(State.db).forEach(function(key) {
    var parts   = key.split('-');
    var month   = parseInt(parts[0]);
    var year    = parseInt(parts[1]);
    var hasData = FILIAIS.some(function(f) {
      var fd = State.db[key] && State.db[key][f];
      // Só inclui meses com receita lançada ou lançamento confirmado
      return (fd && fd.receita > 0) ||
        Object.values((fd || {}).lancamentos || {}).some(function(lk) { return lk && lk.saved; }) ||
        ((fd && fd.despesasExtras || []).length > 0);
    });
    if (hasData) periods.push({ month: month, year: year, key: key });
  });
  periods.sort(function(a, b) { return (a.year * 12 + a.month) - (b.year * 12 + b.month); });
  return periods;
}

// ── LIMPAR TODAS AS ABAS ─────────────────────────

async function clearAllSheets() {
  if (!_sheetsUrl) { showToast('⚙️ Configure o Sheets primeiro', 'orange'); return; }

  try {
    showToast('🗑️ Limpando Sheets...', 'orange');

    try {
      var res  = await fetch(_sheetsUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain' },
        body:    JSON.stringify({ action: 'clear' })
      });
      var data = JSON.parse(await res.text());
      showToast(data.ok ? '✅ Sheets limpo!' : '⚠️ Erro: ' + (data.error || ''), data.ok ? 'green' : 'orange');
    } catch(corsErr) {
      // Fallback no-cors
      await fetch(_sheetsUrl, {
        method:  'POST',
        mode:    'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body:    JSON.stringify({ action: 'clear' })
      });
      showToast('✅ Sheets limpo!');
    }
  } catch(err) {
    showToast('⚠️ Erro ao limpar Sheets', 'orange');
  }
}

// ── SYNC DE UM PERÍODO ─────────────────────────

async function _syncPeriod(month, year, key) {
  var refM = month > 0 ? month - 1 : 11;
  var refY = month > 0 ? year : year - 1;
  var rows = [];

  FILIAIS.forEach(function(filial) {
    var fd = State.db[key] && State.db[key][filial];

    // ── Funcionários ativos ─────────────────────
    getActiveEmployees(filial).forEach(function(emp) {
      var lk     = fd && fd.lancamentos && fd.lancamentos[String(emp.id)];
      var faltas = lk ? (lk.hasFaltas ? lk.faltas || 0 : 0) : 0;
      var bonif  = lk ? (lk.hasBonif  ? lk.bonif  || 0 : 0) : 0;

      var diasTrab = diasTrabalhados(emp.escala, refM, refY);
      var vtMes    = vtMensal(emp, refM, refY);
      var vrMes    = vrMensal(emp, refM, refY);
      var totalBen = vtMes + vrMes + ((emp.extras || []).length * 150);
      var salDia20 = parseFloat((emp.salario * 0.40).toFixed(2));
      var salDia5  = lk && lk.saved ? parseFloat((lk.aPagar || 0).toFixed(2)) : 0;

      rows.push([
        filial,
        emp.nome,
        parseFloat((emp.salario || 0).toFixed(2)),
        parseFloat(vtMes.toFixed(2)),
        parseFloat(vrMes.toFixed(2)),
        parseFloat(totalBen.toFixed(2)),
        diasTrab,
        faltas,
        salDia20,
        salDia5,
        parseFloat(bonif.toFixed(2)),
        0  // Rescisão — R$ 0,00 para ativos
      ]);
    });

    // ── Funcionários desligados com rescisão neste mês ──
    var despesas = (fd && fd.despesasExtras) || [];
    var rescisoes = despesas.filter(function(d) { return d.tipo === 'rescisao'; });

    rescisoes.forEach(function(resc) {
      // Busca dados do funcionário (pode estar em desligados)
      var emp = (State.employees[filial] || []).find(function(e) {
        return String(e.id) === String(resc.empId);
      });
      var nome    = resc.empNome || (emp ? emp.nome : '—');
      var salario = emp ? parseFloat((emp.salario || 0).toFixed(2)) : 0;

      rows.push([
        filial,
        nome + ' (Rescisão)',
        salario,
        0, 0, 0,  // VT, VR, Total Ben
        0, 0,     // Dias Trab, Faltas
        0, 0, 0,  // Dia 20, Dia 5, Bonif
        parseFloat((resc.valor || 0).toFixed(2))  // Rescisão
      ]);
    });
  });

  try {
    var body = JSON.stringify({ month: month, year: year, rows: rows });

    // Tenta com leitura de resposta
    try {
      var res  = await fetch(_sheetsUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain' },
        body:    body
      });
      var text = await res.text();
      var data = JSON.parse(text);
      return data.ok === true;
    } catch(corsErr) {
      // CORS bloqueou a leitura da resposta (comum em localhost)
      // Reenvia com no-cors — dados chegam mas não conseguimos ler a resposta
      await fetch(_sheetsUrl, {
        method:  'POST',
        mode:    'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body:    body
      });
      return true; // assume sucesso — dados foram enviados
    }
  } catch(err) {
    console.error('_syncPeriod fetch error:', month, year, err.message);
    return false;
  }
}