// Guard chống lớp V1 cũ gắn lại handler sau khi giao diện mới đã thay nút.
(function(){
'use strict';
if(window.__NS_V1_POLISH_GUARD)return;window.__NS_V1_POLISH_GUARD=true;
function apply(){
  document.querySelectorAll('#start-trip[data-ns-polish],#finish-trip[data-ns-polish],#start-shift[data-ns-polish],#finish-shift[data-ns-polish]').forEach(b=>{b.dataset.v1Ready='1';b.onclick=null});
  const r=document.getElementById('route-select');if(r)r.closest('.v17-field')?.style.removeProperty('display');
}
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-ns-polish]');if(b)b.onclick=null},true);
apply();const root=document.getElementById('screen');if(root)new MutationObserver(()=>requestAnimationFrame(apply)).observe(root,{childList:true,subtree:true});
})();
