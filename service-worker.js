const CACHE_NAME = 'satoshi-calc-v3-cache-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/estilos.css',
  '/js/script.js',
  '/img/favicon.ico',
  '/img/icons/icon-192x192.png',
  '/img/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});