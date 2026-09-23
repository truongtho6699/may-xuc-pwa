(function(){
'use strict';
const BRAND='#087173';
function user(){try{return window.Api&&Api.getCurrentUser?Api.getCurrentUser():null}catch(e){return null}}
function roleLabel(r){return ({ADMIN:'Quản trị hệ thống',MANAGER:'Quản lý vận hành',DRIVER:'Tài xế xe tải',OPERATOR:'Lái xe công trình'})[r]||r||''}
function esc(v){const d=document.createElement('div');d.textContent=v==null?'':String(v);return d.innerHTML}
function svg(name){const p={
 users:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.3"/><path d="M3.5 19c.6-3.4 2.5-5.2 5.5-5.2s5 1.8 5.6 5.2M15 14.5c2.7 0 4.4 1.4 5 4"/>',
 truck:'<path d="M3 7h10v10H3zM13 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
 route:'<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8 17c5-1 2-7 8-9"/>',
 work:'<path d="M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-3 3-3-3 2-4Z"/>',
 key:'<circle cx="8" cy="12" r="4"/><path d="M12 12h8M17 12v3M20 12v2"/>',
 car:'<path d="m5 11 2-5h10l2 5"/><path d="M4 11h16v6H4z"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/>',
 logout:'<path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"/>'
}[name]||'';return `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`}
function css(){if(document.getElementById('ns-account-v31-css'))return;const s=document.createElement('style');s.id='ns-account-v31-css';s.textContent=`
.ns-account-page{padding:0 14px 105px!important}.ns-account-hide{display:none!important}
.ns-account-title{font-size:22px;font-weight:900;color:#1f2937;margin:10px 2px 14px}
.ns-account-section{margin:0 0 20px}.ns-account-section-title{font-size:17px;font-weight:850;color:#202944;margin:0 2px 9px}
.ns-account-info{background:#fff;border-radius:18px;padding:5px 16px;border:1px solid #e8edef;box-shadow:0 4px 14px rgba(15,23,42,.045)}
.ns-account-info-row{display:grid;grid-template-columns:118px 1fr;gap:12px;padding:13px 0;border-bottom:1px solid #edf1f2;font-size:14px;align-items:center}.ns-account-info-row:last-child{border-bottom:0}.ns-account-info-row span:first-child{color:#7b8492}.ns-account-info-row span:last-child{font-weight:800;color:#1f2937;text-align:right;overflow:hidden;text-overflow:ellipsis}
.ns-account-list{background:#fff;border-radius:18px;padding:0 15px;overflow:hidden;border:1px solid #e8edef;box-shadow:0 3px 12px rgba(15,23,42,.035)}
.ns-account-row{width:100%!important;min-height:62px!important;margin:0!important;padding:0!important;border:0!important;border-bottom:1px solid #edf1f2!important;border-radius:0!important;background:#fff!important;color:#202944!important;box-shadow:none!important;display:grid!important;grid-template-columns:40px minmax(0,1fr) auto!important;gap:10px!important;align-items:center!important;text-align:left!important;font-size:15px!important;font-weight:700!important}.ns-account-row:last-child{border-bottom:0!important}.ns-account-row .ns-row-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:#667085}.ns-account-row .ns-row-icon svg{width:23px;height:23px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.ns-account-row .ns-row-label{white-space:normal;line-height:1.25}.ns-account-row .ns-row-action{color:${BRAND};font-size:14px;font-weight:850;white-space:nowrap;padding-left:8px}.ns-account-row .ns-chevron{font-size:27px;line-height:1;color:${BRAND};text-align:right;font-weight:300}.ns-account-row:active{background:#f3fbfb!important;transform:none!important}
.ns-account-logout{color:#d94a45!important}.ns-account-logout .ns-row-icon{color:#d94a45!important}.ns-account-version{text-align:center;color:#98a0ad;font-size:12px;margin:14px 0 2px}
`;document.head.appendChild(s)}
function row(button,icon,label,actionText){if(!button)return null;button.className='ns-account-row';button.innerHTML=`<span class="ns-row-icon">${svg(icon)}</span><span class="ns-row-label">${esc(label)}</span>${actionText?`<span class="ns-row-action">${esc(actionText)}</span>`:'<span class="ns-chevron">›</span>'}`;return button}
function section(title,nodes,infoHtml){const valid=(nodes||[]).filter(Boolean);if(!valid.length&&!infoHtml)return null;const sec=document.createElement('section');sec.className='ns-account-section';sec.innerHTML=`<div class="ns-account-section-title">${esc(title)}</div>${infoHtml||'<div class="ns-account-list"></div>'}`;if(valid.length){const list=sec.querySelector('.ns-account-list');valid.forEach(n=>list.appendChild(n))}return sec}
function apply(){
 css();
 const nav=document.querySelector('#bottom-nav button[data-route="account"]');if(!nav||!nav.classList.contains('active'))return;
 const logout=document.getElementById('logout');const wrap=document.querySelector('#screen .v17-wrap');if(!logout||!wrap||wrap.dataset.nsAccountV31==='1')return;
 wrap.dataset.nsAccountV31='1';wrap.classList.add('ns-account-page');const u=user()||{};
 const header=document.querySelector('#screen .v17-simple-head,#screen .ns-three-col');if(header)header.classList.add('ns-account-hide');
 const oldInfo=Array.from(wrap.children).find(x=>x.classList&&x.classList.contains('v17-card'));
 let vehicle='';
 if(oldInfo){oldInfo.querySelectorAll('.v17-row').forEach(r=>{const ss=r.querySelectorAll('span');if(ss.length>1&&/(xe đang chọn|xe đang sử dụng|máy đang sử dụng)/i.test(ss[0].textContent||''))vehicle=(ss[1].textContent||'').trim()});oldInfo.classList.add('ns-account-hide')}
 wrap.querySelectorAll('.v17-card-title').forEach(x=>x.classList.add('ns-account-hide'));
 const admTrips=document.getElementById('adm-trips');if(admTrips)admTrips.classList.add('ns-account-hide');
 const existing=Array.from(wrap.children);existing.forEach(x=>{if(x!==oldInfo&&x!==logout&&!x.id?.startsWith('adm-')&&x.id!=='change-vehicle'&&x.id!=='change-pass')x.classList?.add('ns-account-hide')});
 const title=document.createElement('div');title.className='ns-account-title';title.textContent='Tài khoản';wrap.insertBefore(title,wrap.firstChild);
 const infoHtml=`<div class="ns-account-info"><div class="ns-account-info-row"><span>Tên người dùng</span><span>${esc(u.FULL_NAME||'—')}</span></div><div class="ns-account-info-row"><span>Vai trò</span><span>${esc(roleLabel(u.ROLE))}</span></div><div class="ns-account-info-row"><span>Điện thoại</span><span>${esc(u.PHONE||'—')}</span></div></div>`;
 let anchor=title;
 const infoSec=section('Thông tin tài khoản',[],infoHtml);anchor.after(infoSec);anchor=infoSec;
 if(['DRIVER','OPERATOR'].includes(u.ROLE)){
   const vehicleLabel=u.ROLE==='DRIVER'?`Xe ${vehicle||'chưa chọn'}`:`Máy ${vehicle||'chưa chọn'}`;
   const changeVehicle=row(document.getElementById('change-vehicle'),'car',vehicleLabel,'Đổi xe');
   const manageInfo=section('Quản lý thông tin',[changeVehicle]);if(manageInfo){anchor.after(manageInfo);anchor=manageInfo}
 }
 if(u.ROLE==='ADMIN'){
   const adminSec=section('Quản trị hệ thống',[
     row(document.getElementById('adm-users'),'users','Người dùng'),
     row(document.getElementById('adm-vehicles'),'truck','Phương tiện'),
     row(document.getElementById('adm-routes'),'route','Chuyến xe vận tải'),
     row(document.getElementById('adm-work'),'work','Công việc máy vận hành')
   ]);if(adminSec){anchor.after(adminSec);anchor=adminSec}
 }
 const changePass=row(document.getElementById('change-pass'),'key','Đổi mật khẩu');
 row(logout,'logout','Đăng xuất');logout.classList.add('ns-account-logout');
 const accountSec=section('Quản lý tài khoản',[changePass,logout]);if(accountSec){anchor.after(accountSec);anchor=accountSec}
 const ver=document.createElement('div');ver.className='ns-account-version';ver.textContent='Nhật ký vận hành Nghi Sơn';anchor.after(ver);
}
function boot(){apply();const t=document.getElementById('screen')||document.body;new MutationObserver(()=>apply()).observe(t,{childList:true,subtree:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();