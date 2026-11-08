// 离线缓存：先用手机里缓存的版本打开（快、断网也能用），同时在后台取新版本，下次打开生效。
var CACHE = 'sleep-plan-v1';
var ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  var isPage = req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname);
  var key = isPage ? './index.html' : req;
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(key).then(function (cached) {
      var fresh = fetch(req).then(function (res) {
        if (res && res.ok) c.put(key, res.clone());
        return res;
      }).catch(function () { return null; });
      e.waitUntil(fresh);
      if (cached) return cached;
      return fresh.then(function (res) {
        return res || new Response('现在没有网络，而且手机里还没有缓存。联网打开一次之后就能离线用了。', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      });
    });
  }));
});
