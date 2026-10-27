/* Offline support. Network first (so edits show up right away), cached copy when offline. */
const CACHE = 'petlink-v6';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',
  'js/config.js',
  'js/phrases.js',
  'js/util.js',
  'js/i18n.js',
  'js/i18n/es.js',
  'js/i18n/fr.js',
  'js/i18n/de.js',
  'js/i18n/it.js',
  'js/i18n/pt.js',
  'js/i18n/ja.js',
  'js/avatars.js',
  'js/sim.js',
  'js/talk.js',
  'js/petsounds.js',
  'js/store.js',
  'js/voice.js',
  'js/charts.js',
  'js/map.js',
  'js/ui.js',
  'js/dialogs.js',
  'js/views/home.js',
  'js/views/map.js',
  'js/views/health.js',
  'js/views/translator.js',
  'js/views/logs.js',
  'js/views/settings.js',
  'js/app.js',
  'assets/fonts/inter-latin-wght-normal.woff2',
  'assets/fonts/fredoka-latin-600-normal.woff2',
  'assets/icons/icon.svg',
  'assets/icons/icon-192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE)
    .then((cache) => cache.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    // "no-cache" asks the server every time (a quick 304 when nothing changed), so the browser's
    // HTTP cache can't hand back an old script after an edit.
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html')))
  );
});
