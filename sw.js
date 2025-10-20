// sw.js — Prompt Scientist PWA Service Worker

const CACHE_NAME = 'prompt-scientist-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/feed.html',
  '/profile.html',
  '/privacy-policy.html',
  '/manifest.json',
  '/prompticon.png'
];

// 🔹 Service Worker Install — Cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets...');
      return cache.addAll(urlsToCache);
    })
  );
});

// 🔹 Activate — Remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  console.log('Service Worker Activated');
});

// 🔹 Fetch — Serve from cache first, then network fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Serve from cache
      }
      return fetch(event.request)
        .then((networkResponse) => {
          // Cache new requests (optional)
          return caches.open(CACHE_NAME).then((cache) => {
            if (event.request.url.startsWith('http')) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        })
        .catch(() =>
          caches.match('/index.html') // Offline fallback
        );
    })
  );
});
