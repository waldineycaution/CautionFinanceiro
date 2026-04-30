/* ═══════════════════════════════════════════════
   firebase.js — Integração com Firestore
   Substitui o localStorage por banco em nuvem.
   ═══════════════════════════════════════════════ */

let db_firestore = null;
let _saveDebounce = null;

/** Inicializa Firebase e Firestore */
function initFirebase() {
  try {
    firebase.initializeApp(firebaseConfig);
    db_firestore = firebase.firestore();
    console.log('✅ Firebase conectado');
    _setFirebaseStatus(true);
    return true;
  } catch (e) {
    console.error('❌ Erro ao iniciar Firebase:', e);
    _setFirebaseStatus(false);
    return false;
  }
}

function _setFirebaseStatus(ok) {
  var pill = document.getElementById('firebaseStatusPill');
  if (!pill) return;
  pill.className = 'status-pill ' + (ok ? 'ok' : 'error');
  var dot = pill.querySelector('.status-dot');
  if (dot) dot.className = 'status-dot' + (ok ? ' pulse' : '');
  pill.querySelector('span').textContent = ok ? 'Firebase' : 'Firebase ✗';
}

/** 
 * Salva State no Firestore.
 * Usa debounce de 800ms para não sobrecarregar com writes.
 */
// Sobrescreve o saveState do utils.js com a versão Firebase
saveState = function() {
  // Sempre salva no localStorage como fallback imediato
  try {
    localStorage.setItem('gestaopro_v1', JSON.stringify({
      db:        State.db,
      employees: State.employees,
      goals:     State.goals,
      filiais:   State.filiais
    }));
  } catch(e) {}

  // Salva no Firestore com debounce
  if (!db_firestore) return;
  clearTimeout(_saveDebounce);
  _saveDebounce = setTimeout(() => {
    _pushToFirestore();
  }, 800);
}

async function _pushToFirestore() {
  try {
    const col = db_firestore.collection('gestaopro');

    // Salva employees, goals e filiais
    await col.doc('employees').set({ data: JSON.stringify(State.employees) });
    await col.doc('goals').set({ data: JSON.stringify(State.goals || {}) });
    await col.doc('filiais').set({ data: JSON.stringify(State.filiais || []) });

    // Salva cada chave de período separadamente (evita doc muito grande)
    const dbKeys = Object.keys(State.db);
    for (const key of dbKeys) {
      await col.doc('db_' + key).set({ data: JSON.stringify(State.db[key]) });
    }

    console.log('☁️ Sincronizado com Firestore');
  } catch (e) {
    console.warn('⚠️ Erro ao salvar no Firestore:', e);
  }
}

/** Restaura State do Firestore (ou localStorage como fallback) */
// Sobrescreve o loadState do utils.js com a versão Firebase
loadState = async function() {
  // Tenta localStorage primeiro (carregamento instantâneo)
  try {
    const raw = localStorage.getItem('gestaopro_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.db)        State.db        = parsed.db;
      if (parsed.employees) State.employees  = parsed.employees;
      if (parsed.goals)     State.goals      = parsed.goals;
      if (parsed.filiais)   State.filiais    = parsed.filiais;
    }
  } catch(e) {}

  // Depois sincroniza com Firestore em background
  if (!db_firestore) return;

  try {
    const col  = db_firestore.collection('gestaopro');
    const snap = await col.get();

    if (snap.empty) return; // sem dados no Firestore ainda

    snap.forEach(docSnap => {
      const id   = docSnap.id;
      const data = docSnap.data();

      if (id === 'employees' && data.data) {
        try { State.employees = JSON.parse(data.data); } catch(e) {}
      } else if (id === 'goals' && data.data) {
        try { State.goals = JSON.parse(data.data); } catch(e) {}
      } else if (id === 'filiais' && data.data) {
        try { const f = JSON.parse(data.data); if (f.length) State.filiais = f; } catch(e) {}
      } else if (id.startsWith('db_') && data.data) {
        const key = id.replace('db_', '');
        try { State.db[key] = JSON.parse(data.data); } catch(e) {}
      }
    });

    // Atualiza localStorage com dados frescos do Firestore
    localStorage.setItem('gestaopro_v1', JSON.stringify({
      db:        State.db,
      employees: State.employees,
      goals:     State.goals,
      filiais:   State.filiais
    }));

    console.log('☁️ Dados carregados do Firestore');
    renderApp();

    // Dispara o sync do Sheets com os dados já carregados
    // Usa timeout para garantir que renderApp() terminou primeiro
    if (typeof scheduleSheetsSync === 'function') {
      setTimeout(function() { scheduleSheetsSync(); }, 500);
    }

  } catch (e) {
    console.warn('⚠️ Erro ao carregar Firestore (usando localStorage):', e);
  }
}