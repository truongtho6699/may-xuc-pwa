(function(){
'use strict';
const OPS_API='https://dnqhikwqihfxvezqzqzn.supabase.co/functions/v1/nghi-son-ops-api';
if(!window.Api||typeof Api.post!=='function')return;
const originalPost=Api.post.bind(Api);
Api.post=async function(action,body){
  if(action!=='fuel'&&action!=='issue')return originalPost(action,body);
  body=body||{};body.token=localStorage.getItem('auth_token')||'';
  let res;
  try{res=await fetch(OPS_API+'?action='+encodeURIComponent(action),{method:'POST',headers:{'Content-Type':'application/json;charset=utf-8'},body:JSON.stringify(body)});}catch(e){throw{code:'NETWORK_ERROR',message:'Không kết nối được máy chủ.'}}
  let json;try{json=await res.json()}catch(e){throw{code:'PARSE_ERROR',message:'Không đọc được phản hồi từ máy chủ.'}}
  if(!json.success)throw{code:json.errorCode||'UNKNOWN_ERROR',message:json.message||'Đã có lỗi xảy ra.'};
  return json.data;
};
})();
