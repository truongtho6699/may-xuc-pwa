// Đồng dạng icon, màu, button và list giữa Nhật ký / Vận hành.
(function(){
'use strict';
if(window.__NS_UI_CONSISTENCY_V3)return;window.__NS_UI_CONSISTENCY_V3=true;
let scheduled=false;
const COLORS={trip:'#2563eb',fuel:'#087173',issue:'#c45b12',repair:'#7c3aed',shift:'#0f766e'};
const BGS={trip:'#eaf2ff',fuel:'#e7f7f2',issue:'#fff0e5',repair:'#f3ecff',shift:'#ecfeff'};
function svg(kind){
 const p={
  trip:'<path d="M10 17h4V5H2v12h3"/><path d="M14 8h4l4 4v5h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/>',
  fuel:'<path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/><path d="M2 22h14M6 7h6M19 8l3 3v7a2 2 0 0 1-4 0v-5a2 2 0 0 0-2-2h-1"/>',
  issue:'<path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4Z"/>',
  repair:'<path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4Z"/><path d="M18 14v7M14.5 17.5h7"/>',
  shift:'<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="4"/>'
 }[kind]||'';
 return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${p}</svg>`;
}
function kindFromText(t){t=(t||'').toLowerCase();if(t.includes('sửa chữa'))return'repair';if(t.includes('sự cố'))return'issue';if(t.includes('đổ dầu'))return'fuel';if(t.includes('chuyến'))return'trip';if(t.includes('ca máy')||/^ca\s/.test(t.trim()))return'shift';return''}
function injectCss(){if(document.getElementById('ns-ui-consistency-v3-css'))return;const s=document.createElement('style');s.id='ns-ui-consistency-v3-css';s.textContent=`
/* Màu nghiệp vụ dùng chung */
.ns-event-trip h4,.ns-event-trip .ns-event-title{color:${COLORS.trip}!important}.ns-event-fuel h4,.ns-event-fuel .ns-event-title{color:${COLORS.fuel}!important}.ns-event-issue h4,.ns-event-issue .ns-event-title{color:${COLORS.issue}!important}.ns-event-repair h4,.ns-event-repair .ns-event-title{color:${COLORS.repair}!important}.ns-event-shift h4,.ns-event-shift .ns-event-title{color:${COLORS.shift}!important}
.ns-event-trip .ico,.ns-event-trip .ns-card-icon{color:${COLORS.trip}!important;background:${BGS.trip}!important}.ns-event-fuel .ico,.ns-event-fuel .ns-card-icon{color:${COLORS.fuel}!important;background:${BGS.fuel}!important}.ns-event-issue .ico,.ns-event-issue .ns-card-icon{color:${COLORS.issue}!important;background:${BGS.issue}!important}.ns-event-repair .ico,.ns-event-repair .ns-card-icon{color:${COLORS.repair}!important;background:${BGS.repair}!important}.ns-event-shift .ico,.ns-event-shift .ns-card-icon{color:${COLORS.shift}!important;background:${BGS.shift}!important}
.v17-event .ico,.ns-card-icon{display:grid!important;place-items:center!important;border-radius:15px!important}.v17-event .ico svg,.ns-card-icon svg{width:26px!important;height:26px!important;stroke:currentColor!important}
/* List Nhật ký đồng dạng 3 dòng */
.v17-event{grid-template-columns:54px minmax(0,1fr)!important;gap:14px!important;align-items:center!important;padding:15px!important;min-height:92px!important}.v17-event .ico{width:54px!important;height:54px!important;grid-row:1/4!important}.v17-event>div:nth-child(2){min-width:0!important}.v17-event h4{font-size:17px!important;line-height:1.28!important;margin:0 0 3px!important;font-weight:850!important}.v17-event p{font-size:15px!important;line-height:1.35!important;color:#475467!important;margin:0!important}.v17-event time{grid-column:2!important;font-size:13px!important;color:#667085!important;margin-top:3px!important;white-space:normal!important}
/* Sự cố / sửa chữa */
.v17-item.ns-maint-card{border-radius:18px!important;padding:15px!important}.v17-item.ns-maint-card h4{font-size:17px!important;font-weight:850!important}.v17-item.ns-maint-card .ns-maint-desc{font-size:15px!important;color:#475467!important}.v17-item.ns-maint-card .ns-maint-meta{font-size:13px!important;color:#667085!important}
/* Menu Vận hành: 1 icon, chữ theo nghiệp vụ */
.ns-ops-menu button{min-height:72px!important;grid-template-columns:48px minmax(0,1fr) 24px!important;font-size:18px!important;font-weight:850!important}.ns-ops-menu .ico{width:44px!important;height:44px!important;border-radius:13px!important;display:grid!important;place-items:center!important}.ns-ops-menu .ico svg{width:25px!important;height:25px!important}.ns-ops-menu #all-fuel{color:${COLORS.fuel}!important}.ns-ops-menu #all-fuel .ico{background:${BGS.fuel}!important;color:${COLORS.fuel}!important}.ns-ops-menu #all-issue{color:${COLORS.issue}!important}.ns-ops-menu #all-issue .ico{background:${BGS.issue}!important;color:${COLORS.issue}!important}.ns-ops-menu .arr{color:currentColor!important}
/* Button/chip đồng dạng */
.ops-filter,.v17-small-btn{min-height:46px!important;border-radius:13px!important;font-weight:800!important;padding:10px 14px!important}.ops-filter:active,.v17-small-btn:active,.ns-ops-menu button:active{transform:scale(.985)}
.v17-action{min-height:58px!important;border-radius:16px!important;font-weight:850!important}.v17-action svg{width:23px!important;height:23px!important}.v17-action.start{background:#159447!important;color:#fff!important;border-color:#159447!important}.v17-action.stop{background:#d9473f!important;color:#fff!important;border-color:#d9473f!important}
/* tránh icon bị lặp trong tiêu đề */
.v17-item h4 .ns-inline-event-icon,.v17-item h4>svg,.v17-item h4>.ico{display:none!important}
@media(max-width:375px){.v17-event{grid-template-columns:50px minmax(0,1fr)!important;gap:12px!important}.v17-event .ico{width:50px!important;height:50px!important}.ns-ops-menu button{font-size:17px!important}}
`;document.head.appendChild(s)}
function normalizeEvent(card){const k=kindFromText(card.textContent);if(!k)return;['trip','fuel','issue','repair','shift'].forEach(x=>card.classList.remove('ns-event-'+x));card.classList.add('ns-event-'+k);const ico=card.querySelector('.ico');if(ico){ico.innerHTML=svg(k);ico.setAttribute('aria-hidden','true')}const h=card.querySelector('h4');if(h){h.querySelectorAll('.ns-inline-event-icon,svg,.ico').forEach(x=>x.remove());h.textContent=h.textContent.replace(/^[\s\u{1F300}-\u{1FAFF}\u2600-\u27BF]+/u,'').trim();h.classList.add('ns-event-title')}const p=card.querySelector('p');if(k==='trip'&&p){const t=(p.textContent||'').replace(/\s+/g,' ').trim();if(!t||t==='→'||t==='->'||/^→\s*$/.test(t))p.textContent='Chưa có thông tin tuyến'}}
function normalizeMaint(card){const k=kindFromText(card.textContent);if(!['issue','repair'].includes(k))return;card.classList.add('ns-event-'+k);const h=card.querySelector('h4');if(h){h.querySelectorAll('.ns-inline-event-icon,svg,.ico').forEach(x=>x.remove());h.textContent=h.textContent.replace(/^[\s\u{1F300}-\u{1FAFF}\u2600-\u27BF]+/u,'').trim();h.classList.add('ns-event-title')}
 // nếu lớp v2 chưa thêm icon thì bổ sung đúng 1 icon
 if(!card.querySelector(':scope > .ns-card-icon')){const i=document.createElement('div');i.className='ns-card-icon '+k;i.innerHTML=svg(k);card.insertBefore(i,card.firstChild)}
}
function normalizeOpsMenu(){const f=document.getElementById('all-fuel'),i=document.getElementById('all-issue');if(f){const ico=f.querySelector('.ico');if(ico)ico.innerHTML=svg('fuel')}if(i){const ico=i.querySelector('.ico');if(ico)ico.innerHTML=svg('issue');const label=[...i.children].find(x=>!x.classList.contains('ico')&&!x.classList.contains('arr'));if(label)label.textContent='Ghi nhận sự cố'}}
function apply(){scheduled=false;injectCss();document.querySelectorAll('.v17-event').forEach(normalizeEvent);document.querySelectorAll('.v17-item').forEach(normalizeMaint);normalizeOpsMenu()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(apply)}
function boot(){apply();const root=document.getElementById('screen')||document.body;new MutationObserver(m=>{if(m.some(x=>x.addedNodes?.length))schedule()}).observe(root,{childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target.closest?.('#bottom-nav button'))setTimeout(schedule,50)},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
