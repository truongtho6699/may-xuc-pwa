// Sửa trạng thái khóa/mở dropdown Tuyến: chỉ khóa khi chuyến thực sự đang chạy.
(function(){
'use strict';
if(window.__NS_ROUTE_SELECT_FIX)return;window.__NS_ROUTE_SELECT_FIX=true;
let scheduled=false;
function isActuallyVisible(el){if(!el)return false;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||cs.opacity==='0')return false;let p=el.parentElement;while(p&&p!==document.body){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden')return false;p=p.parentElement}return true}
function apply(){scheduled=false;const sel=document.querySelector('#route-select,#v1-route-active');if(!sel)return;const start=document.getElementById('start-trip'),finish=document.getElementById('finish-trip');const running=isActuallyVisible(finish)&&!isActuallyVisible(start);const wrap=sel.closest('.v17-field,.ns-active-select');const label=wrap?.querySelector('label');if(label)label.textContent='Tuyến';if(running){sel.disabled=true;sel.classList.add('ns-route-locked');sel.setAttribute('aria-disabled','true');if(wrap&&!wrap.querySelector('.ns-route-lock-note'))wrap.insertAdjacentHTML('beforeend','<div class="ns-route-lock-note">Tuyến đã khóa khi chuyến đang chạy</div>')}else{sel.disabled=false;sel.classList.remove('ns-route-locked');sel.removeAttribute('aria-disabled');wrap?.querySelector('.ns-route-lock-note')?.remove()}}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(apply)}
function boot(){apply();const root=document.getElementById('screen')||document.body;new MutationObserver(m=>{if(m.some(x=>x.addedNodes?.length||x.removedNodes?.length))schedule()}).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','disabled']});document.addEventListener('click',e=>{if(e.target.closest?.('#bottom-nav button[data-route="home"]'))setTimeout(schedule,50)},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
