// Service worker for /map only. Keeps the page itself, the map library, fonts and map icons available with no
// connection. Map tiles and the map style are stored by the page (IndexedDB), not here.
const SHELL = 'map-shell-v1';
const LIBS = ['https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min.css'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => Promise.allSettled([c.add('/map'), ...LIBS.map(u => c.add(u)), c.add('/map/icon-192.png')])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('map-shell-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const keep = (req, res) => { if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(SHELL).then(c => c.put(req, copy)); } return res; };
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate' && u.origin === location.origin) {   // the page: newest when online, saved copy when not
    e.respondWith(fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(SHELL).then(c => c.put('/map', copy)); } return r; }).catch(() => caches.match('/map')));
    return;
  }
  const lib = u.host === 'cdnjs.cloudflare.com', font = u.host === 'fonts.googleapis.com' || u.host === 'fonts.gstatic.com';
  const sprite = u.host === 'tiles.openfreemap.org' && u.pathname.startsWith('/sprites/'), own = u.origin === location.origin && u.pathname.startsWith('/map/');
  if (lib || u.host === 'fonts.gstatic.com' || sprite) {   // never change: saved copy first
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => keep(req, r))));
  } else if (font || own) {   // may change: network first, saved copy as the fallback
    e.respondWith(fetch(req).then(r => keep(req, r)).catch(() => caches.match(req)));
  }
});
