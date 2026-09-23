(function(){
'use strict';

const ICONS={
  home:'<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
  clipboard:'<rect width="16" height="18" x="4" y="4" rx="2"/><path d="M8 4V2h8v2"/><path d="M8 9h8M8 13h6M8 17h5"/>',
  settings:'<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  truck:'<path d="M10 17h4V5H2v12h3"/><path d="M14 8h4l4 4v5h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/>',
  fuel:'<path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/><path d="M2 22h14M6 7h6M19 8l3 3v7a2 2 0 0 1-4 0v-5a2 2 0 0 0-2-2h-1"/>',
  wrench:'<path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4Z"/>',
  play:'<path d="m7 4 12 8-12 8Z"/>',
  square:'<rect x="5" y="5" width="14" height="14" rx="2"/>',
  alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
  refresh:'<path d="M20 6v6h-6"/><path d="M4 18v-6h6"/><path d="M18.5 9A7 7 0 0 0 6 6.5L4 9M5.5 15A7 7 0 0 0 18 17.5l2-2.5"/>',
  key:'<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 8.8-8.8M15 8l2 2M17 6l2 2"/>',
  logOut:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  route:'<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M6 16V8a3 3 0 0 1 3-3h6"/>',
  camera:'<path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3z"/><circle cx="12" cy="13" r="3"/>',
  chevronRight:'<path d="m9 18 6-6-6-6"/>',
  check:'<path d="m20 6-11 11-5-5"/>',
  cloudOff:'<path d="m2 2 20 20M5.8 5.8A7 7 0 0 1 19 9a5 5 0 0 1 .9 9.9M8 19H6a4 4 0 0 1-1.5-7.7"/>',
  cloud:'<path d="M17.5 19H9a7 7 0 1 1 6.7-9H17a4.5 4.5 0 1 1 .5 9Z"/>',
  circleAlert:'<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  loader:'<path d="M21 12a9 9 0 1 1-6.2-8.56"/>',
  arrowLeft:'<path d="m15 18-6-6 6-6"/>',
  plus:'<path d="M12 5v14M5 12h14"/>'
};
function icon(name,cls='ns-icon'){
  const body=ICONS[name]||ICONS.circleAlert;
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}
window.NSIcons={icon};

const state={syncing:false,lastError:false,pending:0,attention:0};
function injectCss(){
  if(document.getElementById('ns-design-v1'))return;
  const s=document.createElement('style');s.id='ns-design-v1';s.textContent=`
:root{
  --color-primary:#087173;--color-primary-dark:#065e60;
  --color-surface:#fff;--color-bg:#f4f6f8;--color-text:#17212b;--color-text-muted:#667085;--color-border:#dfe6e9;
  --color-success:#15803d;--color-warning:#b45309;--color-danger:#c2413a;--color-offline:#9a6700;--color-syncing:#2563eb;
  --ns-icon-sm:18px;--ns-icon-md:22px;--ns-icon-lg:24px;--ns-header-h:76px;--ns-radius:18px;
}
#network-status{display:none!important}.screen{padding-bottom:96px}.ns-icon{width:var(--ns-icon-md);height:var(--ns-icon-md);display:block;flex:0 0 auto}
.v17-top,.v17-simple-head.ns-three-col{min-height:var(--ns-header-h)!important;background:var(--color-primary)!important;color:#fff!important;border-radius:0 0 24px 24px!important;padding:12px 14px!important;display:grid!important;grid-template-columns:48px minmax(0,1fr) auto!important;gap:11px!important;align-items:center!important;box-shadow:0 6px 18px rgba(8,113,115,.18)!important;margin-bottom:16px!important}
.ns-head-logo{width:44px;height:44px;border-radius:12px;background:#fff;object-fit:contain;padding:3px;box-shadow:0 2px 6px rgba(0,0,0,.10)}.ns-logo-fallback{display:grid;place-items:center;color:var(--color-primary);font-weight:900}
.ns-head-center{min-width:0}.ns-head-title{font-size:17px;font-weight:800;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ns-head-user{font-size:13px;line-height:1.2;margin-top:4px;opacity:.94;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ns-sync-box{border:0;background:transparent;color:#fff;padding:4px 0 4px 8px;text-align:right;min-width:104px;font:inherit}.ns-sync-box.can-retry{cursor:pointer}.ns-sync-top{display:flex;align-items:center;justify-content:flex-end;gap:5px;font-size:12px;font-weight:800;white-space:nowrap}.ns-sync-top .ns-icon{width:15px;height:15px}.ns-sync-sub{font-size:10px;margin-top:3px;opacity:.95;white-space:nowrap}.ns-sync-box[data-state="error"] .ns-sync-top{color:#ffe1df}.ns-sync-box[data-state="offline"] .ns-sync-top{color:#fff3c4}.ns-sync-box[data-state="syncing"] .ns-icon{animation:ns-spin .8s linear infinite}
.bottom-nav{background:var(--color-surface)!important;border-top:1px solid var(--color-border)!important;box-shadow:0 -7px 20px rgba(15,23,42,.07)!important;padding:5px 0 calc(7px + env(safe-area-inset-bottom,0px))!important;min-height:66px!important}.bottom-nav button{min-height:54px!important;color:#7a8793!important;padding:6px 4px!important;gap:3px!important;transition:color .12s ease,background .12s ease!important}.bottom-nav button .nav-icon{width:34px;height:28px;display:grid;place-items:center;border-radius:9px}.bottom-nav button .nav-icon .ns-icon{width:22px;height:22px}.bottom-nav button.active{color:var(--color-primary)!important;font-weight:800!important}.bottom-nav button.active .nav-icon{background:rgba(8,113,115,.10)}
.v17-action>span:first-child,.v17-admin-card>span:first-child{display:grid!important;place-items:center!important}.v17-action>span:first-child .ns-icon,.v17-admin-card>span:first-child .ns-icon{width:22px;height:22px}.v17-event .ico .ns-icon{width:21px;height:21px}.ns-inline-event-icon{display:inline-flex;vertical-align:-4px;margin-right:6px;color:var(--color-primary)}
button:focus-visible,select:focus-visible,input:focus-visible,textarea:focus-visible{outline:3px solid rgba(8,113,115,.28)!important;outline-offset:2px!important}
@keyframes ns-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
@media(max-width:375px){.v17-top,.v17-simple-head.ns-three-col{grid-template-columns:44px minmax(0,1fr) auto!important;padding-left:10px!important;padding-right:10px!important}.ns-head-logo{width:42px;height:42px}.ns-head-title{font-size:16px}.ns-sync-box{min-width:92px}.ns-sync-sub{font-size:9px}}
@media(orientation:landscape) and (max-height:500px){.v17-top,.v17-simple-head.ns-three-col{min-height:64px!important;padding-top:8px!important;padding-bottom:8px!important}.ns-head-logo{width:40px;height:40px}}
`;
  document.head.appendChild(s);
}
function currentUser(){try{return window.Api&&Api.getCurrentUser?Api.getCurrentUser():null}catch(e){return null}}
function userName(){const u=currentUser();return u?.FULL_NAME||u?.full_name||u?.fullName||'Người dùng'}
function logoHtml(){const src=window.NGHI_SON_LOGO||'';return src?`<img class="ns-head-logo" src="${src}" alt="Logo Nghi Sơn">`:`<div class="ns-head-logo ns-logo-fallback" aria-hidden="true">NS</div>`}
function statusView(){
  if(state.syncing)return {key:'syncing',top:'Đang đồng bộ',sub:`${state.pending} bản ghi`,ico:'loader',retry:false};
  if(!navigator.onLine)return {key:'offline',top:'Offline',sub:state.pending?`Đã lưu trên máy · ${state.pending}`:'Đã lưu trên máy',ico:'cloudOff',retry:false};
  if(state.attention>0||state.lastError)return {key:'error',top:'Lỗi đồng bộ',sub:'Thử lại',ico:'circleAlert',retry:true};
  if(state.pending>0)return {key:'pending',top:'Online',sub:`${state.pending} bản ghi chờ`,ico:'cloud',retry:false};
  return {key:'synced',top:'Online',sub:'Đã đồng bộ',ico:'check',retry:false};
}
function statusHtml(){const v=statusView();return `<button type="button" class="ns-sync-box${v.retry?' can-retry':''}" data-state="${v.key}" ${v.retry?'aria-label="Lỗi đồng bộ. Thử đồng bộ lại"':'tabindex="-1" aria-label="'+v.top+'. '+v.sub+'"'}><span class="ns-sync-top">${icon(v.ico)}<span>${v.top}</span></span><span class="ns-sync-sub">${v.sub}</span></button>`}
function bindRetry(root){const b=root.querySelector('.ns-sync-box.can-retry');if(!b||b.dataset.bound)return;b.dataset.bound='1';b.onclick=async()=>{if(!window.OfflineQueue||!navigator.onLine)return;state.lastError=false;state.syncing=true;await refreshStatus();try{const r=await OfflineQueue.syncAll();state.lastError=!!r.failed}catch(e){state.lastError=true}finally{state.syncing=false;await refreshStatus()}}}
async function refreshCounts(){try{if(window.OfflineQueue){state.pending=await OfflineQueue.countPending();state.attention=await OfflineQueue.countAttention()}}catch(e){} }
async function refreshStatus(){await refreshCounts();document.querySelectorAll('.ns-sync-box').forEach(b=>{const v=statusView();b.dataset.state=v.key;b.classList.toggle('can-retry',v.retry);b.innerHTML=`<span class="ns-sync-top">${icon(v.ico)}<span>${v.top}</span></span><span class="ns-sync-sub">${v.sub}</span>`;if(v.retry){b.removeAttribute('tabindex');b.setAttribute('aria-label','Lỗi đồng bộ. Thử đồng bộ lại')}else{b.setAttribute('tabindex','-1');b.setAttribute('aria-label',`${v.top}. ${v.sub}`)}});document.querySelectorAll('.ns-sync-box').forEach(b=>bindRetry(b.parentElement||document));}
function headerFromTop(el){
  if(el.dataset.nsHeader==='1')return;
  const plate=(el.querySelector('.v17-plate')?.textContent||'').replace(/^[^\p{L}\p{N}]+/u,'').trim();
  const status=(el.querySelector('.v17-status small')?.textContent||'').trim();
  el.dataset.nsHeader='1';
  el.innerHTML=`${logoHtml()}<div class="ns-head-center"><div class="ns-head-title">Nhật ký vận hành</div><div class="ns-head-user">${userName()}</div></div>${statusHtml()}`;
  if(plate)el.dataset.nsAsset=plate;if(status)el.dataset.nsOldStatus=status;bindRetry(el);
}
function headerFromSimple(el){
  if(el.dataset.nsHeader==='1')return;
  const title=(el.querySelector('h2')?.textContent||'Nhật ký vận hành').trim();
  el.classList.add('ns-three-col');el.dataset.nsHeader='1';
  el.innerHTML=`${logoHtml()}<div class="ns-head-center"><div class="ns-head-title">${escapeHtml(title)}</div><div class="ns-head-user">${escapeHtml(userName())}</div></div>${statusHtml()}`;bindRetry(el);
}
function escapeHtml(v){const d=document.createElement('div');d.textContent=String(v||'');return d.innerHTML}
function navIcon(route){return route==='home'?'home':route==='history'?'clipboard':route==='operations-v2'?'settings':'user'}
function enhanceNav(){document.querySelectorAll('#bottom-nav button').forEach(b=>{const s=b.querySelector('.nav-icon');if(s&&s.dataset.vector!=='1'){s.innerHTML=icon(navIcon(b.dataset.route));s.dataset.vector='1'}})}
function actionIcon(text){const t=(text||'').toUpperCase();if(t.includes('ĐỔ DẦU'))return'fuel';if(t.includes('SỰ CỐ'))return t.includes('DỪNG')?'alert':'wrench';if(t.includes('BẮT ĐẦU'))return'play';if(t.includes('KẾT THÚC'))return'square';if(t.includes('XE')||t.includes('PHƯƠNG TIỆN'))return'truck';if(t.includes('MẬT KHẨU'))return'key';if(t.includes('NGƯỜI DÙNG'))return'users';if(t.includes('CHUYẾN')||t.includes('TUYẾN'))return'route';if(t.includes('CÔNG VIỆC')||t.includes('SỬA CHỮA'))return'wrench';if(t.includes('ĐĂNG XUẤT'))return'logOut';if(t.includes('ẢNH'))return'camera';if(t.includes('QUAY LẠI'))return'arrowLeft';if(t.includes('TẠO MỚI'))return'plus';return'chevronRight'}
function enhanceActions(){
  document.querySelectorAll('.v17-action,.v17-admin-card').forEach(b=>{if(b.dataset.vector==='1')return;const slot=b.querySelector('span:first-child');if(!slot)return;slot.innerHTML=icon(actionIcon(b.textContent));slot.dataset.decorative='1';b.dataset.vector='1'});
  document.querySelectorAll('.v17-event .ico').forEach(x=>{if(x.dataset.vector==='1')return;const card=x.closest('.v17-event');x.innerHTML=icon(actionIcon(card?.textContent||''));x.dataset.vector='1'});
  document.querySelectorAll('.v17-item h4').forEach(h=>{if(h.dataset.cleanIcon==='1')return;const txt=h.textContent||'';if(/^[\s\u{1F300}-\u{1FAFF}\u2600-\u27BF]/u.test(txt)){const clean=txt.replace(/^[\s\u{1F300}-\u{1FAFF}\u2600-\u27BF]+/u,'').trim();h.innerHTML=`<span class="ns-inline-event-icon">${icon(actionIcon(clean))}</span>${escapeHtml(clean)}`}h.dataset.cleanIcon='1'});
}
function enhanceCompactButtons(){document.querySelectorAll('.v17-small-btn,.btn-qr,.page-header .back-btn').forEach(b=>{if(b.dataset.vector==='1')return;const raw=(b.textContent||'').trim();const clean=raw.replace(/^[\s\u{1F300}-\u{1FAFF}\u2600-\u27BF]+/u,'').trim();if(clean!==raw){b.innerHTML=`<span aria-hidden="true" style="display:inline-flex;vertical-align:-4px;margin-right:6px">${icon(actionIcon(raw))}</span>${escapeHtml(clean)}`;}b.dataset.vector='1'})}
function enhanceAccount(){document.querySelectorAll('.ns-account-row').forEach(b=>{const slot=b.querySelector('.ns-row-icon');if(!slot||slot.dataset.vector==='1')return;slot.innerHTML=icon(actionIcon(b.textContent));slot.dataset.vector='1'})}
let scheduled=false;
function apply(){scheduled=false;injectCss();enhanceNav();document.querySelectorAll('.v17-top').forEach(headerFromTop);document.querySelectorAll('.v17-simple-head').forEach(headerFromSimple);enhanceActions();enhanceCompactButtons();enhanceAccount();refreshStatus();}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(apply)}
function wrapOfflineQueue(){if(!window.OfflineQueue||OfflineQueue.__nsWrapped)return;OfflineQueue.__nsWrapped=true;const enqueue=OfflineQueue.enqueue.bind(OfflineQueue),syncAll=OfflineQueue.syncAll.bind(OfflineQueue);OfflineQueue.enqueue=async(...a)=>{const r=await enqueue(...a);await refreshStatus();return r};OfflineQueue.syncAll=async(...a)=>{state.syncing=true;state.lastError=false;await refreshStatus();try{const r=await syncAll(...a);state.lastError=!!r.failed;return r}catch(e){state.lastError=true;throw e}finally{state.syncing=false;await refreshStatus()}}}
function boot(){injectCss();wrapOfflineQueue();schedule();const root=document.getElementById('screen')||document.body;new MutationObserver(m=>{if(m.some(x=>x.addedNodes.length))schedule()}).observe(root,{childList:true,subtree:true});window.addEventListener('online',()=>{state.lastError=false;schedule()});window.addEventListener('offline',schedule);document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();