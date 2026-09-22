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
function css(){if(document.getElementById('ns-account-v28-css'))return;const s=document.createElement('style');s.id='ns-account-v28-css';s.textContent=`
.ns-account-page{padding:0 14px 105px!important}.ns-account-hide{display:none!important}
.ns-account-title{font-size:22px;font-weight:900;color:#1f2937;margin:10px 2px 12px}
.ns-account-info{background:#fff;border-radius:18px;padding:5px 16px;margin:0 0 18px;border:1px solid #e8edef;box-shadow:0 4px 14px rgba(15,23,42,.045)}
.ns-account-info-row{display:grid;grid-template-columns:118px 1fr;gap:12px;padding:13px 0;border-bottom:1px solid #edf1f2;font-size:14px;align-items:center}.ns-account-info-row:last-child{border-bottom:0}.ns-account-info-row span:first-child{color:#7b8492}.ns-account-info-row span:last-child{font-weight:800;color:#1f2937;text-align:right;overflow:hidden;text-overflow:ellipsis}
.ns-account-search{height:48px;background:#fff;border-radius:24px;display:flex;align-items:center;gap:10px;padding:0 16px;margin-bottom:18px;border:1px solid #e8edef}.ns-account-search svg{width:21px;height:21px;stroke:#7d8798;fill:none;stroke-width:2}.ns-account-search input{border:0!important;outline:0!important;background:transparent!important;width:100%!important;font-size:15px!important;padding:0!important;min-height:auto!important;color:#25304d!important}
.ns-account-section{margin:0 0 18px}.ns-account-section-title{font-size:17px;font-weight:850;color:#202944;margin:0 2px 9px}.ns-account-list{background:#fff;border-radius:18px;padding:0 15px;overflow:hidden;border:1px solid #e8edef;box-shadow:0 3px 12px rgba(15,23,42,.035)}
.ns-account-row{width:100%!important;min-height:60px!important;margin:0!important;padding:0!important;border:0!important;border-bottom:1px solid #edf1f2!important;border-radius:0!important;background:#fff!important;color:#202944!important;box-shadow:none!important;display:grid!important;grid-template-columns:40px minmax(0,1fr) 24px!important;gap:10px!important;align-items:center!important;text-align:left!important;font-size:15px!important;font-weight:700!important}.ns-account-row:last-child{border-bottom:0!important}.ns-account-row .ns-row-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:#667085}.ns-account-row .ns-row-icon svg{width:23px;height:23px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.ns-account-row .ns-row-label{white-space:normal;line-height:1.25}.ns-account-row .ns-chevron{font-size:27px;line-height:1;color:var(--ns-brand,#087173);text-align:right;font-weight:300}.ns-account-row:active{background:#f3fbfb!important;transform:none!important}
.ns-account-logout{width:100%!important;min-height:58px!important;margin:4px 0 8px!important;border:0!important;border-radius:18px!important;background:#fff!important;color:#e14c46!important;box-shadow:none!important;display:flex!important;align-items:center!important;gap:12px!important;padding:0 18px!important;font-size:16px!important;font-weight:700!important;text-align:left!important}.ns-account-logout svg{width:25px;height:25px;stroke:currentColor;fill:none;stroke-width:1.8}.ns-account-version{text-align:center;color:#98a0ad;font-size:12px;margin:14px 0 2px}
`;document.head.appendChild(s)}
function row(button,icon,label){if(!button)return null;button.className='ns-account-row';button.innerHTML=`<span class="ns-row-icon">${svg(icon)}</span><span class="ns-row-label">${esc(label)}</span><span class="ns-chevron">›</span>`;button.dataset.nsSearch=label.toLowerCase();return button}
function section(title,nodes){const valid=nodes.filter(Boolean);if(!valid.length)return null;const sec=document.createElement('section');sec.className='ns-account-section';sec.innerHTML=`<div class="ns-account-section-title">${esc(title)}</div><div class="ns-account-list"></div>`;const list=sec.querySelector('.ns-account-list');valid.forEach(n=>list.appendChild(n));return sec}
function apply(){css();const nav=document.querySelector('#bottom-nav button[data-route="account"]');if(!nav||!nav.classList.contains('active'))return;const logout=document.getElementById('logout');const wrap=document.querySelector('#screen .v17-wrap');if(!logout||!wrap||wrap.dataset.nsAccountV28==='1')return;wrap.dataset.nsAccountV28='1';wrap.classList.add('ns-account-page');const u=user()||{};const header=document.querySelector('#screen .v17-simple-head,#screen .ns-three-col');if(header)header.classList.add('ns-account-hide');
const oldInfo=Array.from(wrap.children).find(x=>x.classList&&x.classList.contains('v17-card'));if(oldInfo)oldInfo.classList.add('ns-account-hide');wrap.querySelectorAll('.v17-card-title').forEach(x=>x.classList.add('ns-account-hide'));
const title=document.createElement('div');title.className='ns-account-title';title.textContent='Tài khoản';
const info=document.createElement('div');info.className='ns-account-info';info.innerHTML=`<div class="ns-account-info-row"><span>Tên người dùng</span><span>${esc(u.FULL_NAME||'—')}</span></div><div class="ns-account-info-row"><span>Vai trò</span><span>${esc(roleLabel(u.ROLE))}</span></div><div class="ns-account-info-row"><span>Điện thoại</span><span>${esc(u.PHONE||'—')}</span></div>`;
const search=document.createElement('div');search.className='ns-account-search';search.innerHTML=`<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg><input id="ns-account-search-input" type="search" placeholder="Tìm chức năng, cài đặt">`;
const changeVehicle=row(document.getElementById('change-vehicle'),'car',u.ROLE==='DRIVER'?'Chọn / thay xe tải':'Chọn / thay xe công trình');
const changePass=row(document.getElementById('change-pass'),'key','Đổi mật khẩu');
const admUsers=row(document.getElementById('adm-users'),'users','Người dùng');
const admVehicles=row(document.getElementById('adm-vehicles'),'truck','Phương tiện');
const admRoutes=row(document.getElementById('adm-routes'),'route','Chuyến xe vận tải');
const admWork=row(document.getElementById('adm-work'),'work','Công việc máy vận hành');
const admTrips=document.getElementById('adm-trips');if(admTrips)admTrips.classList.add('ns-account-hide');
const existing=Array.from(wrap.children);existing.forEach(x=>{if(x!==oldInfo&&x!==logout&&!x.id?.startsWith('adm-')&&x.id!=='change-vehicle'&&x.id!=='change-pass')x.classList?.add('ns-account-hide')});
wrap.insertBefore(title,wrap.firstChild);title.after(info);info.after(search);let anchor=search;
const sections=u.ROLE==='ADMIN'?[section('Quản trị hệ thống',[admUsers,admVehicles,admRoutes,admWork]),section('Bảo mật',[changePass])]:[section('Quản lý tài khoản',[changeVehicle,changePass])];sections.filter(Boolean).forEach(sec=>{anchor.after(sec);anchor=sec});
logout.className='ns-account-logout';logout.innerHTML=`${svg('logout')}<span>Đăng xuất</span>`;anchor.after(logout);const ver=document.createElement('div');ver.className='ns-account-version';ver.textContent='Nhật ký vận hành Nghi Sơn';logout.after(ver);
const input=document.getElementById('ns-account-search-input');if(input)input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();wrap.querySelectorAll('.ns-account-row').forEach(b=>b.style.display=!q||String(b.dataset.nsSearch||'').includes(q)?'grid':'none');wrap.querySelectorAll('.ns-account-section').forEach(sec=>{const visible=Array.from(sec.querySelectorAll('.ns-account-row')).some(b=>b.style.display!=='none');sec.style.display=visible?'block':'none'})});
}
function boot(){apply();const t=document.getElementById('screen')||document.body;new MutationObserver(()=>apply()).observe(t,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();