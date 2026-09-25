// Hotfix chụp ảnh thực tế cho các form Vận hành.
// Dùng input file/camera native đặt trực tiếp trong nút để không phụ thuộc onclick cũ.
(function(){
  'use strict';
  if(window.__NS_CAMERA_HOTFIX_V1)return;
  window.__NS_CAMERA_HOTFIX_V1=true;

  const PHOTO_ICON='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="16" rx="2"></rect><circle cx="8.5" cy="10" r="1.5"></circle><path d="m21 15-5-5L5 21"></path></svg>';
  const store={fuel:null,issue:null};
  let apiPatched=false,queuePatched=false;

  function toast(msg,type){
    const c=document.getElementById('toast-container');
    if(!c)return;
    const x=document.createElement('div');x.className='toast '+(type||'')+' show';x.textContent=msg;c.appendChild(x);setTimeout(()=>x.remove(),2800);
  }
  function userName(){try{const u=window.Api&&Api.getCurrentUser?Api.getCurrentUser():null;return u?.FULL_NAME||u?.full_name||u?.name||''}catch(e){return ''}}
  async function gpsText(){try{if(!window.Gps||!Gps.getCurrentPosition)return 'Không có GPS';const g=await Gps.getCurrentPosition(7000);return `${Number(g.latitude).toFixed(5)}, ${Number(g.longitude).toFixed(5)}`}catch(e){return 'Không có GPS'}}
  function fileToBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||'').split(',')[1]||'');r.onerror=()=>reject(new Error('Không đọc được ảnh.'));r.readAsDataURL(file)})}

  async function processFile(kind,file,label,stateEl,captionEl){
    if(!file)return;
    try{
      if(stateEl)stateEl.textContent='Đang xử lý ảnh...';
      const base64=window.Camera&&Camera.processImage?await Camera.processImage(file,{machineId:label||'Nghi Sơn',dateTimeText:new Date().toLocaleString('vi-VN'),userName:userName(),gpsText:await gpsText()}):await fileToBase64(file);
      store[kind]=base64;
      if(stateEl){stateEl.textContent='Đã chụp 1 ảnh';stateEl.style.color='#087173';stateEl.style.fontWeight='700'}
      if(captionEl)captionEl.textContent='Chụp lại ảnh';
      toast('Đã ghi nhận ảnh thực tế.','success');
    }catch(e){store[kind]=null;if(stateEl){stateEl.textContent='Không xử lý được ảnh';stateEl.style.color='#b42318'}toast(e?.message||'Không xử lý được ảnh.','error')}
  }

  function ensureStyle(){
    if(document.getElementById('ns-photo-hotfix-style'))return;
    const s=document.createElement('style');s.id='ns-photo-hotfix-style';s.textContent=`
      .ns-photo-action{position:relative;display:flex;align-items:center;justify-content:center;gap:11px;width:100%;min-height:54px;margin-top:10px;padding:0 16px;border:1.5px solid #087173;border-radius:13px;background:#eef8f7;color:#075f61;font-size:15px;font-weight:800;cursor:pointer;box-sizing:border-box;user-select:none;-webkit-tap-highlight-color:transparent}
      .ns-photo-action:active{transform:translateY(1px);background:#dff2f0}.ns-photo-action:focus-within{outline:3px solid rgba(8,113,115,.24);outline-offset:2px}
      .ns-photo-action svg{width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto}
      .ns-photo-action input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;font-size:0}
    `;document.head.appendChild(s);
  }
  function enhance(kind,oldButtonId,stateId){
    const old=document.getElementById(oldButtonId);if(!old||old.dataset.photoNativeReady)return;
    old.dataset.photoNativeReady='1';old.style.display='none';store[kind]=null;
    const label=document.createElement('label');label.className='ns-photo-action';label.setAttribute('aria-label','Chụp ảnh thực tế');label.innerHTML=`${PHOTO_ICON}<span>Chụp ảnh thực tế</span><input type="file" accept="image/*" capture="environment" aria-label="Mở camera chụp ảnh thực tế">`;old.insertAdjacentElement('afterend',label);
    const input=label.querySelector('input'),caption=label.querySelector('span'),state=document.getElementById(stateId);
    input.addEventListener('change',()=>{const file=input.files&&input.files[0];const assetText=document.querySelector('.v17-row span:last-child')?.textContent?.trim()||'Nghi Sơn';processFile(kind,file,assetText,state,caption)});
  }
  function injectPhoto(action,payload){if(!payload||typeof payload!=='object')return payload;if(action==='fuel'&&store.fuel&&!payload.imageReceipt)payload.imageReceipt=store.fuel;if(action==='issue'&&store.issue&&(!Array.isArray(payload.images)||!payload.images.length))payload.images=[store.issue];return payload}
  function patchApi(){if(apiPatched||!window.Api||typeof Api.post!=='function')return;apiPatched=true;const original=Api.post.bind(Api);Api.post=async function(action,body){body=injectPhoto(action,body||{});const result=await original(action,body);if(action==='fuel')store.fuel=null;if(action==='issue')store.issue=null;return result}}
  function patchQueue(){if(queuePatched||!window.OfflineQueue||typeof OfflineQueue.enqueue!=='function')return;queuePatched=true;const original=OfflineQueue.enqueue.bind(OfflineQueue);OfflineQueue.enqueue=async function(action,payload){payload=injectPhoto(action,payload||{});const result=await original(action,payload);if(action==='fuel')store.fuel=null;if(action==='issue')store.issue=null;return result}}
  function apply(){ensureStyle();patchApi();patchQueue();enhance('fuel','fuel-photo','fuel-photo-state');enhance('issue','issue-photo','issue-photo-state')}
  let scheduled=false;function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply()})}
  apply();const root=document.getElementById('screen');if(root)new MutationObserver(m=>{if(m.some(x=>x.addedNodes&&x.addedNodes.length))schedule()}).observe(root,{childList:true,subtree:true});
})();
