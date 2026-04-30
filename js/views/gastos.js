/* ═══════════════════════════════════════════════
   views/gastos.js — Lançamentos (3 níveis)
   ═══════════════════════════════════════════════ */

function renderGastos() {
  if (State.gastoEmp && State.gastoFilial) return renderLancamentoEmp();
  if (State.gastoFilial)                   return renderGastosFilial();
  return renderGastosFiliais();
}

// ── NÍVEL 1: Lista de filiais ─────────────────

function renderGastosFiliais() {
  const rows = FILIAIS.map(f => {
    const md    = getMonthData(f);
    const custo = filialCostReal(f);
    const sal   = (md.receita || 0) - custo;
    const cnt   = getActiveEmployees(f).length;
    return `
      <div class="filial-row" onclick="goGastoFilial('${f}')">
        <div class="f-badge">${f}</div>
        <div class="f-info">
          <div class="f-name">Filial ${f}</div>
          <div class="f-meta">${cnt} funcionário${cnt !== 1 ? 's' : ''}</div>
          <div class="f-inlines">
            <span class="f-inline" style="color:var(--green)">↑ ${fmtk(md.receita || 0)}</span>
            <span class="f-inline" style="color:var(--red)">↓ ${fmtk(custo)}</span>
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

  return `
    <div class="sec-head">
      <div class="sec-title">📋 Lançamentos</div>
      <div style="font-size:11px;color:var(--text2)">${MONTHS[State.month]} ${State.year}</div>
    </div>
    ${rows}`;
}

// ── NÍVEL 2: Funcionários da filial ───────────

function renderGastosFilial() {
  const f   = State.gastoFilial;
  const cnt = getActiveEmployees(f).length;
  const k   = curKey();

  const empRows = cnt === 0
    ? `<div class="empty"><div class="empty-ico">👤</div>
       <div class="empty-msg">Nenhum funcionário nesta filial.</div></div>`
    : getActiveEmployees(f).map(e => {
        const lk       = State.db[k]?.[f]?.lancamentos?.[String(e.id)];
        const saved    = lk && lk.saved;
        const aPagar   = saved ? (lk.aPagar || 0) : 0;
        const faltas   = lk ? (lk.hasFaltas ? lk.faltas || 0 : 0) : 0;

        return `
        <div class="emp-row" onclick="goGastoEmp(${e.id})">
          <div class="emp-av">${initials(e.nome)}</div>
          <div class="emp-info">
            <div class="emp-name">${e.nome}</div>
            <div class="emp-role">${e.cargo} · ${e.escala}</div>
            <div class="emp-tags">
              ${e.hb && e.vt ? '<span class="tag tag-vt">VT</span>' : ''}
              ${e.hb && e.vr ? '<span class="tag tag-vr">VR</span>' : ''}
              ${faltas > 0 ? `<span class="tag" style="background:var(--red2);color:var(--red);border-color:rgba(244,63,94,0.3)">${faltas} falta${faltas > 1 ? 's' : ''}</span>` : ''}
              ${saved ? '<span class="tag" style="background:var(--green2);color:var(--green);border-color:rgba(16,217,160,0.3)">✓ Salvo</span>' : ''}
            </div>
          </div>
          <div class="emp-cost">
            <div class="emp-total" style="color:${saved ? 'var(--green)' : 'var(--red)'}">
              ${saved ? fmtk(aPagar) : fmtk(empCost(e))}
            </div>
            <div class="emp-sal-label">${saved ? 'a pagar' : 'estimado'}</div>
          </div>
          <div class="f-chevron">›</div>
        </div>`;
      }).join('');

  return `
    <div class="back-hd">
      <div class="back-btn" onclick="goGastoFilial(null)">‹</div>
      <div>
        <div class="back-title">Filial ${f}</div>
        <div class="back-sub">${cnt} funcionário${cnt !== 1 ? 's' : ''} · ${MONTHS[State.month]}</div>
      </div>
    </div>
    ${empRows}`;
}

// ── NÍVEL 3: Lançamento individual ───────────

function renderLancamentoEmp() {
  const f   = State.gastoFilial;
  const emp = getActiveEmployees(f).find(e => e.id === State.gastoEmp);
  if (!emp) return `<div class="empty"><div class="empty-ico">⚠️</div>
    <div class="empty-msg">Funcionário não encontrado.</div></div>`;

  const lanc   = getLancamento(f, emp.id);
  const faltas = lanc.hasFaltas ? (lanc.faltas || 0) : 0;
  const bonif  = lanc.hasBonif  ? (lanc.bonif  || 0) : 0;

  // Mês de referência = mês anterior
  const ref      = refMonth();
  const folgas   = folgasNoMes(emp.escala, ref.month, ref.year);
  const diasMes  = new Date(ref.year, ref.month + 1, 0).getDate();
  const diasTrab = diasMes - folgas;

  // Valores por dia
  const vDia    = diaUtil(emp);
  const vDiaVT  = diaVT(emp);
  const vDiaVR  = diaVR(emp);
  const vDiaTot = vDia + vDiaVT + vDiaVR;

  // VT e VR mensais (por dias trabalhados do mês de ref)
  const vtTotal   = vtMensal(emp, ref.month, ref.year);
  const vrTotal   = vrMensal(emp, ref.month, ref.year);
  const extrasVal = (emp.extras || []).length * 150;

  // Vale 40%
  const vale = emp.salario * 0.40;

  // Descontos por faltas
  const descSal = vDia   * faltas;
  const descVT  = vDiaVT * faltas;
  const descVR  = vDiaVR * faltas;
  const descTot = descSal + descVT + descVR;

  // Líquidos
  const salLiq     = Math.max(0, emp.salario - descSal);
  const vtLiq      = Math.max(0, vtTotal - descVT);
  const vrLiq      = Math.max(0, vrTotal - descVR);
  const custoTotal = salLiq + vtLiq + vrLiq + extrasVal;
  const benPagos   = vtLiq + vrLiq;
  const aPagar     = Math.max(0, custoTotal - vale - benPagos + bonif);

  return `
    <div class="back-hd">
      <div class="back-btn" onclick="goGastoEmp(null)">‹</div>
      <div>
        <div class="back-title">${emp.nome}</div>
        <div class="back-sub">${emp.cargo} · Filial ${f}</div>
      </div>
      ${lanc.saved ? `
      <span style="font-size:10px;background:var(--green2);color:var(--green);
        border:1px solid rgba(16,217,160,0.2);padding:3px 10px;border-radius:20px;
        margin-left:auto;font-weight:600;white-space:nowrap;flex-shrink:0">
        ✓ ${fmt(lanc.aPagar)}
      </span>` : ''}
    </div>

    <div style="background:var(--navy3);border:1px solid var(--border2);border-radius:10px;
                padding:10px 14px;margin-bottom:12px;
                display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:11px;color:var(--text2)">📅 Referência do lançamento</span>
      <span style="font-size:12px;font-weight:700;color:var(--orange)">
        ${MONTHS[ref.month]} ${ref.year}
      </span>
    </div>

    <div class="grid2" style="margin-bottom:10px">
      <div class="mini-card">
        <div class="mini-label">📅 Escala</div>
        <div class="mini-value" style="font-size:20px;color:var(--blue)">${emp.escala}</div>
        <div class="mini-change" style="color:var(--text2)">${diasTrab} dias trabalhados</div>
      </div>
      <div class="mini-card">
        <div class="mini-label">🌴 Folgas no mês</div>
        <div class="mini-value" style="font-size:20px;color:var(--green)">${folgas}</div>
        <div class="mini-change" style="color:var(--text2)">de ${diasMes} dias</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:10px">
      <div class="card-title" style="margin-bottom:12px">💡 Valor por dia (base 26 dias)</div>
      <div class="lancamento-row">
        <span class="lanc-label">Salário / dia</span>
        <span class="lanc-val">${fmt(vDia)}</span>
      </div>
      <div class="lancamento-row">
        <span class="lanc-label">🚌 VT / dia</span>
        <span class="lanc-val" style="color:${vDiaVT > 0 ? 'var(--text)' : 'var(--text3)'}">
          ${vDiaVT > 0 ? fmt(vDiaVT) : '—'}
        </span>
      </div>
      <div class="lancamento-row">
        <span class="lanc-label">🍽️ VR / dia</span>
        <span class="lanc-val" style="color:${vDiaVR > 0 ? 'var(--text)' : 'var(--text3)'}">
          ${vDiaVR > 0 ? fmt(vDiaVR) : '—'}
        </span>
      </div>
      <div class="lancamento-row" style="border-top:1px solid var(--border);margin-top:4px;padding-top:10px">
        <span class="lanc-label" style="font-weight:700;color:var(--text)">Custo total / dia</span>
        <span class="lanc-val" style="color:var(--orange);font-size:15px">${fmt(vDiaTot)}</span>
      </div>
    </div>

    <div class="card" style="margin-bottom:10px">
      <div class="card-title" style="margin-bottom:12px">⚠️ Faltas no mês</div>
      <div class="tgl-row" style="border:none;padding:0">
        <div class="tgl-info">
          <div class="tgl-name">Houve faltas?</div>
          <div class="tgl-desc">Ativa o desconto automático</div>
        </div>
        <div class="tgl ${lanc.hasFaltas ? 'on' : ''}" id="tgl_faltas"
             onclick="toggleFaltas('${f}', ${emp.id})">
          <div class="tgl-k" style="transform:${lanc.hasFaltas ? 'translateX(19px)' : ''}"></div>
        </div>
      </div>
      <div style="display:${lanc.hasFaltas ? 'block' : 'none'}">
        <div style="margin-top:14px">
          <label class="form-label">Quantidade de faltas</label>
          <input class="form-input" type="number" id="qtd_faltas"
                 value="${faltas}" min="0" max="${diasTrab}" placeholder="0"
                 oninput="atualizarFaltasInput('${f}', ${emp.id}, this.value)">
        </div>
        <div id="desconto_box" style="display:${faltas > 0 ? 'block' : 'none'}">
          ${faltas > 0 ? `
          <div style="background:var(--red2);border:1px solid rgba(244,63,94,0.2);
                      border-radius:12px;padding:14px;margin-top:12px">
            <div class="card-title" style="color:var(--red);margin-bottom:10px">
              🔻 Desconto por ${faltas} falta${faltas !== 1 ? 's' : ''}
            </div>
            <div class="lancamento-row">
              <span class="lanc-label">Salário descontado</span>
              <span class="lanc-val" style="color:var(--red)">- ${fmt(descSal)}</span>
            </div>
            <div class="lancamento-row">
              <span class="lanc-label">VT descontado</span>
              <span class="lanc-val" style="color:${descVT > 0 ? 'var(--red)' : 'var(--text3)'}">
                ${descVT > 0 ? '- ' + fmt(descVT) : '—'}
              </span>
            </div>
            <div class="lancamento-row">
              <span class="lanc-label">VR descontado</span>
              <span class="lanc-val" style="color:${descVR > 0 ? 'var(--red)' : 'var(--text3)'}">
                ${descVR > 0 ? '- ' + fmt(descVR) : '—'}
              </span>
            </div>
            <div class="lancamento-row" style="border-top:1px solid rgba(244,63,94,0.2);
                                               margin-top:6px;padding-top:10px">
              <span class="lanc-label" style="font-weight:700;color:var(--red)">Total descontado</span>
              <span class="lanc-val" style="color:var(--red);font-size:15px">- ${fmt(descTot)}</span>
            </div>
          </div>` : ''}
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:10px">
      <div class="card-title" style="margin-bottom:12px">📊 Resumo do Mês</div>
      <div class="lancamento-row">
        <span class="lanc-label">Salário bruto</span>
        <span class="lanc-val">${fmt(emp.salario)}</span>
      </div>
      ${emp.hb && emp.vt ? `
      <div class="lancamento-row">
        <span class="lanc-label">🚌 Vale Transporte</span>
        <span class="lanc-val">${fmt(vtTotal)}
          <span style="font-size:9px;color:var(--text3)">(${fmt(vDiaVT)}/dia × ${diasTrab}d)</span>
        </span>
      </div>` : ''}
      ${emp.hb && emp.vr ? `
      <div class="lancamento-row">
        <span class="lanc-label">🍽️ Vale Refeição</span>
        <span class="lanc-val">${fmt(vrTotal)}
          <span style="font-size:9px;color:var(--text3)">(${fmt(vDiaVR)}/dia × ${diasTrab}d)</span>
        </span>
      </div>` : ''}
      ${extrasVal > 0 ? `
      <div class="lancamento-row">
        <span class="lanc-label">⭐ Outros benefícios</span>
        <span class="lanc-val">${fmt(extrasVal)}</span>
      </div>` : ''}
      ${descTot > 0 ? `
      <div class="lancamento-row">
        <span class="lanc-label" style="color:var(--red)">⚠️ Desconto faltas (${faltas}x)</span>
        <span class="lanc-val" style="color:var(--red)">- ${fmt(descTot)}</span>
      </div>` : ''}
      <div class="lancamento-row" style="border-top:1px solid var(--border);
                                         margin-top:6px;padding-top:12px">
        <span class="lanc-label" style="font-weight:700;color:var(--text)">
          💼 Custo total ao empregador
        </span>
        <span class="lanc-val" style="color:var(--text);font-size:15px;font-weight:800"
              id="custo_total_val">
          ${fmt(custoTotal)}
        </span>
      </div>
    </div>

    <div class="card" style="margin-bottom:10px;border-color:rgba(249,115,22,0.2)">
      <div class="card-title" style="margin-bottom:12px">💵 Vale e Fechamento</div>
      <div class="lancamento-row">
        <span class="lanc-label">💼 Custo total</span>
        <span class="lanc-val">${fmt(custoTotal)}</span>
      </div>
      <div class="lancamento-row">
        <span class="lanc-label" style="color:var(--orange)">
          💵 Vale adiantado
          <span style="font-size:10px;background:var(--orange-glow);padding:2px 6px;
                       border-radius:10px;border:1px solid rgba(249,115,22,0.3)">40%</span>
        </span>
        <span class="lanc-val" style="color:var(--orange)">- ${fmt(vale)}</span>
      </div>
      <div class="lancamento-row">
        <span class="lanc-label" style="color:var(--blue)">
          🏦 Benefícios pagos no início do mês
          <span style="font-size:9px;color:var(--text3);display:block;margin-top:2px">
            VT + VR pagos antecipadamente
          </span>
        </span>
        <span class="lanc-val" style="color:var(--blue)">- ${fmt(benPagos)}</span>
      </div>
      ${bonif > 0 ? `
      <div class="lancamento-row">
        <span class="lanc-label" style="color:var(--green)">🏆 Bonificação por metas</span>
        <span class="lanc-val" style="color:var(--green)">+ ${fmt(bonif)}</span>
      </div>` : ''}
      <div class="lancamento-row"
           style="border-top:2px solid rgba(249,115,22,0.25);margin-top:6px;padding-top:14px">
        <span class="lanc-label" style="font-weight:700;color:var(--text);font-size:14px">
          ✅ A pagar no fechamento
        </span>
        <span class="lanc-val" style="color:var(--green);font-size:18px;font-weight:800"
              id="aPagar_val">
          ${fmt(aPagar)}
        </span>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;border-color:rgba(16,217,160,0.15)">
      <div class="card-title" style="margin-bottom:12px">🏆 Bonificação por Metas</div>
      <div class="tgl-row" style="border:none;padding:0">
        <div class="tgl-info">
          <div class="tgl-name">Meta batida este mês?</div>
          <div class="tgl-desc">Adiciona bonificação ao fechamento</div>
        </div>
        <div class="tgl ${lanc.hasBonif ? 'on' : ''}" id="tgl_bonif"
             onclick="toggleBonif('${f}', ${emp.id})">
          <div class="tgl-k" style="transform:${lanc.hasBonif ? 'translateX(19px)' : ''}"></div>
        </div>
      </div>
      <div style="display:${lanc.hasBonif ? 'block' : 'none'}">
        <div style="margin-top:14px">
          <label class="form-label">Valor da bonificação</label>
          <div class="input-prefix">
            <span class="prefix-sym">R$</span>
            <input class="form-input" type="number" id="val_bonif"
                   value="${bonif || ''}" placeholder="0,00"
                   oninput="atualizarBonifInput('${f}', ${emp.id}, this.value)">
          </div>
        </div>
        <div id="bonif_badge" style="background:var(--green2);border:1px solid rgba(16,217,160,0.2);
                  border-radius:12px;padding:12px 14px;margin-top:10px;
                  justify-content:space-between;align-items:center;
                  display:${bonif > 0 ? 'flex' : 'none'}">
          <span style="font-size:12px;color:var(--green);font-weight:600">✅ Bônus aplicado</span>
          <span style="font-family:'JetBrains Mono',monospace;font-size:14px;
                       color:var(--green);font-weight:700">+ ${fmt(bonif)}</span>
        </div>
      </div>
    </div>

    <button class="btn btn-orange" onclick="salvarLancamento('${f}', ${emp.id})">
      💾 Salvar Lançamento
    </button>
  `;
}

// ── AÇÕES ─────────────────────────────────────

function toggleFaltas(filialCode, empId) {
  const lanc     = getLancamento(filialCode, empId);
  lanc.hasFaltas = !lanc.hasFaltas;
  if (!lanc.hasFaltas) lanc.faltas = 0;
  renderApp();
}

// Atualiza State e recalcula o display de desconto sem re-renderizar a página
function atualizarFaltasInput(filialCode, empId, valor) {
  const lanc  = getLancamento(filialCode, empId);
  lanc.faltas = Math.max(0, parseInt(valor) || 0);

  // Recalcula e atualiza só a caixa de desconto no DOM
  const emp = getActiveEmployees(filialCode).find(e => e.id === empId);
  if (!emp) return;

  const faltas  = lanc.faltas;
  const ref     = refMonth();
  const vDia    = diaUtil(emp);
  const vDiaVT  = diaVT(emp);
  const vDiaVR  = diaVR(emp);
  const descSal = vDia   * faltas;
  const descVT  = vDiaVT * faltas;
  const descVR  = vDiaVR * faltas;
  const descTot = descSal + descVT + descVR;

  const vtTotal    = vtMensal(emp, ref.month, ref.year);
  const vrTotal    = vrMensal(emp, ref.month, ref.year);
  const extrasVal  = (emp.extras || []).length * 150;
  const salLiq     = Math.max(0, emp.salario - descSal);
  const vtLiq      = Math.max(0, vtTotal - descVT);
  const vrLiq      = Math.max(0, vrTotal - descVR);
  const custoTotal = salLiq + vtLiq + vrLiq + extrasVal;
  const vale       = emp.salario * 0.40;
  const benPagos   = vtLiq + vrLiq;
  const bonif      = lanc.hasBonif ? (lanc.bonif || 0) : 0;
  const aPagar     = Math.max(0, custoTotal - vale - benPagos + bonif);

  // Atualiza caixa de desconto
  const boxEl = document.getElementById('desconto_box');
  if (boxEl) {
    if (faltas > 0) {
      boxEl.style.display = 'block';
      boxEl.innerHTML = `
        <div style="background:var(--red2);border:1px solid rgba(244,63,94,0.2);
                    border-radius:12px;padding:14px;margin-top:12px">
          <div class="card-title" style="color:var(--red);margin-bottom:10px">
            🔻 Desconto por ${faltas} falta${faltas !== 1 ? 's' : ''}
          </div>
          <div class="lancamento-row">
            <span class="lanc-label">Salário descontado</span>
            <span class="lanc-val" style="color:var(--red)">- ${fmt(descSal)}</span>
          </div>
          <div class="lancamento-row">
            <span class="lanc-label">VT descontado</span>
            <span class="lanc-val" style="color:${descVT > 0 ? 'var(--red)' : 'var(--text3)'}">
              ${descVT > 0 ? '- ' + fmt(descVT) : '—'}
            </span>
          </div>
          <div class="lancamento-row">
            <span class="lanc-label">VR descontado</span>
            <span class="lanc-val" style="color:${descVR > 0 ? 'var(--red)' : 'var(--text3)'}">
              ${descVR > 0 ? '- ' + fmt(descVR) : '—'}
            </span>
          </div>
          <div class="lancamento-row" style="border-top:1px solid rgba(244,63,94,0.2);
                                             margin-top:6px;padding-top:10px">
            <span class="lanc-label" style="font-weight:700;color:var(--red)">Total descontado</span>
            <span class="lanc-val" style="color:var(--red);font-size:15px">- ${fmt(descTot)}</span>
          </div>
        </div>`;
    } else {
      boxEl.style.display = 'none';
      boxEl.innerHTML = '';
    }
  }

  // Atualiza "A pagar no fechamento"
  const aPagarEl = document.getElementById('aPagar_val');
  if (aPagarEl) aPagarEl.textContent = fmt(aPagar);

  // Atualiza custo total ao empregador
  const custoEl = document.getElementById('custo_total_val');
  if (custoEl) custoEl.textContent = fmt(custoTotal);
}

function toggleBonif(filialCode, empId) {
  const lanc    = getLancamento(filialCode, empId);
  lanc.hasBonif = !lanc.hasBonif;
  if (!lanc.hasBonif) lanc.bonif = 0;
  renderApp();
}

function atualizarBonifInput(filialCode, empId, valor) {
  const lanc = getLancamento(filialCode, empId);
  lanc.bonif = Math.max(0, parseFloat(valor) || 0);
  // Se já havia lançamento salvo, invalida o cache para forçar recálculo
  if (lanc.saved) { lanc.saved = false; lanc.custoTotal = 0; lanc.aPagar = 0; }

  // Recalcula aPagar em tempo real e atualiza DOM
  const emp = getActiveEmployees(filialCode).find(e => e.id === empId);
  if (!emp) return;

  const ref        = refMonth();
  const faltas     = lanc.hasFaltas ? (lanc.faltas || 0) : 0;
  const bonif      = lanc.bonif;
  const vDia       = diaUtil(emp);
  const vDiaVT     = diaVT(emp);
  const vDiaVR     = diaVR(emp);
  const vtTotal    = vtMensal(emp, ref.month, ref.year);
  const vrTotal    = vrMensal(emp, ref.month, ref.year);
  const extrasVal  = (emp.extras || []).length * 150;
  const descSal    = vDia   * faltas;
  const descVT     = vDiaVT * faltas;
  const descVR     = vDiaVR * faltas;
  const salLiq     = Math.max(0, emp.salario - descSal);
  const vtLiq      = Math.max(0, vtTotal - descVT);
  const vrLiq      = Math.max(0, vrTotal - descVR);
  const custoTotal = salLiq + vtLiq + vrLiq + extrasVal;
  const vale       = emp.salario * 0.40;
  const benPagos   = vtLiq + vrLiq;
  const aPagar     = Math.max(0, custoTotal - vale - benPagos + bonif);

  const aPagarEl = document.getElementById('aPagar_val');
  if (aPagarEl) aPagarEl.textContent = fmt(aPagar);

  // Atualiza badge do bônus aplicado
  const bonifBadge = document.getElementById('bonif_badge');
  if (bonifBadge) {
    bonifBadge.style.display = bonif > 0 ? 'flex' : 'none';
    bonifBadge.querySelector('span:last-child').textContent = '+ ' + fmt(bonif);
  }
}

function salvarLancamento(filialCode, empId) {
  const emp = getActiveEmployees(filialCode).find(e => e.id === empId);
  if (!emp) return;

  const lanc   = getLancamento(filialCode, empId);
  const faltas = lanc.hasFaltas ? (lanc.faltas || 0) : 0;
  const bonif  = lanc.hasBonif  ? (lanc.bonif  || 0) : 0;
  const ref    = refMonth();

  const vDia    = diaUtil(emp);
  const vDiaVT  = diaVT(emp);
  const vDiaVR  = diaVR(emp);
  const vtTotal = vtMensal(emp, ref.month, ref.year);
  const vrTotal = vrMensal(emp, ref.month, ref.year);
  const extrasVal = (emp.extras || []).length * 150;

  const descSal    = vDia   * faltas;
  const descVT     = vDiaVT * faltas;
  const descVR     = vDiaVR * faltas;
  const salLiq     = Math.max(0, emp.salario - descSal);
  const vtLiq      = Math.max(0, vtTotal - descVT);
  const vrLiq      = Math.max(0, vrTotal - descVR);
  const custoTotal = salLiq + vtLiq + vrLiq + extrasVal;
  const vale       = emp.salario * 0.40;
  const benPagos   = vtLiq + vrLiq;
  const aPagar     = Math.max(0, custoTotal - vale - benPagos + bonif);

  // Persiste no State
  lanc.saved      = true;
  lanc.custoTotal = custoTotal;
  lanc.aPagar     = aPagar;
  lanc.savedAt    = new Date().toISOString().slice(0, 10);

  // Persiste no storage
  saveState();
  scheduleSheetsSync();

  renderApp();
  showToast('✅ Lançamento salvo!');
}

// ── NAVEGAÇÃO ─────────────────────────────────

function goGastoFilial(code) {
  State.gastoFilial = code;
  State.gastoEmp    = null;
  updateTopbarGastos();
  renderApp();
}

function goGastoEmp(empId) {
  State.gastoEmp = empId;
  updateTopbarGastos();
  renderApp();
}

function updateTopbarGastos() {
  const titleEl = document.getElementById('topbarTitle');
  const subEl   = document.getElementById('topbarSub');
  if (!titleEl) return;
  if (State.gastoEmp && State.gastoFilial) {
    const emp = getActiveEmployees(State.gastoFilial).find(e => e.id === State.gastoEmp);
    titleEl.textContent = emp ? emp.nome : 'Lançamento';
    subEl.textContent   = `Filial ${State.gastoFilial} · ${MONTHS[State.month]}`;
  } else if (State.gastoFilial) {
    titleEl.textContent = `Filial ${State.gastoFilial}`;
    subEl.textContent   = 'Funcionários · ' + MONTHS[State.month];
  } else {
    titleEl.textContent = 'Lançamentos';
    subEl.textContent   = 'Selecione uma filial';
  }
}