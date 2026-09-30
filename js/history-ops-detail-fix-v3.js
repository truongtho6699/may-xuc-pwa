// Fix V3: 1 hàng KPI trong Nhật ký + nút Chi tiết chắc chắn cho Nhật ký/Vận hành.
(function(){
'use strict';
if(window.__NS_HISTORY_OPS_DETAIL_FIX_V3)return;window.__NS_HISTORY_OPS_DETAIL_FIX_V3=true;
const API='https://dnqhikwqihfxvezqzqzn.supabase.co/functions/v1/nghi-son-history-api';
let cache=null,cacheAt=0,timer=null,busy=false;
function token(){return localStorage.getItem('auth_token')||''}
function kind(t){t=(t||'').toLowerCase();if(t.includes('sửa chữa'))return'repair';if(t.includes('sự cố'))return'issue';if(t.includes('đổ dầu'))return'fuel';if(t.includes('chuyến'))return'trip';if(t.includes('ca máy')||/^ca\s/.test(t.trim()))return'shift';return''}
function cleanTitle(card){return (card.querySelector('h4')?.textContent||card.querySelector('.ns-event-title')?.textContent||'').replace(/chi tiết/ig,'').replace(/^[\s\u{1F300}-\u{1FAFF}\u2600-\u27BF]+/u,'').trim()}
function parseTime(card){const s=(card.querySelector('time')?.textContent||card.querySelector('small')?.textContent||'').trim();if(!s)return null;const m=s.match(/(\d{1,2}):(\d{2})\s+(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?/);if(!m)return null;let y=m[5]?Number(m[5]):new Date().getFullYear();if(y<100)y+=2000;return new Date(y,Number(m[4])-1,Number(m[3]),Number(m[1]),Number(m[2])).getTime()}
async function events(){if(cache&&Date.now()-cacheAt<15000)return cache;const q=new URLSearchParams({action:'history',range:'all',type:'all',token:token()});const r=await fetch(API+'?'+q.toString());const j=await r.json();if(!j.success)throw new Error(j.message||'Không tải được dữ liệu.');cache=j.data?.events||[];cacheAt=Date.now();return cache}
function css(){if(document.getElementById('ns-history-ops-detail-fix-v3-css'))return;const s=document.createElement('style');s.id='ns-history-ops-detail-fix-v3-css';s.textContent=`
/* Chỉ giữ hàng KPI mới ở Nhật ký, bỏ hàng thống kê cũ phía dưới */
#hist-body>.ns-h-stat{display:none!important}
/* Nút Chi tiết rõ ràng ở góc phải */
#hist-body .ns-v3-detail-host,#ops-list .ns-v3-detail-host{position:relative!important}
#hist-body .ns-v3-detail-host h4,#ops-list .ns-v3-detail-host h4{padding-right:68px!important}
.ns-v3-detail-btn{position:absolute!important;right:13px!important;top:12px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:54px!important;height:28px!important;padding:0 6px!important;border:0!important;border-radius:8px!important;background:#eef8f7!important;color:#087173!important;font-size:12.5px!important;font-weight:900!important;line-height:1!important;z-index:30!important;opacity:1!important;visibility:visible!important;cursor:pointer!important}
.ns-v3-detail-btn:active{background:#dff1ef!important;transform:scale(.97)}
#ops-list .v17-event,#ops-list .v17-item{position:relative!important}
@media(max-width:390px){.ns-v3-detail-btn{right:10px!important;top:10px!important;min-width:52px!important}.ns-v3-detail-host h4{padding-right:64px!important}}
`;document.head.appendChild(s)}
function bestMatch(card,all,used){const k=card.dataset.hType||kind(card.textContent);if(!k)return null;const explicit=card.dataset.hId||card.dataset.id||'';if(explicit)return {id:explicit,type:k};const title=cleanTitle(card),ct=parseTime(card);let cand=all.map((e,i)=>({e,i})).filter(x=>!used.has(x.i)&&x.e.type===k);if(title){const exact=cand.filter(x=>String(x.e.title||'').trim()===title);if(exact.length)cand=exact}
 if(ct!=null&&cand.length>1)cand.sort((a,b)=>Math.abs(new Date(a.e.time||0).getTime()-ct)-Math.abs(new Date(b.e.time||0).getTime()-ct));const pick=cand[0];if(!pick)return null;used.add(pick.i);return {id:pick.e.id,type:pick.e.type}}
function addButton(card,m){if(!card||!m?.id)return;card.classList.add('ns-v3-detail-host');let b=card.querySelector(':scope > .ns-v3-detail-btn');if(!b){b=document.createElement('button');b.type='button';b.className='ns-v3-detail-btn ns-detail-btn';b.textContent='Chi tiết';card.appendChild(b)}b.dataset.id=m.id;b.dataset.type=m.type;b.setAttribute('aria-label','Xem chi tiết '+m.type)}
async function apply(){if(busy)return;busy=true;try{css();document.querySelectorAll('#hist-body>.ns-h-stat').forEach(x=>x.remove());const cards=[...document.querySelectorAll('#hist-body .ns-h-card,#hist-body .v17-event,#hist-body .v17-item,#ops-list .v17-event,#ops-list .v17-item')].filter(x=>kind(x.textContent));if(!cards.length)return;const all=await events();const used=new Set();for(const c of cards){const existingId=c.dataset.hId||c.dataset.id||c.querySelector(':scope > .ns-v3-detail-btn')?.dataset.id||'';const m=existingId?{id:existingId,type:c.dataset.hType||kind(c.textContent)}:bestMatch(c,all,used);if(m)addButton(c,m)}}catch(e){}finally{busy=false}}
function schedule(){clearTimeout(timer);timer=setTimeout(apply,90)}
function boot(){apply();new MutationObserver(m=>{if(m.some(x=>x.addedNodes?.length))schedule()}).observe(document.getElementById('screen')||document.body,{childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target.closest?.('#bottom-nav button,.ops-filter,#ops-more'))setTimeout(apply,120)},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
