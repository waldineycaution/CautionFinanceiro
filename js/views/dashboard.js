/* ═══════════════════════════════════════════════
   views/dashboard.js
   ═══════════════════════════════════════════════ */

function renderDashboard() {
  if (State.dashEmp && State.dashFilial) return renderDashHolerite();
  if (State.dashFilial)                  return renderDashFilialEmps();
  return State.viewMode === 'anual' ? renderDashAnual() : renderDashMensal();
}

function navDash(filial, empId) {
  State.dashFilial = filial;
  State.dashEmp    = empId || null;
  renderApp();
}

// ══════════════════════════════════════════════
// MENSAL
// ══════════════════════════════════════════════

function renderDashMensal() {
  const rec       = totalRevenue();
  const gasTotal  = totalCostDash();          // folha + despesas (confirmado ou estimado)
  const folha     = gasTotal - totalDespesasExtras();
  const desp      = totalDespesasExtras();
  const sal       = rec - gasTotal;
  const func      = totalEmployees();
  const savedCt   = totalSaved();
  const anySaved  = hasAnySaved();
  const ativas    = FILIAIS.filter(f => getMonthData(f).receita > 0).length;
  const ref       = refMonth();
  const pGas      = pct(gasTotal, rec);
  const pSal      = pct(sal, rec);
  const pDesp     = pct(desp, rec);

  // Gráfico — só meses com dados reais
  const bars = MONTHS.map((m, i) => {
    const k = makeKey(i, State.year);
    const hasData = FILIAIS.some(f =>
      (State.db[k]?.[f]?.receita > 0) ||
      Object.values(State.db[k]?.[f]?.lancamentos || {}).some(lk => lk && lk.saved)
    );
    let g = 0;
    if (hasData) {
      FILIAIS.forEach(f => {
        getActiveEmployees(f).forEach(e => { g += empCostDash(f, e, i, State.year); });
        (State.db[k]?.[f]?.despesasExtras || []).forEach(d => { g += d.valor || 0; });
      });
    }
    return { label: m.slice(0, 3), value: g, isCurrent: i === State.month };
  });
  const maxBar = Math.max(...bars.map(b => b.value), 1);

  // Top filiais
  const filialRows = FILIAIS
    .filter(f => getMonthData(f).receita > 0 || getActiveEmployees(f).length > 0)
    .slice(0, 5)
    .map(f => {
      const r    = getMonthData(f).receita;
      const cnt  = getActiveEmployees(f).length;
      const g    = filialCostDash(f) + getDespesasExtras(f).reduce((s, d) => s + (d.valor || 0), 0);
      const p    = r ? Math.min((g / r) * 100, 100) : 0;
      const k    = curKey();
      const conf = getActiveEmployees(f).some(e => {
        const lk = State.db[k]?.[f]?.lancamentos?.[String(e.id)];
        return lk && lk.saved;
      });
      return `
        <div class="filial-row" onclick="navDash('${f}', null)">
          <div class="f-badge">${f}</div>
          <div class="f-info">
            <div class="f-name">Filial ${f}</div>
            <div class="f-meta">${cnt} func · Rec: ${fmtk(r)}</div>
            <div class="f-bar">
              <div class="f-bar-fill" style="width:${p}%;background:${progressColor(p)}"></div>
            </div>
          </div>
          <div class="f-right">
            <div class="f-amount" style="color:${conf ? 'var(--green)' : 'var(--orange)'}">
              ${fmtk(g)}
            </div>
            <div class="f-pct">${conf ? '✓ confirmado' : p.toFixed(0) + '% rec.'}</div>
          </div>
          <div class="f-chevron">›</div>
        </div>`;
    }).join('');

  return `
    <div class="view-toggle">
      <div class="vt-btn on" onclick="State.viewMode='mensal';renderApp()">Mensal</div>
      <div class="vt-btn"   onclick="State.viewMode='anual'; renderApp()">Anual</div>
    </div>

    <div class="hero-card">
      <div class="hero-label">💼 RECEITA TOTAL — ${MONTHS[State.month].toUpperCase()}</div>
      <div class="hero-amount">${fmt(rec)}</div>
      <div class="hero-sub">${func} colaboradores · ${ativas} filiais com receita</div>
      <div style="font-size:10px;color:var(--text2);margin-top:6px;position:relative;z-index:1">
        Ref. lançamentos: <strong style="color:var(--orange)">${MONTHS[ref.month]} ${ref.year}</strong>
        ${savedCt > 0
          ? `· <strong style="color:var(--green)">${savedCt} confirmado${savedCt > 1 ? 's' : ''}</strong>`
          : '· <span style="color:var(--text3)">Nenhum lançamento salvo</span>'}
      </div>
      <span class="badge ${sal >= 0 ? 'badge-green' : 'badge-red'}">
        ${sal >= 0 ? '▲' : '▼'} ${Math.abs(parseFloat(pSal))}% margem líquida
      </span>
    </div>

    <div class="grid2">
      <div class="mini-card">
        <div class="mini-label">💸 ${anySaved ? 'Folha Confirmada' : 'Folha Estimada'}</div>
        <div class="mini-value" style="color:${anySaved ? 'var(--orange)' : 'var(--text2)'}">
          ${fmtk(folha)}
        </div>
        <div class="mini-change" style="color:var(--text2)">
          ${pct(folha, rec)}% da receita${anySaved ? ' · confirmado' : ' · estimado'}
        </div>
      </div>
      <div class="mini-card">
        <div class="mini-label">✅ Saldo Final</div>
        <div class="mini-value" style="color:${sal >= 0 ? 'var(--green)' : 'var(--red)'}">
          ${fmtk(sal)}
        </div>
        <div class="mini-change" style="color:${sal >= 0 ? 'var(--green)' : 'var(--red)'}">
          ${sal >= 0 ? '▲' : '▼'} ${Math.abs(parseFloat(pSal))}% margem
        </div>
      </div>
    </div>

    <!-- Card despesas extras -->
    <div class="card" style="margin-bottom:10px;${desp > 0 ? 'border-color:rgba(167,139,250,0.25)' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:${desp > 0 ? '12px' : '0'}">
        <div class="card-title">💸 Despesas Extras</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;
                    color:${desp > 0 ? 'var(--purple)' : 'var(--text3)'}">
          ${desp > 0 ? fmt(desp) : 'Nenhuma'}
        </div>
      </div>
      ${desp > 0 ? `
      <div class="lancamento-row" style="padding:6px 0">
        <span class="lanc-label">Folha de pagamento</span>
        <span class="lanc-val">${fmt(folha)}</span>
      </div>
      <div class="lancamento-row" style="padding:6px 0">
        <span class="lanc-label" style="color:var(--purple)">Despesas extras</span>
        <span class="lanc-val" style="color:var(--purple)">+ ${fmt(desp)}</span>
      </div>
      <div class="lancamento-row" style="padding:8px 0;border-top:1px solid var(--border);margin-top:4px">
        <span class="lanc-label" style="font-weight:700">Total de saídas</span>
        <span class="lanc-val" style="color:var(--red);font-size:14px;font-weight:800">${fmt(gasTotal)}</span>
      </div>
      <div class="lancamento-row" style="padding:6px 0;border-top:1px solid var(--border);margin-top:2px">
        <span class="lanc-label" style="font-weight:700">Sobra da receita</span>
        <span class="lanc-val" style="color:${sal >= 0 ? 'var(--green)' : 'var(--red)'};font-size:14px;font-weight:800">${fmt(sal)}</span>
      </div>` : ''}
    </div>

    <div class="metric-row">
      <div class="metric-pill">
        <div class="metric-big" style="color:${parseFloat(pGas) > 40 ? 'var(--red)' : 'var(--orange)'}">
          ${pGas}%
        </div>
        <div class="metric-tiny">total saídas/rec.</div>
      </div>
      <div class="metric-pill">
        <div class="metric-big" style="color:${parseFloat(pSal) >= 0 ? 'var(--green)' : 'var(--red)'}">
          ${pSal}%
        </div>
        <div class="metric-tiny">margem líquida</div>
      </div>
      <div class="metric-pill">
        <div class="metric-big" style="color:var(--purple)">${pDesp}%</div>
        <div class="metric-tiny">desp./receita</div>
      </div>
    </div>

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="card-title">📈 Saídas Mensais ${State.year}</div>
      </div>
      <div class="bar-chart">
        ${bars.map(b => `
          <div class="bar-col">
            <div class="bar-fill" style="height:${b.value > 0 ? Math.max(4, (b.value / maxBar) * 60) : 0}px;
                 background:${b.isCurrent ? 'var(--orange)' : 'var(--blue)'}; opacity:${b.isCurrent ? 1 : 0.5}">
            </div>
            <div class="bar-lbl">${b.label}</div>
          </div>`).join('')}
      </div>
    </div>

    <div class="sec-head">
      <div class="sec-title">🏪 Top Filiais</div>
      <div class="sec-link" onclick="navigate('filiais')">Gerenciar →</div>
    </div>
    ${filialRows || '<div class="empty"><div class="empty-ico">🏪</div><div class="empty-msg">Cadastre funcionários e lance receitas para ver os dados aqui.</div></div>'}
  `;
}

// ══════════════════════════════════════════════
// DRILL-DOWN: Funcionários da filial
// ══════════════════════════════════════════════

function renderDashFilialEmps() {
  const f      = State.dashFilial;
  const emps   = getActiveEmployees(f);
  const k      = curKey();
  const rec    = getMonthData(f).receita;
  const despesas   = getDespesasExtras(f);
  const totalDesp  = despesas.reduce((s, d) => s + (d.valor || 0), 0);
  const totalFolha = emps.reduce((s, e) => s + empCostDash(f, e), 0);
  const grandTotal = totalFolha + totalDesp;
  const saldo      = rec - grandTotal;

  const empRows = emps.length === 0
    ? `<div class="empty"><div class="empty-ico">👤</div>
       <div class="empty-msg">Nenhum funcionário ativo nesta filial.</div></div>`
    : emps.map(e => {
        const lk   = State.db[k]?.[f]?.lancamentos?.[String(e.id)];
        const saved = lk && lk.saved;
        const custo = empCostDash(f, e);
        return `
        <div class="emp-row" onclick="navDash('${f}', ${e.id})">
          <div class="emp-av">${initials(e.nome)}</div>
          <div class="emp-info">
            <div class="emp-name">${e.nome}</div>
            <div class="emp-role">${e.cargo} · ${e.escala}</div>
            <div class="emp-tags">
              ${e.hb && e.vt ? '<span class="tag tag-vt">VT</span>' : ''}
              ${e.hb && e.vr ? '<span class="tag tag-vr">VR</span>' : ''}
              ${saved
                ? '<span class="tag" style="background:var(--green2);color:var(--green);border-color:rgba(16,217,160,0.3)">✓ Confirmado</span>'
                : '<span class="tag" style="background:var(--orange-glow);color:var(--orange);border-color:rgba(249,115,22,0.3)">Estimado</span>'}
            </div>
          </div>
          <div class="emp-cost">
            <div class="emp-total" style="color:${saved ? 'var(--green)' : 'var(--orange)'}">
              ${fmtk(custo)}
            </div>
            <div class="emp-sal-label">${saved ? 'confirmado' : 'estimado'}</div>
          </div>
          <div class="f-chevron">›</div>
        </div>`;
      }).join('');

  const despRow = despesas.length > 0 ? `
    <div class="sec-head" style="margin-top:16px">
      <div class="sec-title" style="font-size:13px">💸 Despesas Extras</div>
      <div style="font-size:11px;color:var(--purple);font-family:'JetBrains Mono',monospace">${fmt(totalDesp)}</div>
    </div>
    ${despesas.map(d => `
    <div class="gasto-row">
      <div class="g-filial" style="font-size:14px">${d.tipo === 'rescisao' ? '📄' : '💸'}</div>
      <div class="g-info">
        <div class="g-name">${d.descricao}</div>
        <div class="g-det">${d.empNome ? d.empNome + ' · ' : ''}${formatDate(d.dataLancamento || d.criadoEm)}</div>
      </div>
      <div class="g-val" style="color:var(--purple)">${fmt(d.valor)}</div>
    </div>`).join('')}` : '';

  return `
    <div class="back-hd">
      <div class="back-btn" onclick="navDash(null,null)">‹</div>
      <div>
        <div class="back-title">Filial ${f}</div>
        <div class="back-sub">${MONTHS[State.month]} ${State.year}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
      <div class="mini-card">
        <div class="mini-label">📥 Receita</div>
        <div class="mini-value" style="color:var(--green);font-size:14px">${fmt(rec)}</div>
      </div>
      <div class="mini-card">
        <div class="mini-label">💸 Saídas</div>
        <div class="mini-value" style="color:var(--red);font-size:14px">${fmt(grandTotal)}</div>
      </div>
      <div class="mini-card">
        <div class="mini-label">✅ Sobra</div>
        <div class="mini-value" style="color:${saldo >= 0 ? 'var(--green)' : 'var(--red)'};font-size:14px">${fmt(saldo)}</div>
      </div>
    </div>
    <div class="sec-head">
      <div class="sec-title">👥 Funcionários</div>
      <div style="font-size:11px;color:var(--text2)">Clique para o holerite</div>
    </div>
    ${empRows}
    ${despRow}
  `;
}

// ══════════════════════════════════════════════
// HOLERITE
// ══════════════════════════════════════════════

function renderDashHolerite() {
  const f   = State.dashFilial;
  const emp = getActiveEmployees(f).find(e => e.id === State.dashEmp);
  if (!emp) return `<div class="empty"><div class="empty-ico">⚠️</div><div class="empty-msg">Funcionário não encontrado.</div></div>`;

  const k     = curKey();
  const ref   = refMonth();
  const lk    = State.db[k]?.[f]?.lancamentos?.[String(emp.id)];
  const saved = lk && lk.saved;

  const folgas   = folgasNoMes(emp.escala, ref.month, ref.year);
  const diasMes  = new Date(ref.year, ref.month + 1, 0).getDate();
  const diasTrab = diasMes - folgas;

  const vtTotal   = vtMensal(emp, ref.month, ref.year);
  const vrTotal   = vrMensal(emp, ref.month, ref.year);
  const extrasVal = (emp.extras || []).length * 150;
  const custoContrato = emp.salario + vtTotal + vrTotal + extrasVal;

  const faltas   = lk ? (lk.hasFaltas ? lk.faltas || 0 : 0) : 0;
  const bonif    = lk ? (lk.hasBonif  ? lk.bonif  || 0 : 0) : 0;
  const vDia     = diaUtil(emp);
  const vDiaVT   = diaVT(emp);
  const vDiaVR   = diaVR(emp);
  const descTot  = (vDia + vDiaVT + vDiaVR) * faltas;
  const vale     = emp.salario * 0.40;
  const vtLiq    = Math.max(0, vtTotal - vDiaVT * faltas);
  const vrLiq    = Math.max(0, vrTotal - vDiaVR * faltas);
  const benPagos = vtLiq + vrLiq;
  const aPagar   = saved ? (lk.aPagar || 0) : 0;

  const hoje   = new Date();
  const dataStr = `${String(hoje.getDate()).padStart(2,'0')}/${String(hoje.getMonth()+1).padStart(2,'0')}/${hoje.getFullYear()}`;

  return `
    <div class="back-hd">
      <div class="back-btn" onclick="navDash('${f}', null)">‹</div>
      <div><div class="back-title">${emp.nome}</div><div class="back-sub">${emp.cargo} · Filial ${f}</div></div>
    </div>

    <div style="background:linear-gradient(135deg,#0E2448,#142E5A);border:1px solid rgba(96,165,250,0.15);
                border-radius:16px;padding:18px;margin-bottom:12px">
      <div style="font-size:9px;color:var(--text2);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">
        🧾 Holerite · Ref. ${MONTHS[ref.month]} ${ref.year} · Emitido em ${dataStr}
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:46px;height:46px;border-radius:50%;background:var(--navy3);border:2px solid var(--border2);
                    display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:var(--orange)">
          ${initials(emp.nome)}
        </div>
        <div>
          <div style="font-size:16px;font-weight:700">${emp.nome}</div>
          <div style="font-size:11px;color:var(--text2);margin-top:2px">
            ${emp.cargo} · Escala ${emp.escala} · ${diasTrab} dias trabalhados
          </div>
        </div>
      </div>
      <div style="margin-top:12px">
        ${saved
          ? '<span class="badge badge-green" style="margin:0">✓ Lançamento confirmado</span>'
          : '<span class="badge badge-orange" style="margin:0">⚠️ Sem lançamento salvo</span>'}
      </div>
    </div>

    <div class="card" style="margin-bottom:10px">
      <div class="card-title" style="margin-bottom:12px">📋 Composição Salarial</div>
      <div class="lancamento-row">
        <span class="lanc-label">💼 Salário base</span>
        <span class="lanc-val">${fmt(emp.salario)}</span>
      </div>
      ${emp.hb && emp.vt ? `<div class="lancamento-row">
        <span class="lanc-label">🚌 Vale Transporte <span style="font-size:9px;color:var(--text3)">${fmt(vDiaVT)}/dia × ${diasTrab}d</span></span>
        <span class="lanc-val">${fmt(vtTotal)}</span>
      </div>` : ''}
      ${emp.hb && emp.vr ? `<div class="lancamento-row">
        <span class="lanc-label">🍽️ Vale Refeição <span style="font-size:9px;color:var(--text3)">${fmt(vDiaVR)}/dia × ${diasTrab}d</span></span>
        <span class="lanc-val">${fmt(vrTotal)}</span>
      </div>` : ''}
      ${(emp.extras || []).map(x => `<div class="lancamento-row">
        <span class="lanc-label">⭐ ${x}</span><span class="lanc-val">${fmt(150)}</span>
      </div>`).join('')}
      <div class="lancamento-row" style="border-top:1px solid var(--border);margin-top:4px;padding-top:10px">
        <span class="lanc-label" style="font-weight:700">Custo contratual total</span>
        <span class="lanc-val" style="font-size:15px;font-weight:800">${fmt(custoContrato)}</span>
      </div>
    </div>

    ${faltas > 0 ? `
    <div class="card" style="margin-bottom:10px;border-color:rgba(244,63,94,0.2)">
      <div class="card-title" style="margin-bottom:12px;color:var(--red)">🔻 Descontos — ${faltas} falta${faltas !== 1 ? 's' : ''}</div>
      <div class="lancamento-row"><span class="lanc-label">Salário descontado</span><span class="lanc-val" style="color:var(--red)">- ${fmt(vDia * faltas)}</span></div>
      ${vDiaVT > 0 ? `<div class="lancamento-row"><span class="lanc-label">VT descontado</span><span class="lanc-val" style="color:var(--red)">- ${fmt(vDiaVT * faltas)}</span></div>` : ''}
      ${vDiaVR > 0 ? `<div class="lancamento-row"><span class="lanc-label">VR descontado</span><span class="lanc-val" style="color:var(--red)">- ${fmt(vDiaVR * faltas)}</span></div>` : ''}
      <div class="lancamento-row" style="border-top:1px solid rgba(244,63,94,0.2);margin-top:4px;padding-top:10px">
        <span class="lanc-label" style="font-weight:700;color:var(--red)">Total descontado</span>
        <span class="lanc-val" style="color:var(--red);font-size:15px">- ${fmt(descTot)}</span>
      </div>
    </div>` : ''}

    <div class="card" style="margin-bottom:16px;border-color:rgba(249,115,22,0.25)">
      <div class="card-title" style="margin-bottom:12px">💵 Fechamento do Funcionário</div>
      <div class="lancamento-row"><span class="lanc-label">Custo contratual</span><span class="lanc-val">${fmt(custoContrato)}</span></div>
      ${faltas > 0 ? `<div class="lancamento-row"><span class="lanc-label" style="color:var(--red)">Desconto faltas</span><span class="lanc-val" style="color:var(--red)">- ${fmt(descTot)}</span></div>` : ''}
      <div class="lancamento-row"><span class="lanc-label" style="color:var(--orange)">Vale adiantado (40%)</span><span class="lanc-val" style="color:var(--orange)">- ${fmt(vale)}</span></div>
      <div class="lancamento-row"><span class="lanc-label" style="color:var(--blue)">Benefícios pagos antecipadamente</span><span class="lanc-val" style="color:var(--blue)">- ${fmt(benPagos)}</span></div>
      ${bonif > 0 ? `<div class="lancamento-row"><span class="lanc-label" style="color:var(--green)">🏆 Bonificação</span><span class="lanc-val" style="color:var(--green)">+ ${fmt(bonif)}</span></div>` : ''}
      <div class="lancamento-row" style="border-top:2px solid rgba(249,115,22,0.3);margin-top:8px;padding-top:14px">
        <span class="lanc-label" style="font-weight:700;font-size:14px">✅ A Pagar no Fechamento</span>
        <span class="lanc-val" style="font-size:20px;font-weight:800;color:${saved ? 'var(--green)' : 'var(--text2)'}">
          ${saved ? fmt(aPagar) : '—'}
        </span>
      </div>
      ${!saved ? '<div style="font-size:11px;color:var(--text3);margin-top:8px;text-align:center">Acesse Lançamentos para confirmar</div>' : ''}
    </div>
  `;
}

// ══════════════════════════════════════════════
// ANUAL
// ══════════════════════════════════════════════

function renderDashAnual() {
  const year = State.year;
  let recAnual = 0, gasAnual = 0, savedAnual = 0;

  const meses = MONTHS.map((m, i) => {
    const k = makeKey(i, year);
    let recMes = 0, gasMes = 0, hasSaved = false;
    FILIAIS.forEach(f => {
      recMes += State.db[k]?.[f]?.receita || 0;
      getActiveEmployees(f).forEach(e => {
        const lk = State.db[k]?.[f]?.lancamentos?.[String(e.id)];
        gasMes += empCostDash(f, e, i, year);
        if (lk && lk.saved) hasSaved = true;
      });
      (State.db[k]?.[f]?.despesasExtras || []).forEach(d => { gasMes += d.valor || 0; });
    });
    // Só conta meses com dados reais
    const hasData = FILIAIS.some(f =>
      (State.db[k]?.[f]?.receita > 0) ||
      Object.values(State.db[k]?.[f]?.lancamentos || {}).some(lk => lk && lk.saved)
    );
    if (!hasData) gasMes = 0;
    recAnual += recMes; gasAnual += gasMes;
    if (hasSaved) savedAnual++;
    return { label: m.slice(0, 3), i, recMes, gasMes, saldo: recMes - gasMes, hasSaved };
  });

  const saldoAnual = recAnual - gasAnual;
  const pGasAnual  = pct(gasAnual, recAnual);
  const pSalAnual  = pct(saldoAnual, recAnual);
  const maxMes     = Math.max(...meses.map(m => Math.max(m.recMes, m.gasMes)), 1);

  const filialAnual = FILIAIS.map(f => {
    let recF = 0, gasF = 0;
    MONTHS.forEach((_, i) => {
      const k = makeKey(i, year);
      recF += State.db[k]?.[f]?.receita || 0;
      const hasData = (State.db[k]?.[f]?.receita > 0) ||
        Object.values(State.db[k]?.[f]?.lancamentos || {}).some(lk => lk && lk.saved);
      if (hasData) {
        getActiveEmployees(f).forEach(e => { gasF += empCostDash(f, e, i, year); });
        (State.db[k]?.[f]?.despesasExtras || []).forEach(d => { gasF += d.valor || 0; });
      }
    });
    return { f, recF, gasF, saldo: recF - gasF };
  }).filter(x => x.recF > 0 || x.gasF > 0);

  return `
    <div class="view-toggle">
      <div class="vt-btn"    onclick="State.viewMode='mensal';renderApp()">Mensal</div>
      <div class="vt-btn on" onclick="State.viewMode='anual'; renderApp()">Anual</div>
    </div>
    <div class="hero-card">
      <div class="hero-label">📅 GERENCIAL ANUAL — ${year}</div>
      <div class="hero-amount">${fmt(recAnual)}</div>
      <div class="hero-sub">Receita total · ${savedAnual} meses com lançamentos</div>
      <span class="badge ${saldoAnual >= 0 ? 'badge-green' : 'badge-red'}">
        ${saldoAnual >= 0 ? '▲' : '▼'} ${Math.abs(parseFloat(pSalAnual))}% margem anual
      </span>
    </div>
    <div class="grid2">
      <div class="mini-card">
        <div class="mini-label">💸 Total Saídas</div>
        <div class="mini-value" style="color:var(--red)">${fmtk(gasAnual)}</div>
        <div class="mini-change" style="color:var(--red)">▼ ${pGasAnual}% da receita</div>
      </div>
      <div class="mini-card">
        <div class="mini-label">✅ Saldo do Ano</div>
        <div class="mini-value" style="color:${saldoAnual >= 0 ? 'var(--green)' : 'var(--red)'}">
          ${fmtk(saldoAnual)}
        </div>
        <div class="mini-change" style="color:${saldoAnual >= 0 ? 'var(--green)' : 'var(--red)'}">
          ${saldoAnual >= 0 ? '▲' : '▼'} ${Math.abs(parseFloat(pSalAnual))}%
        </div>
      </div>
    </div>
    <div class="card" style="margin-bottom:14px">
      <div class="card-title" style="margin-bottom:14px">📊 Mês a Mês — ${year}</div>
      ${meses.map(m => {
        const p = m.recMes ? Math.min((m.gasMes / m.recMes) * 100, 100) : 0;
        return `
        <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)">
          <div style="width:32px;font-size:10px;font-weight:700;color:${m.i === State.month ? 'var(--orange)' : 'var(--text2)'}">
            ${m.label}
          </div>
          <div style="flex:1">
            <div style="height:6px;background:var(--navy3);border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${Math.min((m.recMes/maxMes)*100,100)}%;background:rgba(16,217,160,0.3);border-radius:3px"></div>
            </div>
            <div style="height:4px;background:var(--navy3);border-radius:2px;overflow:hidden;margin-top:2px">
              <div style="height:100%;width:${Math.min((m.gasMes/maxMes)*100,100)}%;background:${progressColor(p)};border-radius:2px"></div>
            </div>
          </div>
          <div style="text-align:right;min-width:90px">
            <div style="font-size:10px;color:var(--green);font-family:'JetBrains Mono',monospace">${m.recMes > 0 ? fmtk(m.recMes) : '—'}</div>
            <div style="font-size:10px;color:${m.gasMes > 0 ? 'var(--red)' : 'var(--text3)'};font-family:'JetBrains Mono',monospace">${m.gasMes > 0 ? '↓' + fmtk(m.gasMes) : '—'}</div>
          </div>
          <div style="font-size:9px;${m.hasSaved ? 'color:var(--green);font-weight:700' : 'color:var(--text3)'}">${m.hasSaved ? '✓' : '—'}</div>
        </div>`;
      }).join('')}
    </div>
    ${filialAnual.length > 0 ? `
    <div class="sec-head"><div class="sec-title">🏪 Por Filial — ${year}</div></div>
    ${filialAnual.map(x => `
      <div class="filial-row" onclick="navDash('${x.f}', null)">
        <div class="f-badge">${x.f}</div>
        <div class="f-info">
          <div class="f-name">Filial ${x.f}</div>
          <div class="f-meta">Rec: ${fmtk(x.recF)} · Saídas: ${fmtk(x.gasF)}</div>
        </div>
        <div class="f-right">
          <div class="f-amount" style="color:${x.saldo >= 0 ? 'var(--green)' : 'var(--red)'}">${fmtk(x.saldo)}</div>
          <div class="f-pct">saldo anual</div>
        </div>
        <div class="f-chevron">›</div>
      </div>`).join('')}
    ` : ''}
  `;
}