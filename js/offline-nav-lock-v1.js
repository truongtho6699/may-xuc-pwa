// Khi DRIVER/OPERATOR offline: khóa các menu khác, chỉ cho phép Vận hành.
(function(){
'use strict';
if(window.__NS_OFFLINE_NAV_LOCK_V1)return;window.__NS_OFFLINE_NAV_LOCK_V1=true;
function currentUser(){try{return typeof Api!=='undefined'&&Api?.getCurrentUser?Api.getCurrentUser():null}catch(e){return null}}
function fieldRole(){const r=currentUser()?.ROLE;return r==='DRIVER'||r==='OPERATOR'}
function locked(){return !navigator.onLine&&fieldRole()}
function toast(msg){const c=document.getElementById('toast-container');if(!c)return;const x=document.createElement('div');x.className='toast warning show';x.textContent=msg;c.appendChild(x);setTimeout(()=>x.remove(),2200)}
function css(){if(document.getElementById('ns-offline-nav-lock-css'))return;const s=document.createElement('style');s.id='ns-offline-nav-lock-css';s.textContent=`#bottom-nav button.ns-offline-locked{opacity:.38!important;filter:grayscale(.7);pointer-events:none!important}#bottom-nav button.ns-offline-locked .nav-icon{opacity:.55!important}.ns-offline-only-note{margin:0 14px 12px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:14px;padding:10px 12px;font-size:13px;font-weight:800;text-align:center}`;document.head.appendChild(s)}
function apply(){css();const nav=document.getElementById('bottom-nav');if(!nav)return;const on=locked();nav.querySelectorAll('button[data-route]').forEach(b=>{const allow=b.dataset.route==='operations-v2';b.classList.toggle('ns-offline-locked',on&&!allow);b.setAttribute('aria-disabled',on&&!allow?'true':'false')});if(on){const screen=document.getElementById('screen');if(screen&&!screen.querySelector('.ns-offline-only-note')){const note=document.createElement('div');note.className='ns-offline-only-note';note.textContent='Đang offline · Chỉ màn hình Vận hành khả dụng.';screen.prepend(note)}}else document.querySelectorAll('.ns-offline-only-note').forEach(x=>x.remove())}
function forceOperations(){apply();if(!locked())return;const active=document.querySelector('#bottom-nav button.active')?.dataset.route;if(active!=='operations-v2'&&typeof window.navigate==='function'){window.navigate('operations-v2');setTimeout(apply,120)}}
document.addEventListener('click',e=>{const b=e.target.closest?.('#bottom-nav button[data-route]');if(!b||!locked()||b.dataset.route==='operations-v2')return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();toast('Đang offline. Chỉ sử dụng menu Vận hành.')},true);
window.addEventListener('offline',()=>setTimeout(forceOperations,80));window.addEventListener('online',()=>setTimeout(apply,80));document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(forceOperations,80)});
function boot(){apply();if(locked())setTimeout(forceOperations,120);new MutationObserver(()=>setTimeout(apply,30)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();