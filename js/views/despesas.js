/* ═══════════════════════════════════════════════
   views/despesas.js
   ═══════════════════════════════════════════════ */

var CATEGORIAS_DESPESA = [
  'COMPRA DE PEÇAS',
  'PAGAMENTO DE ALUGUEL',
  'PAGAMENTO DE INTERNET',
  'PAGAMENTO DE ÁGUA',
  'PAGAMENTO DE LUZ',
  'CUSTO COM MANUTENÇÃO PREDIAL',
  'FREE LANCES',
  'INVESTIMENTO PREDIAL'
];

function renderDespesas() {
  const { despesasMode: mode, despesasFilial: df, despesasEmp: de } = State;

  if (mode === 'nova-despesa')              return renderNovaDespesa();
  if (mode === 'rescisao' && de)            return renderRescisaoValor();
  if (mode === 'rescisao' && df)            return renderRescisaoEmps();
  if (mode === 'rescisao')                  return renderRescisaoFiliais();
  return renderDespesasMenu();
}

// ─────────────────────────────────────────────
// MENU PRINCIPAL
// ─────────────────────────────────────────────

function renderDespesasMenu() {
  // Agrupa todas as despesas do mês por filial
  const todasDespesas = [];
  FILIAIS.forEach(f => {
    getDespesasExtras(f).forEach(d => todasDespesas.push({ ...d, filial: f }));
  });
  todasDespesas.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  const totalExtra = todasDespesas.reduce((s, d) => s + (d.valor || 0), 0);

  return `
    <div class="sec-head">
      <div class="sec-title">💸 Despesas Extras</div>
      <div style="font-size:11px;color:var(--text2)">${MONTHS[State.month]} ${State.year}</div>
    </div>

    <!-- Ações -->
    <div class="grid2" style="margin-bottom:14px">
      <div class="action-card" onclick="State.despesasMode='rescisao';renderApp()">
        <div class="action-icon">📄</div>
        <div class="action-label">Rescisão de<br>Funcionário</div>
      </div>
      <div class="action-card" onclick="State.despesasMode='nova-despesa';renderApp()">
        <div class="action-icon">➕</div>
        <div class="action-label">Nova<br>Despesa</div>
      </div>
    </div>

    <!-- Total do mês -->
    ${todasDespesas.length > 0 ? `
    <div class="card" style="margin-bottom:12px;padding:14px 16px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="card-title">Total de despesas extras</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:var(--red)">
          ${fmt(totalExtra)}
        </div>
      </div>
    </div>` : ''}

    <!-- Lista do mês -->
    <div class="sec-head" style="margin-top:4px">
      <div class="sec-title" style="font-size:13px">Lançamentos de ${MONTHS[State.month]}</div>
    </div>

    ${todasDespesas.length === 0
      ? `<div class="empty"><div class="empty-ico">💸</div><div class="empty-msg">Nenhuma despesa extra este mês.</div></div>`
      : todasDespesas.map(d => `
        <div class="gasto-row" style="position:relative">
          <div class="g-filial">${d.filial}</div>
          <div class="g-info">
            <div class="g-name">${d.tipo === 'rescisao' ? '📄 ' : '💸 '}${d.descricao}</div>
            <div class="g-det">${d.empNome ? d.empNome + ' · ' : ''}${formatDate(d.dataLancamento || d.criadoEm)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="g-val">${fmt(d.valor)}</div>
            <button onclick="removerDespesa('${d.filial}', ${d.id})"
              style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:14px;
                     padding:4px;transition:color 0.2s" title="Remover">✕</button>
          </div>
        </div>`).join('')
    }
  `;
}

// ─────────────────────────────────────────────
// RESCISÃO — PASSO 1: Selecionar filial
// ─────────────────────────────────────────────

function renderRescisaoFiliais() {
  const filiaisComDesligados = FILIAIS.filter(f => getDismissedEmployees(f).length > 0);

  return `
    <div class="back-hd">
      <div class="back-btn" onclick="navDespesas(null,null,null)">‹</div>
      <div>
        <div class="back-title">Rescisão</div>
        <div class="back-sub">Selecione a filial do funcionário</div>
      </div>
    </div>
    ${filiaisComDesligados.length === 0
      ? `<div class="empty">
           <div class="empty-ico">🔍</div>
           <div class="empty-msg">Nenhum funcionário desligado encontrado.<br>
             Para desligar, acesse a ficha do funcionário em <strong>Filiais</strong>.
           </div>
         </div>`
      : filiaisComDesligados.map(f => {
          const cnt = getDismissedEmployees(f).length;
          return `
          <div class="filial-row" onclick="navDespesas('rescisao','${f}',null)">
            <div class="f-badge">${f}</div>
            <div class="f-info">
              <div class="f-name">Filial ${f}</div>
              <div class="f-meta">${cnt} funcionário${cnt !== 1 ? 's' : ''} desligado${cnt !== 1 ? 's' : ''}</div>
            </div>
            <div class="f-chevron">›</div>
          </div>`;
        }).join('')
    }
  `;
}

// ─────────────────────────────────────────────
// RESCISÃO — PASSO 2: Funcionários desligados
// ─────────────────────────────────────────────

function renderRescisaoEmps() {
  const f    = State.despesasFilial;
  const emps = getDismissedEmployees(f);

  // Funcionários que já têm rescisão lançada neste mês
  const jaLancados = new Set(
    getDespesasExtras(f)
      .filter(d => d.tipo === 'rescisao')
      .map(d => String(d.empId))
  );

  const pendentes  = emps.filter(e => !jaLancados.has(String(e.id)));
  const finalizados = emps.filter(e => jaLancados.has(String(e.id)));

  const rowsPendentes = pendentes.length === 0
    ? `<div class="empty"><div class="empty-ico">✅</div>
       <div class="empty-msg">Todas as rescisões já foram lançadas este mês.</div></div>`
    : pendentes.map(e => `
      <div class="emp-row" onclick="navDespesas('rescisao','${f}',${e.id})">
        <div class="emp-av">${initials(e.nome)}</div>
        <div class="emp-info">
          <div class="emp-name">${e.nome}</div>
          <div class="emp-role">${e.cargo}</div>
          <div style="font-size:10px;color:var(--red);margin-top:3px">
            🚪 Desligado em ${formatDate(e.desligadoEm)}
          </div>
        </div>
        <div class="f-chevron">›</div>
      </div>`).join('');

  const rowsFinalizados = finalizados.length > 0 ? `
    <div style="font-size:10px;color:var(--text3);text-transform:uppercase;
                letter-spacing:0.5px;font-weight:600;margin:16px 0 8px;padding:0 2px">
      ✅ Já lançados este mês
    </div>
    ${finalizados.map(e => `
      <div class="emp-row" style="opacity:0.45;pointer-events:none">
        <div class="emp-av" style="border-color:var(--green2)">${initials(e.nome)}</div>
        <div class="emp-info">
          <div class="emp-name">${e.nome}</div>
          <div class="emp-role">${e.cargo}</div>
          <div style="font-size:10px;color:var(--green);margin-top:3px">
            ✓ Rescisão lançada em ${MONTHS[State.month]}
          </div>
        </div>
      </div>`).join('')}
  ` : '';

  return `
    <div class="back-hd">
      <div class="back-btn" onclick="navDespesas('rescisao',null,null)">‹</div>
      <div>
        <div class="back-title">Filial ${f}</div>
        <div class="back-sub">Selecione o funcionário desligado</div>
      </div>
    </div>
    ${rowsPendentes}
    ${rowsFinalizados}
  `;
}

// ─────────────────────────────────────────────
// RESCISÃO — PASSO 3: Inserir valor
// ─────────────────────────────────────────────

function renderRescisaoValor() {
  const f   = State.despesasFilial;
  const emp = getEmployees(f).find(e => e.id === State.despesasEmp);
  if (!emp) return '';

  return `
    <div class="back-hd">
      <div class="back-btn" onclick="navDespesas('rescisao','${f}',null)">‹</div>
      <div>
        <div class="back-title">Rescisão</div>
        <div class="back-sub">${emp.nome} · Filial ${f}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <div class="emp-av">${initials(emp.nome)}</div>
        <div>
          <div style="font-size:14px;font-weight:700">${emp.nome}</div>
          <div style="font-size:11px;color:var(--text2)">${emp.cargo} · ${emp.escala}</div>
          <div style="font-size:10px;color:var(--red);margin-top:3px">
            🚪 Desligado em ${formatDate(emp.desligadoEm)}
          </div>
        </div>
      </div>
      <div class="lancamento-row">
        <span class="lanc-label">Salário base</span>
        <span class="lanc-val">${fmt(emp.salario)}</span>
      </div>
      <div class="lancamento-row">
        <span class="lanc-label" style="font-size:10px;color:var(--text3)">
          O valor da rescisão é calculado pelo RH
        </span>
      </div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <div class="card-title" style="margin-bottom:12px">📄 Valor da Rescisão</div>
      <div class="form-group">
        <label class="form-label">Valor a lançar em ${MONTHS[State.month]} ${State.year}</label>
        <div class="input-prefix">
          <span class="prefix-sym">R$</span>
          <input class="form-input" type="number" id="rescisao_val" placeholder="0,00">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Observação (opcional)</label>
        <input class="form-input" id="rescisao_obs" placeholder="Ex: Rescisão sem justa causa">
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Data do lançamento</label>
        <input class="form-input" type="date" id="rescisao_data"
               value="${new Date().toISOString().slice(0,10)}">
      </div>
    </div>

    <button class="btn btn-orange" onclick="lancarRescisao('${f}', ${emp.id})">
      📄 Lançar Rescisão
    </button>
    <div class="sp"></div>
    <button class="btn btn-ghost" onclick="navDespesas('rescisao','${f}',null)">Cancelar</button>
  `;
}

// ─────────────────────────────────────────────
// NOVA DESPESA
// ─────────────────────────────────────────────

function renderNovaDespesa() {
  var catOptions = CATEGORIAS_DESPESA.map(function(cat) {
    return '<option value="' + cat + '">' + cat + '</option>';
  }).join('');

  return `
    <div class="back-hd">
      <div class="back-btn" onclick="navDespesas(null,null,null)">‹</div>
      <div>
        <div class="back-title">Nova Despesa</div>
        <div class="back-sub">${MONTHS[State.month]} ${State.year}</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:14px">
      <div class="form-group">
        <label class="form-label">Filial</label>
        <select class="form-input form-select" id="nd_filial">
          ${FILIAIS.map(f => '<option value="' + f + '">' + f + '</option>').join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Categoria</label>
        <select class="form-input form-select" id="nd_desc">
          <option value="">Selecione a categoria...</option>
          ${catOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Valor</label>
        <div class="input-prefix">
          <span class="prefix-sym">R$</span>
          <input class="form-input" type="number" id="nd_val" placeholder="0,00">
        </div>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Data do lançamento</label>
        <input class="form-input" type="date" id="nd_data"
               value="${new Date().toISOString().slice(0,10)}">
      </div>
    </div>

    <button class="btn btn-orange" onclick="lancarNovaDespesa()">💸 Lançar Despesa</button>
    <div class="sp"></div>
    <button class="btn btn-ghost" onclick="navDespesas(null,null,null)">Cancelar</button>
  `;
}

// ── AÇÕES ─────────────────────────────────────

function lancarRescisao(filial, empId) {
  // Dupla verificação — impede relançamento mesmo via console
  const jaExiste = getDespesasExtras(filial).some(
    d => d.tipo === 'rescisao' && String(d.empId) === String(empId)
  );
  if (jaExiste) { showToast('⚠️ Rescisão já lançada este mês!', 'orange'); return; }

  const emp = getEmployees(filial).find(e => e.id === empId);
  const val = parseFloat(document.getElementById('rescisao_val').value) || 0;
  const obs = document.getElementById('rescisao_obs').value.trim();
  if (!val) { showToast('⚠️ Informe o valor da rescisão', 'orange'); return; }

  var dataR = document.getElementById('rescisao_data');
  addDespesaExtra(filial, {
    tipo: 'rescisao',
    empId: empId,
    empNome: emp ? emp.nome : '',
    descricao: obs || 'Rescisão de contrato',
    valor: val,
    dataLancamento: dataR ? dataR.value : new Date().toISOString().slice(0,10)
  });
  saveState();
  scheduleSheetsSync();
  navDespesas(null, null, null);
  showToast('✅ Rescisão lançada!');
  renderApp();
}

function lancarNovaDespesa() {
  const filial = document.getElementById('nd_filial').value;
  const desc   = document.getElementById('nd_desc').value.trim();
  const val    = parseFloat(document.getElementById('nd_val').value) || 0;
  if (!desc)   { showToast('⚠️ Selecione a categoria', 'orange'); return; }
  if (!val)    { showToast('⚠️ Informe o valor', 'orange'); return; }

  var dataN = document.getElementById('nd_data');
  addDespesaExtra(filial, {
    tipo: 'despesa',
    descricao: desc,
    valor: val,
    dataLancamento: dataN ? dataN.value : new Date().toISOString().slice(0,10)
  });
  saveState();
  scheduleSheetsSync();
  navDespesas(null, null, null);
  showToast('✅ Despesa lançada!');
  renderApp();
}

function removerDespesa(filial, id) {
  removeDespesaExtra(filial, id);
  saveState();
  scheduleSheetsSync();
  showToast('🗑️ Removido', 'orange');
  renderApp();
}

// ── NAVEGAÇÃO INTERNA ─────────────────────────

function navDespesas(mode, filial, emp) {
  State.despesasMode   = mode;
  State.despesasFilial = filial;
  State.despesasEmp    = emp;
  renderApp();
}