/* ═══════════════════════════════════════════════
   modals/revenue.js — Lançar Receita Modal
   ═══════════════════════════════════════════════ */

function openRevModal(filialCode) {
  var targets = filialCode ? [filialCode] : FILIAIS;

  var fields = targets.map(function(f) {
    var val = getMonthData(f).receita || '';
    return '<div class="form-group" style="margin-bottom:10px">' +
      '<label class="form-label">Filial ' + f + '</label>' +
      '<div class="input-prefix">' +
        '<span class="prefix-sym">R$</span>' +
        '<input class="form-input" type="number" id="rv_' + f + '"' +
               ' value="' + val + '" placeholder="0,00"' +
               ' data-filial="' + f + '">' +
      '</div></div>';
  }).join('');

  document.getElementById('revSheetContent').innerHTML =
    '<div class="sheet-title">💰 Receita — ' + MONTHS[State.month] + '</div>' +
    '<div style="font-size:11px;color:var(--text2);margin-bottom:14px">' +
      (filialCode ? 'Filial ' + filialCode : 'Todas as filiais') +
      ' · ' + State.year +
    '</div>' +
    fields +
    '<button class="btn btn-orange" onclick="saveRevenues()">💾 Salvar Receitas</button>' +
    '<div class="sp"></div>' +
    '<button class="btn btn-ghost" onclick="closeOverlay(\'revOverlay\')">Fechar</button>';

  openOverlay('revOverlay');
}

function saveRevenues() {
  // Lê todos os inputs e grava no State
  document.querySelectorAll('#revSheetContent input[data-filial]').forEach(function(input) {
    var f   = input.getAttribute('data-filial');
    var val = parseFloat(input.value) || 0;
    getMonthData(f).receita = val;
  });

  saveState();
  scheduleSheetsSync();
  closeOverlay('revOverlay');
  showToast('✅ Receitas atualizadas!');
  renderApp();
}