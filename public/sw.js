/**
 * Service Worker (§3)
 * 
 * Caches WASM binaries and app shell for offline-capable PDF processing.
 * Uses a Cache-First strategy for WASM files (immutable, content-addressed)
 * and Network-First for HTML/CSS/JS (frequently updated).
 */

var WASM_CACHE = 'modufile-wasm-v3';
var CACHE_NAME = 'modufile-v3';

var WASM_ASSETS = [
    '/mupdf.js',
    '/mupdf-wasm.js',
    '/mupdf-wasm.wasm',
];

// Install: precache WASM assets
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(WASM_CACHE).then(function (cache) {
            return Promise.all(
                WASM_ASSETS.map(function (url) {
                    return cache.add(url).catch(function () {
                        console.warn('[SW] Failed to precache: ' + url);
                    });
                })
            );
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys
                    .filter(function (key) { return key !== CACHE_NAME && key !== WASM_CACHE; })
                    .map(function (key) { return caches.delete(key); })
            );
        })
    );
    self.clients.claim();
});

// Fetch: Cache-First for WASM, Network-First for navigation
self.addEventListener('fetch', function (event) {
    var url = new URL(event.request.url);

    // Only handle same-origin GET requests
    if (event.request.method !== 'GET') return;
    if (url.origin !== self.location.origin) return;

    // Cache-First for WASM
    if (url.pathname.endsWith('.wasm') || WASM_ASSETS.indexOf(url.pathname) !== -1) {
        event.respondWith(cacheFirst(event.request, WASM_CACHE));
        return;
    }

    // Network-First for navigation (HTML pages)
    if (event.request.mode === 'navigate') {
        event.respondWith(networkFirst(event.request, CACHE_NAME));
        return;
    }
});

function cacheFirst(request, cacheName) {
    return caches.match(request).then(function (cached) {
        if (cached) return cached;
        return fetch(request).then(function (response) {
            if (response.ok) {
                // Clone IMMEDIATELY while the stream is still fresh
                var responseClone = response.clone();
                caches.open(cacheName).then(function (cache) {
                    cache.put(request, responseClone);
                });
            }
            return response;
        });
    });
}

function networkFirst(request, cacheName) {
    return fetch(request).then(function (response) {
        if (response.ok) {
            // Clone IMMEDIATELY while the stream is still fresh
            var responseClone = response.clone();
            caches.open(cacheName).then(function (cache) {
                cache.put(request, responseClone);
            });
        }
        return response;
    }).catch(function () {
        return caches.match(request).then(function (cached) {
            return cached || new Response('Offline', { status: 503 });
        });
    });
}
