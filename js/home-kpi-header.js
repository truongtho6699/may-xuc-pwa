// Header cố định + KPI Trang chủ cho DRIVER / OPERATOR.
(function(){
'use strict';
if(window.__NS_HOME_KPI_HEADER)return;window.__NS_HOME_KPI_HEADER=true;
const HISTORY_API='https://dnqhikwqihfxvezqzqzn.supabase.co/functions/v1/nghi-son-history-api';
let scheduled=false,loading=false,lastLoad=0;
function user(){try{return typeof Api!=='undefined'&&Api?.getCurrentUser?Api.getCurrentUser():null}catch(e){return null}}
function key(){return 'ns_home_kpi_'+(user()?.PROFILE_ID||'user')}
function getCache(){try{return JSON.parse(localStorage.getItem(key())||'null')}catch(e){return null}}
function setCache(v){try{localStorage.setItem(key(),JSON.stringify(v))}catch(e){}}
function esc(v){const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML}
function name(){const u=user();return u?.FULL_NAME||u?.full_name||u?.fullName||u?.NAME||u?.name||'Người dùng'}
function css(){if(document.getElementById('ns-home-kpi-header-css'))return;const s=document.createElement('style');s.id='ns-home-kpi-header-css';s.textContent=`
.ns-home-kpis{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:2px 0 14px}.ns-home-kpi{background:#fff;border:1px solid #dfe7ea;border-radius:14px;padding:12px 13px;min-height:78px;display:flex;flex-direction:column;justify-content:center}.ns-home-kpi b{font-size:23px;line-height:1.05;color:#087173;letter-spacing:-.3px}.ns-home-kpi span{margin-top:6px;font-size:12px;font-weight:750;color:#667085}.ns-home-kpis[data-role="OPERATOR"] .ns-home-kpi:first-child b{color:#0f766e}.ns-home-kpi-loading b{color:#98a2b3!important}
@media(max-width:360px){.ns-home-kpi{padding:11px 10px}.ns-home-kpi b{font-size:21px}.ns-home-kpi span{font-size:11px}}
`;document.head.appendChild(s)}
function fixHeaders(){const uname=esc(name());document.querySelectorAll('.ns-head-title').forEach(x=>{if(x.textContent!=='Nhật ký vận hành')x.textContent='Nhật ký vận hành'});document.querySelectorAll('.ns-head-user').forEach(x=>{if(x.textContent!==name())x.textContent=name()});
// Trường hợp header chưa được theme chuyển đổi xong, đổi subtitle của header đơn giản thành tên người dùng.
document.querySelectorAll('.v17-simple-head').forEach(h=>{const p=h.querySelector('p');if(p&&!h.querySelector('.ns-head-user'))p.textContent=name()});
}
function isHome(){return !!document.querySelector('#bottom-nav button[data-route="home"].active')}
function mountKpis(){const u=user();if(!u||!isHome()||!['DRIVER','OPERATOR'].includes(u.ROLE))return;const anchor=document.querySelector('#screen .ns-home-asset');if(!anchor)return;let host=document.querySelector('#screen .ns-home-kpis');if(!host){host=document.createElement('div');host.className='ns-home-kpis';anchor.insertAdjacentElement('afterend',host)}host.dataset.role=u.ROLE;renderKpis(host,getCache(),u.ROLE)}
function renderKpis(host,data,role){if(!host)return;const fresh=data&&data.date===new Date().toISOString().slice(0,10);if(!fresh){host.innerHTML=role==='DRIVER'?`<div class="ns-home-kpi ns-home-kpi-loading"><b>—</b><span>Chuyến hôm nay</span></div><div class="ns-home-kpi ns-home-kpi-loading"><b>—</b><span>Sự kiện hôm nay</span></div>`:`<div class="ns-home-kpi ns-home-kpi-loading"><b>—</b><span>Giờ máy hôm nay</span></div><div class="ns-home-kpi ns-home-kpi-loading"><b>—</b><span>Sự kiện hôm nay</span></div>`;return}if(role==='DRIVER'){host.innerHTML=`<div class="ns-home-kpi"><b>${Number(data.trips||0).toLocaleString('vi-VN')}</b><span>Chuyến hôm nay</span></div><div class="ns-home-kpi"><b>${Number(data.events||0).toLocaleString('vi-VN')}</b><span>Sự kiện hôm nay</span></div>`}else{host.innerHTML=`<div class="ns-home-kpi"><b>${Number(data.hours||0).toLocaleString('vi-VN',{maximumFractionDigits:1})}</b><span>Giờ máy hôm nay</span></div><div class="ns-home-kpi"><b>${Number(data.events||0).toLocaleString('vi-VN')}</b><span>Sự kiện hôm nay</span></div>`}}
async function load(force){const u=user();if(!u||!['DRIVER','OPERATOR'].includes(u.ROLE)||!navigator.onLine||loading)return;if(!force&&Date.now()-lastLoad<30000)return;loading=true;lastLoad=Date.now();try{const q=new URLSearchParams({action:'history',token:localStorage.getItem('auth_token')||'',range:'today',type:'all'});const r=await fetch(HISTORY_API+'?'+q.toString());const j=await r.json();if(!j?.success)return;const ev=j.data?.events||[];const trips=ev.filter(x=>x.type==='trip').length;const hours=ev.filter(x=>x.type==='shift').reduce((s,x)=>s+Number(x.hours||0),0);const events=ev.filter(x=>x.type==='fuel'||x.type==='issue').length;const data={date:new Date().toISOString().slice(0,10),trips,hours:Number(hours.toFixed(1)),events,updatedAt:Date.now()};setCache(data);const host=document.querySelector('#screen .ns-home-kpis');if(host)renderKpis(host,data,u.ROLE)}catch(e){}finally{loading=false}}
function apply(){scheduled=false;css();fixHeaders();mountKpis();if(isHome())load(false)}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(apply)}
function boot(){apply();setTimeout(()=>load(true),350);const root=document.getElementById('screen')||document.body;new MutationObserver(m=>{if(m.some(x=>x.addedNodes?.length))schedule()}).observe(root,{childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target.closest?.('#bottom-nav button[data-route="home"]'))setTimeout(()=>{schedule();load(true)},80)},true);window.addEventListener('online',()=>setTimeout(()=>load(true),250));document.addEventListener('visibilitychange',()=>{if(!document.hidden){schedule();if(isHome())load(true)}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
