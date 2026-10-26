const CACHE_NAME = 'dining-arbitrage-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Stale-while-revalidate for local app shell
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networked = fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const cacheCopy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networked;
      })
    );
  }
});
