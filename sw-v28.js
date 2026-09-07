const CACHE = 'tgm-alarm-center-v28';
const INDEX = './index.html';
const ASSETS = [
  './', './index.html', './styles.css?v=8', './app.js?v=24', './account-delete.js?v=1', './ui-cleanup.js?v=3', './founder-access.js?v=2', './reference-theme.css?v=2', './reference-theme-global.css?v=1', './manifest.webmanifest', './icon.png', './assets/notifications/alarm-pulse.wav', './assets/notifications/alarm-siren.wav', './assets/notifications/alarm-chime.wav',
];
self.addEventListener('install', (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (event) => { event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(INDEX, copy)); return response; }).catch(() => caches.match(INDEX)));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response; })));
});
