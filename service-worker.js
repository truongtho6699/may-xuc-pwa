/**
 * service-worker.js
 * Cache giao diện để ứng dụng mở được khi mất mạng.
 * Ảnh chụp/giao dịch offline được giữ qua IndexedDB và đồng bộ riêng.
 */

const CACHE_NAME = 'may-xuc-shell-v6-drive';

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/app.css',
  './js/app.js',
  './js/config.js',
  './js/api.js',
  './js/offline.js',
  './js/camera.js',
  './js/gps.js',
  './js/qr.js',
  './js/jsQR.vendor.js',
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

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
