/* Service worker Beldi Dog Rescue — cache léger, réseau d'abord */
const CACHE = 'beldi-v1';
const CORE = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Réseau d'abord (les données Supabase doivent rester fraîches),
   cache en secours si hors-ligne */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  /* Ne jamais mettre en cache les appels Supabase */
  if (url.hostname.includes('supabase.co')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok && url.origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(m => m || caches.match('/')))
  );
});
