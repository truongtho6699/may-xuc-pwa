// Thanh đồng bộ nổi phía trên bottom-nav + màu icon theo loại nghiệp vụ.
(function(){
'use strict';
if(window.__NS_SYNC_FOOTER_EVENT_COLORS)return;window.__NS_SYNC_FOOTER_EVENT_COLORS=true;
let scheduled=false;
function css(){if(document.getElementById('ns-sync-footer-event-colors-css'))return;const s=document.createElement('style');s.id='ns-sync-footer-event-colors-css';s.textContent=`
/* Thanh đồng bộ chỉ nổi khi cần, không chiếm chỗ phần đầu */
#sync-banner{position:fixed!important;left:12px!important;right:12px!important;bottom:calc(76px + env(safe-area-inset-bottom,0px))!important;z-index:65!important;max-width:456px!important;margin:0 auto!important;padding:9px 10px 9px 13px!important;border-radius:15px!important;box-shadow:0 8px 24px rgba(15,23,42,.14)!important;background:#fff8ee!important;border:1px solid #f1c58f!important;color:#9a4f16!important;gap:10px!important;align-items:center!important;min-height:52px!important}.sync-banner.show{display:flex!important}.sync-banner:not(.show){display:none!important}#sync-banner .sync-text{font-size:13px!important;line-height:1.25!important;font-weight:750!important;flex:1!important}#sync-banner #sync-now-btn{min-height:36px!important;padding:7px 11px!important;border-radius:10px!important;background:#b65d1d!important;color:#fff!important;font-size:12px!important;font-weight:850!important;white-space:nowrap!important}.screen{padding-bottom:calc(128px + env(safe-area-inset-bottom,0px))!important}
/* Màu nhận diện icon nghiệp vụ: chỉ tô icon/nền icon, không tô cả card */
.ns-event-trip .ico,.ns-event-trip .ns-event-icon{color:#2563eb!important;background:#eff6ff!important}.ns-event-fuel .ico,.ns-event-fuel .ns-event-icon{color:#087173!important;background:#ecfdf5!important}.ns-event-issue .ico,.ns-event-issue .ns-event-icon{color:#c45b12!important;background:#fff7ed!important}.ns-event-repair .ico,.ns-event-repair .ns-event-icon{color:#9333ea!important;background:#faf5ff!important}.ns-event-shift .ico,.ns-event-shift .ns-event-icon{color:#0f766e!important;background:#ecfeff!important}.v17-event .ico{border-radius:12px!important}.v17-event .ico svg{stroke:currentColor!important}
/* Hai thao tác chính của Vận hành: nền trắng, màu icon/chữ riêng */
.ns-ops-menu #all-fuel{background:#fff!important;color:#087173!important}.ns-ops-menu #all-issue{background:#fff!important;color:#b45309!important}.ns-ops-menu #all-fuel .ico,.ns-ops-menu #all-fuel svg{color:#087173!important}.ns-ops-menu #all-issue .ico,.ns-ops-menu #all-issue svg{color:#c45b12!important}
@media(max-width:375px){#sync-banner{left:8px!important;right:8px!important;bottom:calc(73px + env(safe-area-inset-bottom,0px))!important}#sync-banner .sync-text{font-size:12px!important}#sync-banner #sync-now-btn{font-size:11px!important;padding-left:9px!important;padding-right:9px!important}}
`;
document.head.appendChild(s)}
function typeFromText(text){const t=(text||'').toLowerCase();if(t.includes('đổ dầu'))return'fuel';if(t.includes('sự cố'))return'issue';if(t.includes('sửa chữa'))return'repair';if(t.includes('chuyến'))return'trip';if(t.includes('ca ')||t.includes('ca máy'))return'shift';return''}
function markEventCards(){document.querySelectorAll('.v17-event,.v17-item').forEach(card=>{['trip','fuel','issue','repair','shift'].forEach(x=>card.classList.remove('ns-event-'+x));const type=typeFromText(card.textContent);if(type)card.classList.add('ns-event-'+type)})}
function markGenericIcons(){document.querySelectorAll('#screen .v17-event .ico,#screen .v17-item .ico').forEach(x=>{x.classList.add('ns-event-icon')})}
function ensureBannerA11y(){const b=document.getElementById('sync-banner');if(!b)return;b.setAttribute('role','status');b.setAttribute('aria-live','polite')}
function apply(){scheduled=false;css();ensureBannerA11y();markEventCards();markGenericIcons()}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(apply)}
function boot(){apply();const root=document.getElementById('app')||document.body;new MutationObserver(m=>{if(m.some(x=>x.addedNodes&&x.addedNodes.length))schedule()}).observe(root,{childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target.closest?.('#bottom-nav button'))setTimeout(schedule,60)},true)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
