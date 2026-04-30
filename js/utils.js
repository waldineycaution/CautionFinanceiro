/* ═══════════════════════════════════════════════
   utils.js — Formatação, DOM e Helpers

   IMPORTANTE: saveState() e loadState() estão em
   firebase.js — NÃO definir aqui.
   ═══════════════════════════════════════════════ */

// ── FORMATAÇÃO ────────────────────────────────

function fmt(value) {
  return 'R$ ' + (value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function fmtk(value) {
  if (value >= 1000) return 'R$ ' + (value / 1000).toFixed(1) + 'k';
  return 'R$ ' + (value || 0).toFixed(0);
}

function pct(numerator, denominator) {
  if (!denominator) return '0.0';
  return ((numerator / denominator) * 100).toFixed(1);
}

function initials(name) {
  if (!name) return '?';
  return name.trim().split(' ').slice(0, 2).map(function(w) {
    return w[0];
  }).join('').toUpperCase();
}

function formatDate(iso) {
  if (!iso) return '—';
  var parts = iso.split('-');
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function progressColor(value) {
  if (value >= 80) return 'var(--red)';
  if (value >= 50) return 'var(--orange)';
  return 'var(--green)';
}

function newId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// ── TOAST ─────────────────────────────────────

var _toastHideTimer = null;
var _toastFadeTimer = null;

function showToast(message, type) {
  var colors = { green: 'var(--green)', orange: 'var(--orange)', red: 'var(--red)' };
  var el = document.getElementById('toast');
  if (!el) return;

  // Cancela timers anteriores
  clearTimeout(_toastHideTimer);
  clearTimeout(_toastFadeTimer);

  // Reseta estado
  el.classList.remove('visible', 'show');

  // Atualiza conteúdo
  el.textContent = message;
  el.style.color = colors[type || 'green'] || colors.green;

  // Mostra: display:block primeiro, depois opacity:1
  el.classList.add('show');
  _toastFadeTimer = setTimeout(function() {
    el.classList.add('visible');
  }, 20);

  // Esconde após 2.5s: tira opacity, depois display
  _toastHideTimer = setTimeout(function() {
    el.classList.remove('visible');
    setTimeout(function() {
      el.classList.remove('show');
    }, 280); // aguarda a transição de opacity terminar
  }, 2500);
}

// ── OVERLAY ───────────────────────────────────

function openOverlay(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeOverlay(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function closeIfBackdrop(event, overlayId) {
  if (event.target.id === overlayId) closeOverlay(overlayId);
}

// ── TOGGLE ────────────────────────────────────

function setToggle(el, value) {
  if (!el) return;
  el.classList.toggle('on', value);
  var knob = el.querySelector('.tgl-k');
  if (knob) knob.style.transform = value ? 'translateX(19px)' : '';
}