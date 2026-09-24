// Loader UI/UX giai đoạn 3-6. Không thay đổi nghiệp vụ/API.
(function(){
  if (document.getElementById('ns-ux-phase36-loader')) return;
  const s=document.createElement('script');
  s.id='ns-ux-phase36-loader';
  s.src='js/ux-phase3-6.js?v=20260923-2';
  s.defer=true;
  s.onload=function(){
    if(!document.getElementById('ns-ux-phase36-stabilizer')){
      const h=document.createElement('script');
      h.id='ns-ux-phase36-stabilizer';
      h.src='js/ux-phase3-6-stabilizer.js?v=20260923-1';
      h.defer=true;
      document.head.appendChild(h);
    }
    if(!document.getElementById('ns-camera-ui-hotfix')){
      const c=document.createElement('script');
      c.id='ns-camera-ui-hotfix';
      c.src='js/camera-ui-hotfix.js?v=20260924-1';
      c.defer=true;
      document.head.appendChild(c);
    }
  };
  document.head.appendChild(s);
})();
