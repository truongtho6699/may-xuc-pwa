// Hotfix giao diện nút chụp ảnh cho các form Vận hành.
(function(){
  function normalize(){
    const fuel=document.getElementById('fuel-photo');
    const issue=document.getElementById('issue-photo');
    [fuel,issue].forEach(btn=>{
      if(!btn)return;
      btn.type='button';
      btn.textContent='Chụp ảnh thực tế';
      btn.setAttribute('aria-label','Chụp ảnh thực tế');
      btn.style.minHeight='48px';
      btn.style.width='100%';
    });
  }
  normalize();
  const root=document.getElementById('screen');
  if(root){
    const obs=new MutationObserver(()=>requestAnimationFrame(normalize));
    obs.observe(root,{childList:true,subtree:true});
  }
})();
