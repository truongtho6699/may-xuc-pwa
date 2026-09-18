/**
 * service-worker.js
 * Cache giao diện để ứng dụng mở được khi mất mạng.
 * Ảnh chụp/giao dịch offline được giữ qua IndexedDB và đồng bộ riêng.
 */

const CACHE_NAME = 'may-xuc-shell-v8-admin';

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json?v=20260918-5',
  './css/app.css?v=20260918-5',
  './js/app.js?v=20260918-5',
  './js/config.js?v=20260918-5',
  './js/api.js?v=20260918-5',
  './js/admin.js?v=20260918-5',
  './js/admin-forms.js?v=20260918-5',
  './js/offline.js?v=20260918-5',
  './js/camera.js?v=20260918-5',
  './js/gps.js?v=20260918-5',
  './js/qr.js?v=20260918-5',
  './js/jsQR.vendor.js?v=20260918-5',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.hostname.endsWith('.supabase.co') ||
      url.hostname.indexOf('script.google') !== -1 ||
      url.hostname.indexOf('googleusercontent') !== -1 ||
      url.hostname.indexOf('googleapis') !== -1) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy));
        return response;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
