const CACHE_NAME = 'trade-journal-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Nigdy nie cache'uj wywołań do Google (logowanie / Drive API) -
  // muszą zawsze iść na żywo do sieci.
  if (req.url.includes('googleapis.com') || req.url.includes('accounts.google.com')) {
    return;
  }

  // Dla nawigacji (otwarcie strony): najpierw sieć, żeby zawsze mieć
  // najnowszą wersję appki gdy jest internet; offline -> wersja z cache.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', resClone));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Dla reszty zasobów własnych (ikony, manifest): cache najpierw, sieć jako fallback.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
