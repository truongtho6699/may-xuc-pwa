(function(){
const ADMIN_URL='https://dnqhikwqihfxvezqzqzn.supabase.co/functions/v1/nghi-son-admin-api';
const USERS_URL='https://dnqhikwqihfxvezqzqzn.supabase.co/functions/v1/nghi-son-users-api';
function t(){return localStorage.getItem('auth_token')||''}
function endpoint(action){return action==='users'||action.indexOf('user/')===0?USERS_URL:ADMIN_URL}
async function g(a,p){p=p||{};p.action=a;p.token=t();const r=await fetch(endpoint(a)+'?'+new URLSearchParams(p));const j=await r.json();if(!j.success){const e=new Error(j.message||'Có lỗi xảy ra');e.code=j.errorCode||'API_ERROR';throw e}return j.data}
async function p(a,b){b=b||{};b.token=t();const r=await fetch(endpoint(a)+'?action='+encodeURIComponent(a),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});const j=await r.json();if(!j.success){const e=new Error(j.message||'Có lỗi xảy ra');e.code=j.errorCode||'API_ERROR';throw e}return j.data}
if(window.Api&&Api.get){const old=Api.get.bind(Api);Api.get=async function(a,p1){if(a==='dashboard')return g('dashboard');return old(a,p1)}}
function admin(){const u=Api.getCurrentUser&&Api.getCurrentUser();return u&&(u.ROLE==='ADMIN'||u.ROLE==='OWNER')}
function panel(title,html){document.getElementById('admin-panel')?.remove();const d=document.createElement('div');d.id='admin-panel';d.style.cssText='position:fixed;inset:0;z-index:9999;background:#f5f7f9;overflow:auto;padding:16px 14px 90px';d.innerHTML='<div style="max-width:620px;margin:auto"><button id="adm-back" style="border:0;background:none;font-size:26px">←</button><h2>'+title+'</h2>'+html+'</div>';document.body.appendChild(d);d.querySelector('#adm-back').onclick=()=>d.remove();return d}
window.NSAdmin={apiGet:g,apiPost:p,panel:panel};
function inject(){
  if(!admin())return;
  const accountActive=document.querySelector('#bottom-nav button[data-route="account"].active');
  if(!accountActive){document.getElementById('admin-actions')?.remove();return}
  if(document.getElementById('admin-actions'))return;
  const card=document.querySelector('.account-card');
  if(!card)return;
  const d=document.createElement('div');
  d.id='admin-actions';
  d.style.cssText='margin:14px 14px 18px;background:white;border-radius:14px;padding:14px;box-shadow:0 1px 4px rgba(0,0,0,.06)';
  d.innerHTML='<div style="font-weight:800;margin-bottom:10px">Quản trị hệ thống</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><button id="adm-trip">🚚 TẠO CHUYẾN</button><button id="adm-car">➕ THÊM XE/MÁY</button><button id="adm-users">👥 NGƯỜI DÙNG</button><button id="adm-routes">🛣 TUYẾN</button><button id="adm-work" style="grid-column:1/-1">🔧 LOẠI CÔNG VIỆC</button></div>';
  d.querySelectorAll('button').forEach(b=>b.style.cssText='padding:13px 8px;border:0;border-radius:10px;background:#12998f;color:white;font-weight:700;min-height:52px');
  card.insertAdjacentElement('afterend',d);
  d.querySelector('#adm-trip').onclick=()=>NSAdmin.openTrips();
  d.querySelector('#adm-car').onclick=()=>NSAdmin.openVehicle();
  d.querySelector('#adm-users').onclick=()=>NSAdmin.openUsers();
  d.querySelector('#adm-routes').onclick=()=>NSAdmin.openRoutes();
  d.querySelector('#adm-work').onclick=()=>NSAdmin.openWorkTypes();
}
const o=new MutationObserver(()=>setTimeout(inject,0));
document.addEventListener('DOMContentLoaded',()=>{o.observe(document.body,{childList:true,subtree:true});setTimeout(inject,200)});
})();