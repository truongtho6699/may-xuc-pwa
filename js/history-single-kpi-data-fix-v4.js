// V4: Nhật ký chỉ giữ 1 vùng KPI; mặc định Tuần này để có dữ liệu gần nhất qua tháng mới.
(function(){
'use strict';
if(window.__NS_HISTORY_SINGLE_KPI_DATA_FIX_V4)return;window.__NS_HISTORY_SINGLE_KPI_DATA_FIX_V4=true;
let timer=null;
function css(){
 if(document.getElementById('ns-history-single-kpi-v4-css'))return;
 const s=document.createElement('style');s.id='ns-history-single-kpi-v4-css';s.textContent=`
/* Chỉ giữ vùng KPI mới: Tổng số chuyến / Sự kiện vận hành */
#hist-body > .v17-stat-grid:not(.ns-history-kpis),
#hist-body > .ns-h-stat,
#hist-body > .v17-stat-grid.ns-h-stat{display:none!important}
`;
 document.head.appendChild(s);
}
function removeDuplicateStats(){
 const body=document.getElementById('hist-body');if(!body)return;
 [...body.children].forEach(x=>{
   if(x.classList?.contains('ns-history-kpis'))return;
   if(x.classList?.contains('v17-stat-grid')||x.classList?.contains('ns-h-stat'))x.remove();
 });
}
function normalizeRange(){
 const r=document.getElementById('hist-range');if(!r||r.dataset.nsV4Init==='1')return;
 r.dataset.nsV4Init='1';
 const old=r.value;
 const opts=[['today','Hôm nay'],['week','Tuần này'],['month','Tháng này'],['all','Tất cả']];
 r.innerHTML=opts.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
 // Khi mở Nhật ký mới, ưu tiên Tuần này để không bị trống đúng ngày đầu tháng.
 r.value=(old&&opts.some(x=>x[0]===old)&&old!=='today')?old:'week';
 setTimeout(()=>r.dispatchEvent(new Event('change',{bubbles:true})),30);
}
function improveEmpty(){
 const body=document.getElementById('hist-body'),r=document.getElementById('hist-range');if(!body||!r)return;
 const empty=[...body.querySelectorAll('.ns-h-empty,.v17-card')].find(x=>/không có dữ liệu phù hợp/i.test(x.textContent||''));
 if(empty&&r.value==='month')empty.textContent='Tháng này chưa có dữ liệu. Có thể chọn “Tuần này” để xem các bản ghi gần nhất.';
}
function apply(){css();normalizeRange();removeDuplicateStats();improveEmpty()}
function schedule(){clearTimeout(timer);timer=setTimeout(apply,80)}
function boot(){apply();new MutationObserver(m=>{if(m.some(x=>x.addedNodes?.length))schedule()}).observe(document.getElementById('screen')||document.body,{childList:true,subtree:true});document.addEventListener('change',e=>{if(e.target?.id==='hist-range')setTimeout(()=>{removeDuplicateStats();improveEmpty()},150)},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();