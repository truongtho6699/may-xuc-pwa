/**
 * service-worker.js
 * ------------------------------------------------------------
 * Cache các file "shell" của ứng dụng (HTML/CSS/JS/icon) để:
 * - App mở được ngay cả khi mất mạng (mục 16, 39 của yêu cầu).
 * - Tải nhanh hơn ở lần mở sau.
 *
 * LƯU Ý: Service worker KHÔNG cache dữ liệu API (Google Sheets),
 * việc đồng bộ dữ liệu offline được xử lý riêng ở js/offline.js
 * bằng IndexedDB, vì dữ liệu giao dịch cần logic chống trùng
 * (CLIENT_TRANSACTION_ID) phức tạp hơn cache tĩnh thông thường.
 * ------------------------------------------------------------
 */

const CACHE_NAME = 'may-xuc-shell-v4';

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

// Cài đặt: cache toàn bộ file shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

// Kích hoạt: dọn cache cũ nếu có version mới
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Chiến lược fetch:
// - File shell (HTML/CSS/JS/icon): Cache First (ưu tiên cache, nhanh + hoạt động offline)
// - Request API (gọi tới script.google.com): Network First, KHÔNG cache
//   (dữ liệu nghiệp vụ phải luôn mới, offline queue xử lý riêng ở offline.js)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Không can thiệp vào request gọi API backend
  if (url.hostname.indexOf('script.google') !== -1 || url.hostname.indexOf('googleapis') !== -1) {
    return; // để trình duyệt xử lý bình thường (network), offline.js sẽ tự queue nếu lỗi
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        // Nếu không có mạng và không có cache -> fallback về trang chủ (SPA)
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
