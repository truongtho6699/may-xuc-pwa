/**
 * service-worker.js
 * ------------------------------------------------------------
 * Cache các file giao diện để ứng dụng mở được khi mất mạng.
 * Dữ liệu nghiệp vụ không cache tại Service Worker; hàng đợi
 * giao dịch offline được xử lý riêng bằng IndexedDB.
 * ------------------------------------------------------------
 */

const CACHE_NAME = 'may-xuc-shell-v5-supabase';

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/app.css',
  './js/app.js',
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
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API Supabase luôn đi mạng trực tiếp; hàng đợi offline tự xử lý khi lỗi.
  if (url.hostname.endsWith('.supabase.co') ||
      url.hostname.indexOf('script.google') !== -1 ||
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
