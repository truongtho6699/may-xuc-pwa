// Safe area cho iOS/Android khi PWA được cài ra màn hình chính.
(function(){
'use strict';
if(window.__NS_STANDALONE_SAFEAREA)return;window.__NS_STANDALONE_SAFEAREA=true;
function inject(){
  if(document.getElementById('ns-standalone-safearea-style'))return;
  const s=document.createElement('style');
  s.id='ns-standalone-safearea-style';
  s.textContent=`
:root{--ns-safe-top:env(safe-area-inset-top,0px);--ns-safe-bottom:env(safe-area-inset-bottom,0px)}
@media (display-mode:standalone){
  html,body{background:#087173!important}
  #app{background:#f4f6f8!important;min-height:100dvh!important}
  html body .v17-top,html body .v17-simple-head.ns-three-col{
    box-sizing:border-box!important;
    padding-top:calc(12px + var(--ns-safe-top))!important;
    min-height:calc(76px + var(--ns-safe-top))!important;
    background:#087173!important;
  }
  html body .app-header{
    padding-top:calc(18px + var(--ns-safe-top))!important;
    background:#087173!important;
  }
  html body .bottom-nav{padding-bottom:calc(7px + var(--ns-safe-bottom))!important}
}
@supports (-webkit-touch-callout:none){
  @media (display-mode:standalone){
    html,body{background:#087173!important}
    html body .v17-top,html body .v17-simple-head.ns-three-col{
      padding-top:calc(12px + var(--ns-safe-top))!important;
      min-height:calc(76px + var(--ns-safe-top))!important;
    }
  }
}
`;
  document.head.appendChild(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(inject,0),{once:true});else setTimeout(inject,0);
window.addEventListener('pageshow',inject);
})();
