// Hoàn thiện V1: chuyến không cần tuyến, kiểm soát giờ máy, tự đồng bộ, filter ổn định.
(function(){
  'use strict';
  const ACCOUNT_API='https://dnqhikwqihfxvezqzqzn.supabase.co/functions/v1/nghi-son-account-api';
  let syncRunning=false, scheduled=false;

  function user(){try{return typeof Api!=='undefined'&&Api.getCurrentUser?Api.getCurrentUser():null}catch(e){return null}}
  function token(){return localStorage.getItem('auth_token')||''}
  function toast(msg,type){const c=document.getElementById('toast-container');if(!c)return;const x=document.createElement('div');x.className='toast '+(type||'')+' show';x.textContent=msg;c.appendChild(x);setTimeout(()=>x.remove(),2800)}
  async function account(){const q=new URLSearchParams({action:'account',token:token()});const r=await fetch(ACCOUNT_API+'?'+q);const j=await r.json();if(!j.success)throw new Error(j.message||'Không đọc được phương tiện đang sử dụng.');return j.data}
  async function gpsNow(){try{return typeof Gps!=='undefined'&&Gps&&Gps.getCurrentPosition?await Gps.getCurrentPosition(7000):null}catch(e){return null}}

  async function submitTx(action,payload){
    payload=payload||{};
    payload.clientTransactionId=payload.clientTransactionId||crypto.randomUUID();
    if(navigator.onLine){
      try{return await Api.post(action,payload)}catch(e){
        const code=e&&e.code||'';
        if(code&&code!=='NETWORK_ERROR'&&code!=='PARSE_ERROR')throw e;
      }
    }
    if(typeof OfflineQueue==='undefined')throw new Error('Không khởi tạo được bộ nhớ offline.');
    await OfflineQueue.enqueue(action,payload);
    await refreshSync();
    toast('Đã lưu trên máy, sẽ tự đồng bộ khi có mạng.','warning');
    return {offline:true};
  }

  async function refreshSync(){
    if(typeof OfflineQueue==='undefined')return;
    const b=document.getElementById('sync-banner');
    if(!b)return;
    const n=await OfflineQueue.countPending().catch(()=>0);
    b.classList.toggle('show',n>0);
    const t=b.querySelector('.sync-text');
    if(t)t.textContent=n?`Có ${n} giao dịch chờ đồng bộ.`:'Dữ liệu đã đồng bộ.';
  }

  async function autoSync(showToast){
    if(syncRunning||!navigator.onLine||typeof OfflineQueue==='undefined'||typeof Api==='undefined')return;
    const n=await OfflineQueue.countPending().catch(()=>0);
    if(!n){await refreshSync();return}
    syncRunning=true;
    const b=document.getElementById('sync-banner'),t=b?.querySelector('.sync-text');
    if(b)b.classList.add('show');if(t)t.textContent=`Đang đồng bộ ${n} bản ghi...`;
    try{
      const r=await OfflineQueue.syncAll((done,total)=>{if(t)t.textContent=`Đang đồng bộ ${done}/${total} bản ghi...`});
      await refreshSync();
      if(showToast)toast(r.failed?`Đồng bộ ${r.success||0} thành công, ${r.failed||0} lỗi.`:`Đã tự đồng bộ ${r.success||0} bản ghi.`,r.failed?'warning':'success');
    }catch(e){if(t)t.textContent='Lỗi đồng bộ · Bấm Đồng bộ ngay để thử lại';if(b)b.classList.add('show')}
    finally{syncRunning=false}
  }

  function driverUi(){
    const u=user();if(u?.ROLE!=='DRIVER')return;
    const start=document.getElementById('start-trip'),finish=document.getElementById('finish-trip'),route=document.getElementById('route-select');
    if(start&&route){
      const field=route.closest('.v17-field');if(field)field.style.display='none';
      const card=route.closest('.v17-card');const title=card?.querySelector('.v17-card-title');if(title)title.textContent='CHUYẾN MỚI';
      if(card&&!card.querySelector('.ns-v1-trip-note')){const d=document.createElement('div');d.className='ns-v1-trip-note';d.style.cssText='font-size:14px;color:#5f6b7a;line-height:1.45';d.textContent='Bấm Bắt đầu chuyến để ghi nhận chuyến mới.';card.appendChild(d)}
      if(!start.dataset.v1Ready){
        start.dataset.v1Ready='1';
        start.onclick=async function(e){
          e.preventDefault();
          if(start.disabled)return;
          try{
            start.disabled=true;
            const acc=await account(),a=acc.selectedAsset;
            if(!a)throw new Error('Vui lòng chọn xe tải trước khi bắt đầu chuyến.');
            const g=await gpsNow();
            await submitTx('trip/start',{vehicleId:a.id,lat:g?.latitude??null,lng:g?.longitude??null});
            toast('Đã bắt đầu chuyến.','success');
            if(window.navigate)window.navigate('home');
          }catch(err){toast(err.message||err,'error');start.disabled=false}
        };
      }
    }
    if(finish){
      const wrap=finish.closest('.v17-wrap');const card=wrap?.querySelector('.v17-card');
      if(card){const title=card.querySelector('.v17-card-title');if(title)title.textContent='CHUYẾN ĐANG CHẠY';const row=card.querySelector('.v17-row');if(row){const s=row.querySelectorAll('span');if(s[0])s[0].textContent='Trạng thái';if(s[1])s[1].textContent='Đang chạy'}}
    }
  }

  async function cacheShiftStart(){
    const u=user();if(u?.ROLE!=='OPERATOR'||!document.getElementById('finish-shift')||!navigator.onLine)return;
    try{const s=await Api.get('current-shift',{});if(s?.START_HOUR_METER!=null)localStorage.setItem('ns_v1_shift_start_'+u.PROFILE_ID,String(s.START_HOUR_METER))}catch(e){}
  }

  function replaceButton(id,handler){
    const old=document.getElementById(id);if(!old||old.dataset.v1Ready)return old;
    const b=old.cloneNode(true);b.dataset.v1Ready='1';old.replaceWith(b);b.addEventListener('click',handler);return b;
  }

  function operatorUi(){
    const u=user();if(u?.ROLE!=='OPERATOR')return;
    const start=document.getElementById('start-shift');
    if(start&&!start.dataset.v1Ready){
      replaceButton('start-shift',async function(e){
        e.preventDefault();const b=e.currentTarget;if(b.disabled)return;
        const work=document.getElementById('work-select')?.value||'',meter=Number(document.getElementById('start-meter')?.value||0);
        if(!work)return toast('Vui lòng chọn công việc.','error');
        if(!(meter>0))return toast('Giờ máy đầu là bắt buộc và phải lớn hơn 0.','error');
        try{b.disabled=true;const acc=await account(),a=acc.selectedAsset;if(!a)throw new Error('Vui lòng chọn máy trước khi bắt đầu ca.');const g=await gpsNow();await submitTx('shift/start',{machineId:a.id,workTypeId:work,startHourMeter:meter,lat:g?.latitude??null,lng:g?.longitude??null});localStorage.setItem('ns_v1_shift_start_'+u.PROFILE_ID,String(meter));toast('Đã bắt đầu ca.','success');if(window.navigate)window.navigate('home')}catch(err){toast(err.message||err,'error');b.disabled=false}
      });
    }
    const end=document.getElementById('finish-shift');
    if(end&&!end.dataset.v1Ready){
      replaceButton('finish-shift',async function(e){
        e.preventDefault();const b=e.currentTarget;if(b.disabled)return;const meter=Number(document.getElementById('end-meter')?.value||0);
        if(!(meter>0))return toast('Giờ máy cuối là bắt buộc và phải lớn hơn 0.','error');
        const startMeter=Number(localStorage.getItem('ns_v1_shift_start_'+u.PROFILE_ID)||0);
        if(startMeter>0&&meter<startMeter)return toast(`Giờ máy cuối phải lớn hơn hoặc bằng giờ máy đầu (${startMeter}).`,'error');
        try{b.disabled=true;const g=await gpsNow();await submitTx('shift/end',{endHourMeter:meter,lat:g?.latitude??null,lng:g?.longitude??null});localStorage.removeItem('ns_v1_shift_start_'+u.PROFILE_ID);toast('Đã kết thúc ca.','success');if(window.navigate)window.navigate('home')}catch(err){toast(err.message||err,'error');b.disabled=false}
      });
      cacheShiftStart();
    }
  }

  function adminV1Ui(){
    if(user()?.ROLE!=='ADMIN')return;
    ['adm-trips','adm-routes'].forEach(id=>{const x=document.getElementById(id);if(x)x.style.display='none'});
    const accountActive=document.querySelector('#bottom-nav button[data-route="account"].active');
    if(accountActive){document.querySelectorAll('#screen button').forEach(b=>{const t=(b.textContent||'').trim();if(/Chuyến xe vận tải|^Tuyến$/i.test(t))b.style.display='none'})}
  }

  function filterGuards(){
    if(document.documentElement.dataset.v1FilterReady)return;
    document.documentElement.dataset.v1FilterReady='1';
    document.addEventListener('click',e=>{
      const b=e.target.closest&&e.target.closest('.ops-filter');
      if(!b||e.__v1FilterHandled||typeof b.onclick!=='function')return;
      e.__v1FilterHandled=true;e.preventDefault();e.stopImmediatePropagation();b.onclick.call(b,e);
    },true);
    document.addEventListener('change',e=>{
      const el=e.target;
      if(!el||!['ops-period','hist-range','hist-type'].includes(el.id)||e.__v1FilterHandled||typeof el.onchange!=='function')return;
      e.__v1FilterHandled=true;e.stopImmediatePropagation();el.onchange.call(el,e);
    },true);
  }

  function apply(){driverUi();operatorUi();adminV1Ui();filterGuards();refreshSync();}
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply()})}
  function boot(){apply();const root=document.getElementById('screen');if(root)new MutationObserver(m=>{if(m.some(x=>x.addedNodes&&x.addedNodes.length))schedule()}).observe(root,{childList:true,subtree:true});window.addEventListener('online',()=>autoSync(true));window.addEventListener('offline',refreshSync);setTimeout(()=>autoSync(false),1200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
