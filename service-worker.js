
const CACHE_NAME = 'vibechord-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Audio samples domain to cache dynamically
const AUDIO_SOURCE_DOMAIN = 'gleitz.github.io';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline page');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 1. Handle Audio Samples (Cache First, fall back to Network)
  // This ensures that once a note is played, it's saved forever.
  if (event.request.url.includes(AUDIO_SOURCE_DOMAIN) || event.request.url.endsWith('.mp3')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response) return response; // Hit cache
          return fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone()); // Add to cache
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 2. Handle App Navigation (Network First, fall back to Cache)
  // Ensures user gets latest version if online, but works offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then((cache) => cache.match('/index.html'));
        })
    );
    return;
  }

  // 3. General Assets (Stale-While-Revalidate strategy could be used here, keeping simple for now)
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
