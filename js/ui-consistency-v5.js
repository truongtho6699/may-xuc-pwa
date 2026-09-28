// Chuẩn hóa màu danh sách Nhật ký/Vận hành và rút gọn menu Sự cố.
(function(){
'use strict';
if(window.__NS_UI_CONSISTENCY_V5)return;window.__NS_UI_CONSISTENCY_V5=true;
let scheduled=false;
const C={trip:'#2563eb',fuel:'#087173',issue:'#c45b12',repair:'#7c3aed',shift:'#0f766e'};
const B={trip:'#eaf2ff',fuel:'#e7f7f2',issue:'#fff0e5',repair:'#f3ecff',shift:'#ecfeff'};
function kind(t){t=(t||'').toLowerCase();if(t.includes('sửa chữa'))return'repair';if(t.includes('sự cố'))return'issue';if(t.includes('đổ dầu'))return'fuel';if(t.includes('chuyến'))return'trip';if(t.includes('ca máy')||/^ca\s/.test(t.trim()))return'shift';return''}
function svg(k){const p={trip:'<path d="M10 17h4V5H2v12h3"/><path d="M14 8h4l4 4v5h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/>',fuel:'<path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/><path d="M2 22h14M6 7h6M19 8l3 3v7a2 2 0 0 1-4 0v-5a2 2 0 0 0-2-2h-1"/>',issue:'<path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4Z"/>',repair:'<path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4Z"/><path d="M18 14v7M14.5 17.5h7"/>',shift:'<circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>'}[k]||'';return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${p}</svg>`}
function css(){if(document.getElementById('ns-ui-consistency-v5-css'))return;const s=document.createElement('style');s.id='ns-ui-consistency-v5-css';s.textContent=`
/* Ép màu nghiệp vụ ở mọi list card, kể cả list Nhật ký cũ */
.ns-v5-trip .ns-v5-title{color:${C.trip}!important}.ns-v5-fuel .ns-v5-title{color:${C.fuel}!important}.ns-v5-issue .ns-v5-title{color:${C.issue}!important}.ns-v5-repair .ns-v5-title{color:${C.repair}!important}.ns-v5-shift .ns-v5-title{color:${C.shift}!important}
.ns-v5-trip .ns-v5-icon{color:${C.trip}!important;background:${B.trip}!important}.ns-v5-fuel .ns-v5-icon{color:${C.fuel}!important;background:${B.fuel}!important}.ns-v5-issue .ns-v5-icon{color:${C.issue}!important;background:${B.issue}!important}.ns-v5-repair .ns-v5-icon{color:${C.repair}!important;background:${B.repair}!important}.ns-v5-shift .ns-v5-icon{color:${C.shift}!important;background:${B.shift}!important}
.ns-v5-icon{display:grid!important;place-items:center!important;border-radius:14px!important}.ns-v5-icon svg{width:24px!important;height:24px!important;stroke:currentColor!important}
/* Menu Vận hành */
.ns-ops-menu #all-fuel>span:nth-child(2){color:${C.fuel}!important}.ns-ops-menu #all-issue>span:nth-child(2){color:${C.issue}!important}.ns-ops-menu #all-fuel .ico{color:${C.fuel}!important;background:${B.fuel}!important}.ns-ops-menu #all-issue .ico{color:${C.issue}!important;background:${B.issue}!important}.ns-ops-menu #all-fuel .arr{color:${C.fuel}!important}.ns-ops-menu #all-issue .arr{color:${C.issue}!important}
`;document.head.appendChild(s)}
function findTitle(card){return card.querySelector('h4,.ns-event-title,strong,.title,.event-title')}
function findIcon(card){return card.querySelector('.ico,.ns-card-icon,.event-icon,.icon')}
function normalizeCard(card){const title=findTitle(card);if(!title)return;const k=kind(title.textContent||card.textContent);if(!k)return;['trip','fuel','issue','repair','shift'].forEach(x=>card.classList.remove('ns-v5-'+x));card.classList.add('ns-v5-'+k);title.classList.add('ns-v5-title');title.style.color=C[k];let icon=findIcon(card);if(icon){icon.classList.add('ns-v5-icon');icon.style.color=C[k];icon.style.background=B[k];icon.innerHTML=svg(k)}
 const p=card.querySelector('p');if(k==='trip'&&p){const t=(p.textContent||'').replace(/\s+/g,' ').trim();if(!t||t==='→'||t==='->')p.textContent='Chưa có thông tin tuyến'}
}
function normalizeLists(){
 const scope=document.getElementById('screen')||document;
 const cards=new Set();
 scope.querySelectorAll('.v17-event,.v17-item,.v17-card,article,li').forEach(el=>{const t=findTitle(el);if(t&&kind(t.textContent||el.textContent))cards.add(el)});
 scope.querySelectorAll('h4,.ns-event-title,strong,.title,.event-title').forEach(t=>{if(!kind(t.textContent))return;const card=t.closest('.v17-event,.v17-item,.v17-card,article,li');if(card)cards.add(card)});
 cards.forEach(normalizeCard);
}
function normalizeMenu(){const f=document.getElementById('all-fuel'),i=document.getElementById('all-issue');if(f){const x=f.querySelector('.ico');if(x){x.classList.add('ns-v5-icon');x.innerHTML=svg('fuel')}const lab=[...f.children].find(x=>!x.classList.contains('ico')&&!x.classList.contains('arr'));if(lab){lab.textContent='Đổ dầu';lab.style.color=C.fuel}}
 if(i){const x=i.querySelector('.ico');if(x){x.classList.add('ns-v5-icon');x.innerHTML=svg('issue')}const lab=[...i.children].find(x=>!x.classList.contains('ico')&&!x.classList.contains('arr'));if(lab){lab.textContent='Sự cố';lab.style.color=C.issue}}
}
function apply(){scheduled=false;css();normalizeMenu();normalizeLists()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(apply)}
function boot(){apply();const root=document.getElementById('screen')||document.body;new MutationObserver(m=>{if(m.some(x=>x.addedNodes?.length))schedule()}).observe(root,{childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target.closest?.('#bottom-nav button,.ops-filter,#all-fuel,#all-issue'))setTimeout(schedule,80)},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
