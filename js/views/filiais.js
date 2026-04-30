/* ═══════════════════════════════════════════════
   views/filiais.js — Lista de Filiais e Detalhe
   ═══════════════════════════════════════════════ */

// ── LISTA DE FILIAIS ──────────────────────────

function renderFiliais() {
  const rows = FILIAIS.map(f => {
    const g   = filialCost(f);
    const r   = getMonthData(f).receita;
    const sal = r - g;
    const cnt = getActiveEmployees(f).length;

    return `
      <div class="filial-row" onclick="goFilial('${f}')">
        <div class="f-badge">${f}</div>
        <div class="f-info">
          <div class="f-name">Filial ${f}</div>
          <div class="f-meta">${cnt} funcionário${cnt !== 1 ? 's' : ''}</div>
          <div class="f-inlines">
            <span class="f-inline" style="color:var(--green)">↑ ${fmtk(r)}</span>
            <span class="f-inline" style="color:var(--red)">↓ ${fmtk(g)}</span>
          </div>
        </div>
        <div class="f-right">
          <div class="f-amount" style="color:${sal >= 0 ? 'var(--green)' : 'var(--red)'}">
            ${fmtk(sal)}
          </div>
          <div class="f-pct">saldo</div>
        </div>
        <div class="f-chevron">›</div>
      </div>`;
  }).join('');

  const chips = FILIAIS.map(f =>
    `<div class="chip" onclick="goFilial('${f}')">${f}</div>`
  ).join('');

  return `
    <div class="sec-head">
      <div class="sec-title">🏪 Filiais</div>
      <button class="btn-sm" style="background:var(--orange);color:#111;border:none;font-weight:700"
              onclick="abrirNovaFilial()">+ Nova Filial</button>
    </div>
    <div class="chips">${chips}</div>
    ${rows}
  `;
}

// ── NOVA FILIAL ───────────────────────────────

function abrirNovaFilial() {
  document.getElementById('empSheetContent').innerHTML = `
    <div class="sheet-title">🏪 Nova Filial</div>

    <div class="form-group">
      <label class="form-label">Código / Nome da Filial</label>
      <input class="form-input" id="nf_codigo" placeholder="Ex: 3001, SP-01, Matriz..."
             style="text-transform:uppercase"
             oninput="this.value = this.value.toUpperCase()">
      <div style="font-size:10px;color:var(--text3);margin-top:6px">
        Use um código curto — é o identificador que aparece no badge laranja.
      </div>
    </div>

    <button class="btn btn-orange" onclick="criarFilial()">✅ Criar Filial</button>
    <div class="sp"></div>
    <button class="btn btn-ghost" onclick="closeOverlay('empOverlay')">Cancelar</button>
  `;
  openOverlay('empOverlay');
}

function criarFilial() {
  const input = document.getElementById('nf_codigo');
  const codigo = (input ? input.value.trim().toUpperCase() : '');

  if (!codigo) {
    showToast('⚠️ Informe o código da filial', 'orange'); return;
  }
  if (codigo.length > 10) {
    showToast('⚠️ Máximo 10 caracteres', 'orange'); return;
  }
  if (FILIAIS.includes(codigo)) {
    showToast('⚠️ Filial já existe!', 'orange'); return;
  }

  State.filiais.push(codigo);
  saveState();
  closeOverlay('empOverlay');
  showToast('✅ Filial ' + codigo + ' criada!');
  renderApp();
}

// ── DETALHE DA FILIAL ─────────────────────────

function renderFilialDetail() {
  const f    = State.filial;
  const r    = getMonthData(f).receita;
  const g    = filialCost(f);
  const sal  = r - g;
  const ativos     = getActiveEmployees(f);
  const desligados = getDismissedEmployees(f);
  const cnt  = ativos.length;

  const empRows = cnt === 0
    ? `<div class="empty">
         <div class="empty-ico">👤</div>
         <div class="empty-msg">Nenhum funcionário ativo.<br>Toque em <strong>+</strong> para adicionar.</div>
       </div>`
    : ativos.map(e => renderEmpRow(e)).join('');

  const desligadosSection = desligados.length > 0 ? `
    <div class="sec-head" style="margin-top:20px">
      <div class="sec-title" style="font-size:12px;color:var(--text2)">
        🚪 Desligados (${desligados.length})
      </div>
    </div>
    ${desligados.map(e => `
      <div class="emp-row" style="opacity:0.6" onclick="openEmpModal(${e.id})">
        <div class="emp-av" style="border-color:var(--red2)">${initials(e.nome)}</div>
        <div class="emp-info">
          <div class="emp-name">${e.nome}</div>
          <div class="emp-role">${e.cargo}</div>
          <div style="font-size:10px;color:var(--red);margin-top:3px">
            Desligado em ${formatDate(e.desligadoEm)}
          </div>
        </div>
        <div class="f-chevron">›</div>
      </div>`).join('')}
  ` : '';

  return `
    <div class="back-hd">
      <div class="back-btn" onclick="leaveFilial()">‹</div>
      <div>
        <div class="back-title">Filial ${f}</div>
        <div class="back-sub">${cnt} ativo${cnt !== 1 ? 's' : ''} · ${MONTHS[State.month]}</div>
      </div>
      <div style="display:flex;gap:6px;margin-left:auto">
        <button class="btn-sm" onclick="openRevModal('${f}')">💰 Receita</button>
        ${cnt === 0 && desligados.length === 0
          ? `<button class="btn-sm" style="background:var(--red2);color:var(--red);border-color:rgba(244,63,94,0.3)"
               onclick="excluirFilial('${f}')">🗑️</button>`
          : ''}
      </div>
    </div>

    <div class="grid2">
      <div class="mini-card">
        <div class="mini-label">Receita</div>
        <div class="mini-value" style="color:var(--green); font-size:15px">${fmt(r)}</div>
      </div>
      <div class="mini-card">
        <div class="mini-label">Total Gasto</div>
        <div class="mini-value" style="color:var(--red); font-size:15px">${fmt(g)}</div>
      </div>
    </div>

    <div class="card" style="text-align:center; padding:14px; margin-bottom:16px">
      <div class="card-title">Saldo Líquido</div>
      <div style="font-size:22px; font-weight:800; font-family:'JetBrains Mono',monospace;
                  margin-top:4px; color:${sal >= 0 ? 'var(--green)' : 'var(--red)'}">
        ${fmt(sal)}
      </div>
    </div>

    <div class="sec-head">
      <div class="sec-title">👥 Funcionários</div>
      <button class="btn-sm" onclick="openEmpModal(null)">+ Novo</button>
    </div>
    ${empRows}
    ${desligadosSection}
  `;
}

// ── CARD DE FUNCIONÁRIO ───────────────────────

function renderEmpRow(emp) {
  const cost   = empCost(emp);
  const vtTag  = emp.hb && emp.vt ? '<span class="tag tag-vt">VT</span>' : '';
  const vrTag  = emp.hb && emp.vr ? '<span class="tag tag-vr">VR</span>' : '';
  const excTags = (emp.extras || []).map(x =>
    `<span class="tag tag-ex">${x.slice(0, 8)}</span>`).join('');

  return `
    <div class="emp-row" onclick="openEmpModal(${emp.id})">
      <div class="emp-av">${initials(emp.nome)}</div>
      <div class="emp-info">
        <div class="emp-name">${emp.nome}</div>
        <div class="emp-role">${emp.cargo}</div>
        <div class="emp-tags">
          <span class="tag tag-esc">${emp.escala}</span>
          ${vtTag}${vrTag}${excTags}
        </div>
      </div>
      <div class="emp-cost">
        <div class="emp-total">${fmtk(cost)}</div>
        <div class="emp-sal-label">custo/mês</div>
      </div>
      <div class="f-chevron">›</div>
    </div>`;
}

// ── NAVEGAÇÃO ─────────────────────────────────

function excluirFilial(code) {
  if (!confirm('Excluir Filial ' + code + '? Esta ação não pode ser desfeita.')) return;
  State.filiais = State.filiais.filter(function(f) { return f !== code; });
  // Remove dados da filial de todos os meses
  Object.keys(State.db).forEach(function(k) {
    if (State.db[k][code]) delete State.db[k][code];
  });
  if (State.employees[code]) delete State.employees[code];
  State.filial = null;
  saveState();
  showToast('🗑️ Filial ' + code + ' removida', 'orange');
  renderApp();
}

function goFilial(code) {
  State.filial = code;
  State.tab    = 'filiais';
  setActiveNav('filiais');
  document.getElementById('fab').classList.remove('hidden');
  renderApp();
}

function leaveFilial() {
  State.filial = null;
  document.getElementById('fab').classList.add('hidden');
  renderApp();
}