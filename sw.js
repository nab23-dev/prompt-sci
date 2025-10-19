
// sw.js — Prompt Scientist PWA Service Worker

const CACHE_NAME = 'prompt-scientist-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/prompticon.png'
];

// Service Worker Install — Cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching app shell');
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate — Remove old caches
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
  console.log('Service Worker: Activated');
});

// Fetch — Serve from cache first, then network fallback (Cache-First strategy)
self.addEventListener('fetch', (event) => {
    // We only want to cache GET requests.
    if (event.request.method !== 'GET') {
        return;
    }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If we have a cached response, return it.
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, fetch from network.
      return fetch(event.request).then((networkResponse) => {
          // Clone the response because it's a one-time use stream.
          const responseToCache = networkResponse.clone();
          
          // Open the cache and add the new response.
          caches.open(CACHE_NAME).then((cache) => {
              // Only cache successful responses and non-chrome-extension URLs
              if (responseToCache.status === 200 && !event.request.url.startsWith('chrome-extension://')) {
                  cache.put(event.request, responseToCache);
              }
          });
          
          // Return the network response.
          return networkResponse;
        })
        .catch(() => {
            // If the fetch fails (e.g., offline), return an offline fallback page.
            // This assumes you have an offline.html file cached.
            // For a single-page app, returning the base index.html is often sufficient.
            return caches.match('/index.html');
        });
    })
  );
});
