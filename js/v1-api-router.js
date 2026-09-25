// Router nghiệp vụ V1: chuyến xe không cần tuyến, ca máy bắt buộc chỉ số đầu/cuối.
(function(){
  'use strict';
  const V1_API='https://dnqhikwqihfxvezqzqzn.supabase.co/functions/v1/nghi-son-v1-api';
  if(!window.Api||typeof Api.post!=='function'||Api.__v1RouterReady)return;
  Api.__v1RouterReady=true;
  const originalPost=Api.post.bind(Api);

  async function tryGps(body){
    if(body&&body.lat!=null&&body.lng!=null)return body;
    try{
      if(window.Gps&&typeof Gps.getCurrentPosition==='function'&&navigator.onLine){
        const g=await Gps.getCurrentPosition(5000);
        if(g){body.lat=g.latitude;body.lng=g.longitude;body.gpsStatus='OK';}
      }
    }catch(e){ if(body)body.gpsStatus=body.gpsStatus||'MISSING'; }
    return body;
  }

  async function callV1(action,body){
    body=body||{};
    body.token=localStorage.getItem('auth_token')||'';
    let res;
    try{
      res=await fetch(V1_API+'?action='+encodeURIComponent(action),{
        method:'POST',headers:{'Content-Type':'application/json;charset=utf-8'},body:JSON.stringify(body)
      });
    }catch(e){throw{code:'NETWORK_ERROR',message:'Không kết nối được máy chủ.'}}
    let json;
    try{json=await res.json()}catch(e){throw{code:'PARSE_ERROR',message:'Không đọc được phản hồi từ máy chủ.'}}
    if(!json.success)throw{code:json.errorCode||'UNKNOWN_ERROR',message:json.message||'Đã có lỗi xảy ra.'};
    return json.data;
  }

  Api.post=async function(action,body){
    body=body||{};
    if(['fuel','issue'].includes(action)){
      body=await tryGps(body);
      return originalPost(action,body);
    }
    if(['trip/start','trip/complete','shift/start','shift/end'].includes(action)){
      return callV1(action,body);
    }
    return originalPost(action,body);
  };
})();
