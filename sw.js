// sw.js Cache Name to keep in browser and session settings
const CACHE_NAME = 'offline-first-v1';
let sessionId = null;
self.addEventListener('message', (event) => {
    if (event.data && event.data.sessionId) {
        sessionId = event.data.sessionId;
    }
});

// This is install listner to keep pages in alive in cache 
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            if (sessionId) {
                return cache.addAll([
                    '/',
                    'https://apex.oracle.com/pls/apex/r/pwa_app_sample/testing/home?session=' + sessionId,
                    'https://apex.oracle.com/pls/apex/r/pwa_app_sample/testing/testing-search?session=' + sessionId,
					'https://apex.oracle.com/pls/apex/r/pwa_app_sample/testing/testing-report?session=' + sessionId
					
                ]);
            } else {
                return Promise.resolve();
            }
        })
    );
});

// This is activate listner
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName.startsWith('offline-first-') &&
                        cacheName !== CACHE_NAME;
                }).map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

// This is fetch listner
self.addEventListener('fetch', (event) => {
    if (!navigator.onLine) {
        event.respondWith(fetchFromCache(event.request));
    } else {
        event.respondWith(fetchFromServer(event.request));
    }
});

// This listner is to request cache
async function fetchFromCache(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    return cachedResponse || fetch(request);
}

// This listner is to request server
async function fetchFromServer(request) {
    const cache = await caches.open(CACHE_NAME);
    try {
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        return cachedResponse || new Response('Offline');
}
}