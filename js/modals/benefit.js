/* ═══════════════════════════════════════════════
   modals/benefit.js — Adicionar Benefício Modal
   ═══════════════════════════════════════════════ */

function openBenModal() {
  document.getElementById('benSheetContent').innerHTML = `
    <div class="sheet-title">➕ Novo Benefício</div>

    <div class="form-group">
      <label class="form-label">Nome do Benefício</label>
      <input class="form-input" id="bn_name"
             placeholder="Ex: Plano de Saúde, Gympass, Odontológico...">
    </div>

    <div class="form-group">
      <label class="form-label">Valor Mensal (opcional)</label>
      <div class="input-prefix">
        <span class="prefix-sym">R$</span>
        <input class="form-input" type="number" id="bn_val" placeholder="0,00">
      </div>
    </div>

    <button class="btn btn-orange" onclick="addBenefit()">➕ Adicionar Benefício</button>
    <div class="sp"></div>
    <button class="btn btn-ghost" onclick="closeOverlay('benOverlay')">Cancelar</button>
  `;

  openOverlay('benOverlay');
}

function addBenefit() {
  const name  = document.getElementById('bn_name').value.trim();
  if (!name) {
    showToast('⚠️ Informe o nome do benefício', 'orange');
    return;
  }

  if (!State.emp.extras) State.emp.extras = [];
  State.emp.extras.push(name);

  closeOverlay('benOverlay');
  renderEmpSheet(); // refresh employee form
}
