/* ═══════════════════════════════════════════════
   modals/employee.js — Cadastro / Edição / Desligamento
   ═══════════════════════════════════════════════ */

function openEmpModal(empId) {
  if (!State.filial) return;

  const existing = empId
    ? getEmployees(State.filial).find(e => e.id === empId)
    : null;

  State.emp = existing
    ? JSON.parse(JSON.stringify(existing))
    : {
        id: Date.now(), nome: '', cargo: 'Vendedor(a)', salario: 1800,
        escala: '5x2', hb: false, vt: false, vr: false,
        vtv: 0, vrv: 0, extras: [], ativo: true
      };

  renderEmpSheet();
  openOverlay('empOverlay');
}

function renderEmpSheet() {
  const e      = State.emp;
  const isEdit = getEmployees(State.filial).some(x => x.id === e.id);
  const isDesligado = e.ativo === false;

  const escalaOpts = ESCALAS.map(s =>
    `<option value="${s}" ${e.escala === s ? 'selected' : ''}>${s}</option>`).join('');
  const cargoOpts  = CARGOS.map(c =>
    `<option value="${c}" ${e.cargo  === c ? 'selected' : ''}>${c}</option>`).join('');
  const extraRows  = (e.extras || []).map((x, i) => `
    <div class="ben-row">
      <div class="ben-name">⭐ ${x}</div>
      <button class="btn-sm"
        style="background:var(--red2);color:var(--red);border-color:rgba(244,63,94,0.2)"
        onclick="removeExtra(${i})">✕</button>
    </div>`).join('');

  document.getElementById('empSheetContent').innerHTML = `
    <div class="sheet-title">${isEdit ? (isDesligado ? '⚠️ Funcionário Desligado' : '✏️ Editar Funcionário') : '+ Novo Funcionário'}</div>

    ${isDesligado ? `
    <div style="background:var(--red2);border:1px solid rgba(244,63,94,0.2);border-radius:12px;
                padding:12px 14px;margin-bottom:16px;font-size:12px;color:var(--red)">
      ⚠️ Desligado em ${formatDate(e.desligadoEm)}. Registros históricos preservados.
    </div>` : ''}

    <div class="form-group">
      <label class="form-label">Nome Completo</label>
      <input class="form-input" id="ef_nome" value="${e.nome}" placeholder="Ex: Ana Silva"
             oninput="State.emp.nome = this.value" ${isDesligado ? 'disabled' : ''}>
    </div>
    <div class="form-row">
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Cargo</label>
        <select class="form-input form-select" onchange="State.emp.cargo = this.value" ${isDesligado ? 'disabled' : ''}>
          ${cargoOpts}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Escala</label>
        <select class="form-input form-select" onchange="State.emp.escala = this.value" ${isDesligado ? 'disabled' : ''}>
          ${escalaOpts}
        </select>
      </div>
    </div>
    <div class="form-group" style="margin-top:14px">
      <label class="form-label">Salário Base</label>
      <div class="input-prefix">
        <span class="prefix-sym">R$</span>
        <input class="form-input" type="number" value="${e.salario || ''}" placeholder="0,00"
               oninput="State.emp.salario = parseFloat(this.value) || 0" ${isDesligado ? 'disabled' : ''}>
      </div>
    </div>

    <div class="divider"></div>

    <div class="tgl-row">
      <div class="tgl-info">
        <div class="tgl-name">🎁 Benefícios</div>
        <div class="tgl-desc">Funcionário possui benefícios</div>
      </div>
      <div class="tgl ${e.hb ? 'on' : ''}" id="tgl_hb" onclick="${isDesligado ? '' : 'toggleHasBenefits()'}">
        <div class="tgl-k" style="transform:${e.hb ? 'translateX(19px)' : ''}"></div>
      </div>
    </div>

    <div id="benExpand" style="display:${e.hb ? 'block' : 'none'}">
      <div class="ben-section">
        <div class="ben-row">
          <div class="ben-name">🚌 VT — valor por dia trabalhado</div>
          <div class="ben-right">
            <input class="ben-input" type="number" value="${e.vtv || ''}" placeholder="R$"
                   oninput="State.emp.vtv = parseFloat(this.value) || 0" ${isDesligado ? 'disabled' : ''}>
            <div class="tgl ${e.vt ? 'on' : ''}" id="tgl_vt" onclick="${isDesligado ? '' : "toggleBenefit('vt','tgl_vt')"}">
              <div class="tgl-k" style="transform:${e.vt ? 'translateX(19px)' : ''}"></div>
            </div>
          </div>
        </div>
        <div class="ben-row">
          <div class="ben-name">🍽️ VR — valor por dia trabalhado</div>
          <div class="ben-right">
            <input class="ben-input" type="number" value="${e.vrv || ''}" placeholder="R$"
                   oninput="State.emp.vrv = parseFloat(this.value) || 0" ${isDesligado ? 'disabled' : ''}>
            <div class="tgl ${e.vr ? 'on' : ''}" id="tgl_vr" onclick="${isDesligado ? '' : "toggleBenefit('vr','tgl_vr')"}">
              <div class="tgl-k" style="transform:${e.vr ? 'translateX(19px)' : ''}"></div>
            </div>
          </div>
        </div>
        ${extraRows}
        ${!isDesligado ? `<button class="add-ben-btn" onclick="openBenModal()">+ Adicionar benefício</button>` : ''}
      </div>
    </div>

    <div class="divider"></div>

    ${isEdit && !isDesligado ? `
    <button class="btn btn-del" style="margin-bottom:8px" onclick="confirmDismiss()">
      🚪 Desligar Funcionário
    </button>` : ''}

    ${!isDesligado ? `
    <button class="btn btn-orange" onclick="saveEmp()">💾 Salvar Funcionário</button>
    <div class="sp"></div>` : ''}
    <button class="btn btn-ghost" onclick="closeOverlay('empOverlay')">Fechar</button>
  `;
}

// ── TOGGLE ────────────────────────────────────

function toggleHasBenefits() {
  State.emp.hb = !State.emp.hb;
  setToggle(document.getElementById('tgl_hb'), State.emp.hb);
  document.getElementById('benExpand').style.display = State.emp.hb ? 'block' : 'none';
}

function toggleBenefit(field, toggleId) {
  State.emp[field] = !State.emp[field];
  setToggle(document.getElementById(toggleId), State.emp[field]);
}

function removeExtra(index) {
  State.emp.extras.splice(index, 1);
  renderEmpSheet();
}

// ── SALVAR ────────────────────────────────────

function saveEmp() {
  const e = State.emp;
  if (!e.nome.trim()) { showToast('⚠️ Informe o nome do funcionário', 'orange'); return; }
  saveEmployee(State.filial, e);

  // Se havia lançamento salvo, invalida o cache para forçar recálculo
  var hadSavedLancamento = false;
  Object.keys(State.db).forEach(function(k) {
    var lk = State.db[k]?.[State.filial]?.lancamentos?.[String(e.id)];
    if (lk && lk.saved) {
      hadSavedLancamento = true;
      lk.saved      = false;
      lk.custoTotal = 0;
      lk.aPagar     = 0;
    }
  });

  saveState();
  scheduleSheetsSync();
  closeOverlay('empOverlay');
  if (hadSavedLancamento) {
    showToast('⚠️ Salvo! Refaça o lançamento para atualizar.', 'orange');
  } else {
    showToast('✅ Funcionário salvo!');
  }
  renderApp();
}

// ── DESLIGAMENTO ──────────────────────────────

function confirmDismiss() {
  const e = State.emp;
  document.getElementById('empSheetContent').innerHTML = `
    <div class="sheet-title">🚪 Desligar Funcionário</div>
    <div style="text-align:center;padding:10px 0 20px">
      <div style="font-size:36px;margin-bottom:10px">⚠️</div>
      <div style="font-size:15px;font-weight:700;margin-bottom:8px">${e.nome}</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.6">
        O funcionário será marcado como <strong style="color:var(--red)">desligado</strong> hoje.<br>
        O histórico de lançamentos é preservado.<br>
        A rescisão poderá ser lançada em Despesas Extras.
      </div>
    </div>
    <button class="btn btn-del" style="margin-bottom:8px" onclick="executeDissmiss()">
      ✅ Confirmar Desligamento
    </button>
    <button class="btn btn-ghost" onclick="renderEmpSheet()">← Voltar</button>
  `;
}

function executeDissmiss() {
  dismissEmployee(State.filial, State.emp.id);
  saveState();
  scheduleSheetsSync();
  closeOverlay('empOverlay');
  showToast('🚪 Funcionário desligado', 'orange');
  renderApp();
}