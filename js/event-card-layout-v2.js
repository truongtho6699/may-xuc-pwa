// Chuẩn hóa màu icon và layout card Chuyến / Đổ dầu / Sự cố / Sửa chữa.
(function(){
'use strict';
if(window.__NS_EVENT_CARD_LAYOUT_V2)return;window.__NS_EVENT_CARD_LAYOUT_V2=true;
let scheduled=false;
function svg(kind){
  const p={
    trip:'<path d="M10 17h4V5H2v12h3"/><path d="M14 8h4l4 4v5h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/>',
    fuel:'<path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/><path d="M2 22h14M6 7h6M19 8l3 3v7a2 2 0 0 1-4 0v-5a2 2 0 0 0-2-2h-1"/>',
    issue:'<path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4Z"/>',
    repair:'<path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4Z"/><path d="M18 14v7M14.5 17.5h7"/>'
  }[kind]||'';
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}
function kindFrom(card){const t=(card.textContent||'').toLowerCase();if(t.includes('sửa chữa'))return'repair';if(t.includes('sự cố'))return'issue';if(t.includes('đổ dầu'))return'fuel';if(t.includes('chuyến'))return'trip';return''}
function css(){if(document.getElementById('ns-event-card-layout-v2-css'))return;const s=document.createElement('style');s.id='ns-event-card-layout-v2-css';s.textContent=`
/* Màu icon rõ hơn */
.ns-event-trip .ico,.ns-card-icon.trip{color:#2563eb!important;background:#eaf2ff!important}
.ns-event-fuel .ico,.ns-card-icon.fuel{color:#087173!important;background:#e7f7f2!important}
.ns-event-issue .ico,.ns-card-icon.issue{color:#c45b12!important;background:#fff0e5!important}
.ns-event-repair .ico,.ns-card-icon.repair{color:#7c3aed!important;background:#f3ecff!important}
.v17-event .ico{width:54px!important;height:54px!important;border-radius:15px!important;display:grid!important;place-items:center!important}.v17-event .ico svg{width:25px!important;height:25px!important;stroke:currentColor!important}.v17-event{grid-template-columns:54px minmax(0,1fr) auto!important;gap:14px!important;align-items:center!important}.v17-event h4{font-size:17px!important;line-height:1.25!important}.v17-event p{font-size:15px!important;margin-top:3px!important}.v17-event time{font-size:13px!important;color:#667085!important}
/* Sự cố / Sửa chữa cùng layout 3 dòng */
.v17-item.ns-maint-card{display:grid!important;grid-template-columns:56px minmax(0,1fr)!important;column-gap:14px!important;row-gap:3px!important;align-items:start!important;padding:15px!important}.v17-item.ns-maint-card .ns-card-icon{grid-column:1;grid-row:1/5;width:56px;height:56px;border-radius:15px;display:grid;place-items:center}.v17-item.ns-maint-card .ns-card-icon svg{width:27px;height:27px}.v17-item.ns-maint-card h4{grid-column:2;margin:0!important;font-size:17px!important;line-height:1.28!important;color:#17212b!important}.v17-item.ns-maint-card>.ns-maint-desc{grid-column:2;font-size:15px!important;color:#475467!important;line-height:1.35!important;margin-top:2px}.v17-item.ns-maint-card>.ns-maint-meta{grid-column:2;font-size:13px!important;color:#667085!important;line-height:1.3!important;margin-top:2px}.v17-item.ns-maint-card>small{display:none!important}.v17-item.ns-maint-card>.v17-inline{grid-column:1/-1;margin-top:10px!important}.v17-item.ns-maint-card.ns-event-issue h4{color:#b45309!important}.v17-item.ns-maint-card.ns-event-repair h4{color:#6d28d9!important}
@media(max-width:375px){.v17-event{grid-template-columns:50px minmax(0,1fr)!important}.v17-event time{grid-column:2!important;margin-top:2px}.v17-item.ns-maint-card{grid-template-columns:52px minmax(0,1fr)!important}.v17-item.ns-maint-card .ns-card-icon{width:52px;height:52px}}
`;document.head.appendChild(s)}
function normalizeMaint(card,kind){if(card.dataset.nsLayoutV2==='1')return;card.dataset.nsLayoutV2='1';card.classList.add('ns-maint-card','ns-event-'+kind);
  const h=card.querySelector('h4'); if(!h)return;
  h.textContent=h.textContent.replace(/^[\s\u{1F300}-\u{1FAFF}\u2600-\u27BF]+/u,'').trim();
  const icon=document.createElement('div');icon.className='ns-card-icon '+kind;icon.innerHTML=svg(kind);card.insertBefore(icon,h);
  const children=[...card.children];
  const desc=children.find(x=>x.tagName==='DIV'&&!x.classList.contains('ns-card-icon')&&!x.classList.contains('v17-inline')&&!/trạng thái:/i.test(x.textContent||'')); if(desc)desc.classList.add('ns-maint-desc');
  const st=children.find(x=>x.tagName==='DIV'&&/trạng thái:/i.test(x.textContent||''));
  const sm=card.querySelector('small');
  if(st){let status=(st.textContent||'').replace(/trạng thái:\s*/i,'').trim();const time=(sm?.textContent||'').trim();st.className='ns-maint-meta';st.textContent=[status,time].filter(Boolean).join(' · ')}
}
function normalizeEvents(){document.querySelectorAll('.v17-event').forEach(card=>{const k=kindFrom(card);if(k){card.classList.add('ns-event-'+k);const ico=card.querySelector('.ico');if(ico&&ico.dataset.nsSvgV2!=='1'){ico.dataset.nsSvgV2='1';ico.innerHTML=svg(k)}}});document.querySelectorAll('.v17-item').forEach(card=>{const k=kindFrom(card);if(k==='issue'||k==='repair')normalizeMaint(card,k)})}
function apply(){scheduled=false;css();normalizeEvents()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(apply)}
function boot(){apply();const root=document.getElementById('screen')||document.body;new MutationObserver(m=>{if(m.some(x=>x.addedNodes?.length))schedule()}).observe(root,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
