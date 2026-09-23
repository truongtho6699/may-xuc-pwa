(function(){
'use strict';
const BRAND='#087173';
function css(){
  if(document.getElementById('ns-ops-theme-v21-css'))return;
  const s=document.createElement('style');
  s.id='ns-ops-theme-v21-css';
  s.textContent=`
  .ns-ops-quick{background:#fff;border:1px solid #e8edef;border-radius:18px;padding:0 15px;overflow:hidden;box-shadow:0 3px 12px rgba(15,23,42,.035);margin-bottom:18px}
  .ns-ops-quick .v17-action{min-height:60px!important;margin:0!important;padding:0!important;border:0!important;border-bottom:1px solid #edf1f2!important;border-radius:0!important;background:#fff!important;color:#202944!important;box-shadow:none!important;display:grid!important;grid-template-columns:40px minmax(0,1fr) 24px!important;gap:10px!important;align-items:center!important;text-align:left!important;font-size:15px!important;font-weight:700!important;transform:none!important}
  .ns-ops-quick .v17-action:last-child{border-bottom:0!important}
  .ns-ops-quick .v17-action>span:first-child{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-size:21px!important;color:#667085}
  .ns-ops-quick .v17-action b{font-size:15px!important;color:#202944!important}
  .ns-ops-quick .v17-action::after{content:'›';font-size:27px;line-height:1;color:${BRAND};text-align:right;font-weight:300}
  .ns-ops-quick .v17-action:active{background:#f3fbfb!important;transform:none!important}
  .ns-ops-filters{display:flex!important;gap:8px!important;flex-wrap:wrap!important;margin:0 0 12px!important}
  .ns-ops-filters .ops-filter{background:#fff;border:1px solid #d8e1e5;border-radius:12px;padding:9px 12px;font-size:13px;box-shadow:none}
  `;
  document.head.appendChild(s);
}
function apply(){
  css();
  const nav=document.querySelector('#bottom-nav button[data-route="operations-v2"]');
  if(!nav||!nav.classList.contains('active'))return;
  const fuel=document.getElementById('all-fuel');
  const issue=document.getElementById('all-issue');
  if(fuel&&issue){
    const holder=fuel.parentElement;
    if(holder&&!holder.classList.contains('ns-ops-quick'))holder.classList.add('ns-ops-quick');
  }
  const all=document.querySelector('.ops-filter[data-f="all"]');
  const issueFilter=document.querySelector('.ops-filter[data-f="issue"]');
  const fuelFilter=document.querySelector('.ops-filter[data-f="fuel"]');
  if(all&&issueFilter&&fuelFilter){
    const holder=all.parentElement;
    holder.classList.add('ns-ops-filters');
    all.textContent='Tất cả';
    issueFilter.textContent='Sự cố / Sửa chữa';
    fuelFilter.textContent='Đổ dầu';
    if(holder.firstElementChild!==all){holder.insertBefore(all,holder.firstElementChild);}
    if(all.nextElementSibling!==issueFilter){holder.insertBefore(issueFilter,all.nextSibling);}
    if(issueFilter.nextElementSibling!==fuelFilter){holder.insertBefore(fuelFilter,issueFilter.nextSibling);}
    if(!holder.dataset.nsDefaultAll){
      holder.dataset.nsDefaultAll='1';
      setTimeout(()=>{try{all.click()}catch(e){}},0);
    }
  }
}
function boot(){apply();const root=document.getElementById('screen')||document.body;new MutationObserver(()=>apply()).observe(root,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();