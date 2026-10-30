// Service worker ПУШКИН.ОС.
// Главное правило: html/js/json всегда сначала берём из сети,
// иначе игроки после обновления сайта видят старую версию из кэша.
const CACHE = 'pushkin-os-v5';
const CORE = ['./index.html', './manifest.json', './tasks.js'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .catch(() => {})
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isFreshFirst(req) {
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return false;
  return req.mode === 'navigate'
    || req.destination === 'document'
    || req.destination === 'script'
    || /\.(html|js|json)$/i.test(url.pathname);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (isFreshFirst(req)) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  // Картинки, звуки и прочая статика — из кэша, чтобы работало офлайн и быстро
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok && new URL(req.url).origin === self.location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    }))
  );
});
