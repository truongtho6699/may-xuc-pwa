/**
 * Cache bộ khung PWA; giao dịch offline lưu riêng trong IndexedDB.
 */
const CACHE_NAME='may-xuc-shell-v9-role-v2';
const SHELL_FILES=['./','./index.html','./manifest.json?v=20260918-6','./css/app.css?v=20260918-6','./js/app.js?v=20260918-6','./js/config.js?v=20260918-6','./js/api.js?v=20260918-6','./js/admin.js?v=20260918-6','./js/admin-forms.js?v=20260918-6','./js/role-v2.js?v=20260918-6','./js/offline.js?v=20260918-6','./js/camera.js?v=20260918-6','./js/gps.js?v=20260918-6','./js/qr.js?v=20260918-6','./js/jsQR.vendor.js?v=20260918-6','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(SHELL_FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.hostname.endsWith('.supabase.co')||u.hostname.includes('script.google')||u.hostname.includes('googleusercontent')||u.hostname.includes('googleapis'))return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE_NAME).then(x=>x.put('./index.html',c));return r}).catch(()=>caches.match('./index.html')));return}e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)))})