(function(){
  if(!('serviceWorker' in navigator)) return;
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('./service-worker.js').then(function(reg){
      try { reg.update(); } catch(e) {}
    }).catch(function(err){ console.warn('Không đăng ký được Service Worker', err); });
  });
})();