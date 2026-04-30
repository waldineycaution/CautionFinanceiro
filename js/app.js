/* ═══════════════════════════════════════════════
   app.js — Controlador Principal
   ═══════════════════════════════════════════════ */

const TOPBAR_TITLES = {
  dash:     { title: 'Dashboard',       sub: 'Visão geral do período' },
  filiais:  { title: 'Filiais',         sub: 'Gerencie suas lojas' },
  gastos:   { title: 'Lançamentos',     sub: 'Todos os custos do período' },
  despesas: { title: 'Despesas Extras', sub: 'Rescisões e despesas avulsas' },
  config:   { title: 'Configurações',   sub: 'Integrações e preferências' },
};

function isDesktop() { return window.innerWidth >= 768; }

// ── RENDER ────────────────────────────────────
function renderApp() {
  const main = document.getElementById('appMain');
  switch (State.tab) {
    case 'dash':     main.innerHTML = renderDashboard(); break;
    case 'filiais':  main.innerHTML = State.filial ? renderFilialDetail() : renderFiliais(); break;
    case 'gastos':   main.innerHTML = renderGastos(); break;
    case 'despesas': main.innerHTML = renderDespesas(); break;
    case 'config':   main.innerHTML = renderConfig(); break;
  }
  updateTopbar();
  updateAddBtn();
}

function updateTopbar() {
  const info = State.filial
    ? { title: `Filial ${State.filial}`, sub: `${getActiveEmployees(State.filial).length} funcionário(s) · ${MONTHS[State.month]} ${State.year}` }
    : (TOPBAR_TITLES[State.tab] || TOPBAR_TITLES.dash);
  const titleEl = document.getElementById('topbarTitle');
  const subEl   = document.getElementById('topbarSub');
  if (titleEl) titleEl.textContent = info.title;
  if (subEl)   subEl.textContent   = info.sub;
}

function updateAddBtn() {
  const btn = document.getElementById('sidebarAddBtn');
  if (!btn) return;
  btn.classList.toggle('visible', State.tab === 'filiais' && !!State.filial);
}

// ── NAVEGAÇÃO ─────────────────────────────────
function navigate(tab) {
  State.tab          = tab;
  State.filial       = null;
  State.gastoFilial  = null;
  State.gastoEmp     = null;
  State.despesasMode   = null;
  State.despesasFilial = null;
  State.despesasEmp    = null;
  State.dashFilial   = null;
  State.dashEmp      = null;
  setActiveNav(tab);
  document.getElementById('fab').classList.add('hidden');
  renderApp();
}

function setActiveNav(tab) {
  document.querySelectorAll('#mobileNav .nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('#sidebarNav .sidebar-nav-item').forEach(n => n.classList.remove('active'));
  const m = document.getElementById('nav-' + tab);
  const d = document.getElementById('snav-' + tab);
  if (m) m.classList.add('active');
  if (d) d.classList.add('active');
}

// ── MONTH ─────────────────────────────────────
function changeMonth(direction) {
  State.month += direction;
  if (State.month < 0)  { State.month = 11; State.year--; }
  if (State.month > 11) { State.month = 0;  State.year++; }
  syncMonthDisplay();
  renderApp();
}

function syncMonthDisplay() {
  const label = `${MONTHS[State.month]} ${State.year}`;
  const els = ['monthChip','monthChipMobile'];
  els.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = label; });
  const pills = ['yearPill','yearPillMobile'];
  pills.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = State.year; });
}

// ── FAB ───────────────────────────────────────
function onFab() {
  if (State.tab === 'filiais' && State.filial) openEmpModal(null);
}

// ── INIT ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Inicializa Firebase e carrega dados
  initFirebase();
  if (typeof initSheets === "function") initSheets();
  syncMonthDisplay();
  loadState(); // async — carrega localStorage imediato, Firestore em background

  document.getElementById('btnPrevMonth').addEventListener('click',       () => changeMonth(-1));
  document.getElementById('btnNextMonth').addEventListener('click',       () => changeMonth(1));
  document.getElementById('btnPrevMonthMobile').addEventListener('click', () => changeMonth(-1));
  document.getElementById('btnNextMonthMobile').addEventListener('click', () => changeMonth(1));

  document.getElementById('btnReceita').addEventListener('click',       () => openRevModal(null));
  document.getElementById('btnReceitaMobile').addEventListener('click', () => openRevModal(null));
  document.getElementById('sidebarAddBtn').addEventListener('click',    () => openEmpModal(null));
  document.getElementById('fab').addEventListener('click', onFab);

  document.querySelectorAll('#sidebarNav .sidebar-nav-item').forEach(item =>
    item.addEventListener('click', () => navigate(item.dataset.tab)));
  document.querySelectorAll('#mobileNav .nav-item').forEach(item =>
    item.addEventListener('click', () => navigate(item.dataset.tab)));

  ['empOverlay','revOverlay','benOverlay'].forEach(id =>
    document.getElementById(id).addEventListener('click', e => closeIfBackdrop(e, id)));

  renderApp();
});