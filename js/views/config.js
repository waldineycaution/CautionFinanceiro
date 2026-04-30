/* ═══════════════════════════════════════════════
   views/config.js — Configurações View
   ═══════════════════════════════════════════════ */

function renderConfig() {
  const filialRows = FILIAIS.map(f => `
    <div style="display:flex;justify-content:space-between;align-items:center;
                padding:8px 0;border-bottom:1px solid var(--border)">
      <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--orange)">${f}</span>
      <span style="font-size:10px;color:var(--text2)">
        ${getActiveEmployees(f).length} func · ${fmtk(getMonthData(f).receita)}
      </span>
    </div>`).join('');

  return `
    <div class="sec-title" style="margin-bottom:16px">⚙️ Configurações</div>

    <!-- Integrações -->
    <div class="card">
      <div class="card-title" style="margin-bottom:12px">🔗 Integrações</div>

      <div class="cfg-row">
        <div>
          <div class="cfg-name">🔥 Firebase</div>
          <div class="cfg-desc">Dados em nuvem em tempo real</div>
        </div>
        <div class="tgl on"><div class="tgl-k" style="transform:translateX(19px)"></div></div>
      </div>

      <div class="cfg-row">
        <div>
          <div class="cfg-name">📊 Google Sheets</div>
          <div class="cfg-desc">Sync automático após cada lançamento</div>
        </div>
        <div class="tgl on"><div class="tgl-k" style="transform:translateX(19px)"></div></div>
      </div>

      <div class="cfg-row" style="border:none">
        <div>
          <div class="cfg-name">📱 Notificações</div>
          <div class="cfg-desc">Alertas de metas e gastos</div>
        </div>
        <div class="tgl on" onclick="this.classList.toggle('on')">
          <div class="tgl-k" style="transform:translateX(19px)"></div>
        </div>
      </div>
    </div>

    <!-- Google Sheets -->
    <div class="card" style="margin-bottom:12px">
      <div class="card-title" style="margin-bottom:4px">📊 Google Sheets</div>
      <div style="font-size:11px;color:var(--text2);margin-bottom:14px;line-height:1.6">
        Planilha:
        <a href="https://docs.google.com/spreadsheets/d/16uXxU4CxF6-D27sXkWEFkggXhFlVmtjPqITm1wpH_-I"
           target="_blank" style="color:var(--blue)">CautionFinanceiro ↗</a>
      </div>

      <div class="form-group">
        <label class="form-label">URL do Apps Script</label>
        <input class="form-input" id="sheetsUrlInput"
               value="${getSheetsUrl()}"
               placeholder="https://script.google.com/macros/s/.../exec">
      </div>

      <div style="display:flex;gap:8px;margin-bottom:10px">
        <button class="btn btn-orange" style="flex:1" onclick="saveSheetsUrl()">
          💾 Salvar URL
        </button>
        <button class="btn btn-ghost" style="flex:1" onclick="syncToSheets()">
          📤 Sync agora
        </button>
      </div>

      <div style="font-size:10px;padding:8px 0;color:${getSheetsUrl() ? 'var(--green)' : 'var(--text3)'}">
        ${getSheetsUrl()
          ? '✅ URL configurada · Sync automático ativo'
          : '⚙️ Cole a URL gerada ao implantar o APPS_SCRIPT.gs na planilha.'}
      </div>
    </div>

    <!-- Metas -->
    <div class="card">
      <div class="card-title" style="margin-bottom:12px">🎯 Metas Mensais</div>
      <div class="form-group">
        <label class="form-label">% Máx. de folha sobre receita</label>
        <div class="input-prefix">
          <span class="prefix-sym">%</span>
          <input class="form-input" type="number" id="metaFolha"
                 value="${State.goals ? State.goals.folha : 35}"
                 min="1" max="100"
                 onchange="saveMeta('folha', this.value)">
        </div>
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">Meta de margem líquida</label>
        <div class="input-prefix">
          <span class="prefix-sym">%</span>
          <input class="form-input" type="number" id="metaMargem"
                 value="${State.goals ? State.goals.margem : 25}"
                 min="1" max="100"
                 onchange="saveMeta('margem', this.value)">
        </div>
      </div>
    </div>

    <!-- Filiais -->
    <div class="card">
      <div class="card-title" style="margin-bottom:10px">🏪 Filiais Cadastradas</div>
      ${filialRows}
    </div>

    <button class="btn btn-ghost" onclick="syncFirebase()">☁️ Forçar sync Firebase</button>
    <button class="btn btn-ghost" onclick="importCSV()">📥 Importar dados (CSV)</button>

    <!-- Zona de perigo -->
    <div class="card" style="margin-top:16px;border-color:rgba(244,63,94,0.25)">
      <div class="card-title" style="color:var(--red);margin-bottom:4px">⚠️ Zona de Perigo</div>
      <div style="font-size:11px;color:var(--text2);margin-bottom:14px;line-height:1.6">
        Ações irreversíveis. Os dados removidos não poderão ser recuperados.
      </div>

      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn" style="background:var(--red2);color:var(--red);
                border:1px solid rgba(244,63,94,0.3);text-align:left;padding:12px 14px"
                onclick="limparDadosFinanceiros()">
          🗑️ Limpar dados financeiros
          <div style="font-size:10px;color:var(--text2);margin-top:3px;font-weight:400">
            Remove receitas, lançamentos e despesas. Mantém funcionários.
          </div>
        </button>

        <button class="btn" style="background:var(--red2);color:var(--red);
                border:1px solid rgba(244,63,94,0.3);text-align:left;padding:12px 14px"
                onclick="removerDesligados()">
          🚪 Remover funcionários desligados
          <div style="font-size:10px;color:var(--text2);margin-top:3px;font-weight:400">
            Exclui permanentemente todos os desligados do cadastro.
          </div>
        </button>

        <button class="btn" style="background:var(--red2);color:var(--red);
                border:1px solid rgba(244,63,94,0.3);text-align:left;padding:12px 14px"
                onclick="limparAbaAtual()">
          📊 Remover aba ${['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'][State.month]}.${State.year}
          <div style="font-size:10px;color:var(--text2);margin-top:3px;font-weight:400">
            Remove só a aba do mês atual do Sheets.
          </div>
        </button>

        <button class="btn" style="background:var(--red2);color:var(--red);
                border:1px solid rgba(244,63,94,0.3);text-align:left;padding:12px 14px"
                onclick="confirmClearSheets()">
          📊 Remover TODAS as abas de meses
          <div style="font-size:10px;color:var(--text2);margin-top:3px;font-weight:400">
            Deleta JAN, FEV, ABR... Recria limpo ao sincronizar.
          </div>
        </button>
      </div>
    </div>
  `;
}

function saveMeta(key, value) {
  if (!State.goals) State.goals = { folha: 35, margem: 25 };
  State.goals[key] = parseFloat(value) || 0;
  saveState();
  showToast('✅ Meta salva!');
}

function syncFirebase() {
  showToast('☁️ Sincronizando...', 'orange');
  saveState();
  showToast('✅ Firebase sincronizado!');
}

function importCSV() {
  showToast('🔜 Importação CSV em breve!', 'orange');
}

function confirmClearSheets() {
  if (!confirm('Excluir TODAS as abas de meses do Google Sheets?\n\n' +
    'As abas JAN.2026, FEV.2026, ABR.2026... serão deletadas permanentemente.\n' +
    'Use "Sync agora" depois para recriar com dados limpos.')) return;
  clearAllSheets();
}

async function limparAbaAtual() {
  if (!getSheetsUrl()) { showToast('⚙️ Configure o Sheets primeiro', 'orange'); return; }
  var nomeMes = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
  var aba = nomeMes[State.month] + '.' + State.year;
  if (!confirm('Excluir a aba "' + aba + '" do Google Sheets?')) return;
  try {
    showToast('🗑️ Removendo aba ' + aba + '...', 'orange');
    var res = await fetch(getSheetsUrl(), {
      method: 'POST', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'clearSheet', sheetName: aba })
    });
    var data = JSON.parse(await res.text());
    showToast(data.ok ? '✅ Aba ' + aba + ' removida!' : '⚠️ Erro', data.ok ? 'green' : 'orange');
  } catch(e) {
    try {
      await fetch(getSheetsUrl(), {
        method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'clearSheet', sheetName: aba })
      });
      showToast('✅ Solicitação enviada!');
    } catch(e2) { showToast('⚠️ Erro ao conectar Sheets', 'orange'); }
  }
}

function limparDadosFinanceiros() {
  if (!confirm('Limpar TODOS os dados financeiros?\n\nIsso remove:\n• Receitas lançadas\n• Lançamentos de pagamento\n• Despesas extras\n\nOs funcionários serão mantidos.')) return;

  State.db = {};

  saveState();
  showToast('🗑️ Dados financeiros removidos!', 'orange');
  renderApp();
}

function removerDesligados() {
  const total = FILIAIS.reduce((sum, f) => sum + getDismissedEmployees(f).length, 0);
  if (total === 0) { showToast('Nenhum funcionário desligado encontrado.', 'orange'); return; }

  if (!confirm('Remover ' + total + ' funcionário(s) desligado(s) permanentemente?\n\nEsta ação não pode ser desfeita.')) return;

  FILIAIS.forEach(function(f) {
    State.employees[f] = (State.employees[f] || []).filter(function(e) {
      return e.ativo !== false;
    });
  });

  saveState();
  showToast('🗑️ Desligados removidos!', 'orange');
  renderApp();
}