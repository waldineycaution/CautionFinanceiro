/* ═══════════════════════════════════════════════
   sw.js — Service Worker CautionFIN
   Cache-first para assets estáticos,
   network-first para dados Firebase/Sheets.
   ═══════════════════════════════════════════════ */

const CACHE_NAME = 'cautionfin-v3';

const STATIC_ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './css/components.css',
  './css/modals.css',
  './js/state.js',
  './js/utils.js',
  './js/firebase-config.js',
  './js/firebase.js',
  './js/data.js',
  './js/sheets.js',
  './js/app.js',
  './js/views/dashboard.js',
  './js/views/filiais.js',
  './js/views/gastos.js',
  './js/views/despesas.js',
  './js/views/config.js',
  './js/modals/employee.js',
  './js/modals/revenue.js',
  './js/modals/benefit.js',
  'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'
];

// ── INSTALL: cacheia os assets estáticos ──────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS.map(function(url) {
        return new Request(url, { cache: 'reload' });
      })).catch(function(err) {
        console.warn('SW: falha ao cachear alguns assets', err);
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE: limpa caches antigos ────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── FETCH: estratégia por tipo de request ─────
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Deixa passar SEM interceptar — APIs externas com CORS
  // O SW não toca nessas requisições para não quebrar CORS
  if (
    url.hostname.includes('script.google.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('cloudinary.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    // Não chama event.respondWith — browser trata normalmente sem SW
    return;
  }

  // Assets locais → cache-first com fallback para rede
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    }).catch(function() {
      return caches.match('/index.html');
    })
  );
});
