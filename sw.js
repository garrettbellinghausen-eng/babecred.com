var CACHE_NAME = 'babecred-v1';
var URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/cred-engine.js',
    '/comments.js',
    '/coming-up.js',
    '/chat.js',
    '/firebase-config.js',
    '/logo.svg'
];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(URLS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (names) {
            return Promise.all(
                names.filter(function (n) { return n !== CACHE_NAME; })
                    .map(function (n) { return caches.delete(n); })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', function (e) {
    // Network first for API calls and Firebase
    if (e.request.url.indexOf('firebaseio.com') >= 0 ||
        e.request.url.indexOf('googleapis.com') >= 0 ||
        e.request.url.indexOf('open-meteo.com') >= 0 ||
        e.request.url.indexOf('firebasestorage') >= 0) {
        return;
    }
    e.respondWith(
        fetch(e.request).then(function (response) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
                cache.put(e.request, clone);
            });
            return response;
        }).catch(function () {
            return caches.match(e.request);
        })
    );
});
