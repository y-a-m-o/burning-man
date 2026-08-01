/* BM40 · 2026 — офлайн-кэш оболочки сайта */
const CACHE = 'bm40-v1';
const SHELL = ['./', './index.html', './cover.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  /* запросы к базе не кэшируем — данные должны быть свежими */
  if (url.hostname.endsWith('supabase.co')) return;

  /* оболочка: отдаём из сети, но подкладываем кэш, если сети нет */
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200 && url.origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});
