(function(){
  function currentUser(){return window.Api&&Api.getCurrentUser?Api.getCurrentUser():null}
  function findLabelFor(el){
    if(!el||!el.parentNode)return null;
    var n=el.previousElementSibling;
    while(n){if(n.tagName==='LABEL')return n;n=n.previousElementSibling}
    return null;
  }
  function simplify(){
    var p=document.getElementById('role-v2-panel');
    var u=currentUser();
    if(!p||!u)return;

    // Trang chủ chỉ giữ nghiệp vụ chính: chọn -> bắt đầu -> kết thúc.
    var opBtn=p.querySelector('#operations');
    if(opBtn)opBtn.remove();

    var title=p.querySelector('h2');
    if(u.ROLE==='DRIVER'){
      if(title&&title.textContent==='Vận tải')title.textContent='Chuyến xe';
      var vehicle=p.querySelector('#vehicle');
      var vl=findLabelFor(vehicle);if(vl)vl.textContent='Xe tải / Chuyến';
      var route=p.querySelector('#route');
      var rl=findLabelFor(route);if(rl)rl.textContent='Tuyến';
      // Loại hàng là thông tin phụ, không để trên Trang chủ tài xế.
      var cargo=p.querySelector('#cargo');
      if(cargo){var cl=findLabelFor(cargo);if(cl)cl.remove();cargo.remove();}
    }
    if(u.ROLE==='OPERATOR'){
      if(title&&title.textContent==='Vận hành máy')title.textContent='Xe công trình';
      var machine=p.querySelector('#machine');
      var ml=findLabelFor(machine);if(ml)ml.textContent='Xe công trình';
      var work=p.querySelector('#work');
      var wl=findLabelFor(work);if(wl)wl.textContent='Công việc';
    }
  }
  document.addEventListener('DOMContentLoaded',function(){
    var target=document.body;
    new MutationObserver(function(){setTimeout(simplify,0)}).observe(target,{childList:true,subtree:true});
    setTimeout(simplify,300);
  });
})();