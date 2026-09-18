(function(){
  function currentUser(){return window.Api&&Api.getCurrentUser?Api.getCurrentUser():null}
  function toast(msg,type){var c=document.getElementById('toast-container');if(!c)return alert(msg);var x=document.createElement('div');x.className='toast '+(type||'')+' show';x.textContent=msg;c.appendChild(x);setTimeout(function(){x.remove()},2800)}

  async function changeVehicle(){
    var u=currentUser();
    if(!u)return;
    try{
      var h=await Api.get('home',{});
      if(u.ROLE==='DRIVER'&&h.currentTrip){toast('Hãy kết thúc chuyến hiện tại trước khi đổi xe.','warning');return;}
      if(u.ROLE==='OPERATOR'&&h.currentShift){toast('Hãy kết thúc ca hiện tại trước khi đổi xe công trình.','warning');return;}
      if(window.navigate)window.navigate('home');
      setTimeout(function(){
        if(!window.NSRoleV2)return;
        if(u.ROLE==='DRIVER'&&NSRoleV2.openDriver)NSRoleV2.openDriver();
        if(u.ROLE==='OPERATOR'&&NSRoleV2.openOperator)NSRoleV2.openOperator();
      },150);
    }catch(e){toast(e.message||'Không thể đổi xe lúc này.','error')}
  }

  function injectChangeVehicle(){
    var u=currentUser();
    if(!u||!['DRIVER','OPERATOR'].includes(u.ROLE))return;
    if(document.getElementById('change-vehicle-btn'))return;
    var logout=document.getElementById('logout-btn');
    if(!logout)return;
    var b=document.createElement('button');
    b.id='change-vehicle-btn';
    b.className='btn-big';
    b.innerHTML='<span class="icon">🔄</span><span>'+(u.ROLE==='DRIVER'?'ĐỔI XE TẢI':'ĐỔI XE CÔNG TRÌNH')+'</span>';
    b.style.margin='12px 0 0';
    b.addEventListener('click',changeVehicle);
    logout.parentNode.insertBefore(b,logout);
  }

  function normalizeOperationsUI(){
    var p=document.getElementById('role-v2-panel');
    if(!p)return;
    var h=p.querySelector('h2');
    if(!h||h.textContent.trim()!=='Vận hành')return;
    var load=p.querySelector('#rv-load');
    if(!load)return;
    var card=load.firstElementChild;
    if(card){card.style.background='transparent';card.style.padding='0';card.style.borderRadius='0';}
    var intro=load.querySelector('p');
    if(intro){intro.style.margin='0 0 14px';intro.style.fontSize='14px';}
    [
      ['#fuel','⛽','ĐỔ DẦU',''],
      ['#issue','🔧','GHI NHẬN SỰ CỐ',''],
      ['#stop','⛔','DỪNG XE DO SỰ CỐ','danger-outline']
    ].forEach(function(x){
      var b=load.querySelector(x[0]);if(!b)return;
      b.removeAttribute('style');
      b.className='btn-big'+(x[3]?' '+x[3]:'');
      b.innerHTML='<span class="icon">'+x[1]+'</span><span>'+x[2]+'</span>';
    });
  }

  function refresh(){injectChangeVehicle();normalizeOperationsUI()}
  document.addEventListener('DOMContentLoaded',function(){
    new MutationObserver(function(){setTimeout(refresh,0)}).observe(document.body,{childList:true,subtree:true});
    setTimeout(refresh,300);
  });
})();