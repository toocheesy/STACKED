const CACHE_NAME = 'stacked-v14';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/game.html',
  '/css/styles.css',
  '/manifest.json',
  '/js/helpers.js',
  '/js/cardIntelligence.js',
  '/js/gameStateManager.js',
  '/js/modalManager.js',
  '/js/game.js',
  '/js/modeSelector.js',
  '/js/MessageController.js',
  '/js/classic.js',
  '/js/speed.js',
  '/js/ai.js',
  '/js/botModal.js',
  '/js/ui.js',
  '/js/main.js',
  '/js/personalities/calvin.js',
  '/js/personalities/nina.js',
  '/js/personalities/rex.js',
  '/audio/capture.mp3',
  '/audio/invalid.mp3',
  '/audio/jackpot.mp3',
  '/audio/winner.mp3',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png'
];

// Install — cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, cache fallback (ensures fresh content on deploy)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Update cache with fresh response
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
