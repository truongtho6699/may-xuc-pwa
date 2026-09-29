// GPS offline: ưu tiên tọa độ hiện tại, fallback vị trí gần nhất đã lưu trước khi đưa giao dịch vào IndexedDB.
(function(){
'use strict';
if(window.__NS_OFFLINE_GPS_FALLBACK)return;window.__NS_OFFLINE_GPS_FALLBACK=true;
const LAST_KEY='ns_last_known_gps_v2';
let watchId=null;
function save(g){try{if(!g||g.latitude==null||g.longitude==null)return;localStorage.setItem(LAST_KEY,JSON.stringify({latitude:Number(g.latitude),longitude:Number(g.longitude),accuracy:g.accuracy==null?null:Number(g.accuracy),capturedAt:g.capturedAt||new Date().toISOString()}))}catch(e){}}
function fromPos(pos){return{latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy:pos.coords.accuracy,capturedAt:new Date(pos.timestamp||Date.now()).toISOString(),ageSeconds:0,source:'CURRENT',gpsStatus:'OK'}}
function startWatch(){if(watchId!=null||!('geolocation'in navigator))return;try{watchId=navigator.geolocation.watchPosition(p=>save(fromPos(p)),()=>{}, {enableHighAccuracy:true,maximumAge:60000,timeout:12000})}catch(e){}}
function stopWatch(){if(watchId==null||!navigator.geolocation)return;try{navigator.geolocation.clearWatch(watchId)}catch(e){}watchId=null}
function threshold(action){return action==='fuel'||action==='issue'?5*60*1000:10*60*1000}
async function best(action){try{if(typeof Gps!=='undefined'&&Gps&&typeof Gps.getBestPosition==='function')return await Gps.getBestPosition(2800,threshold(action))}catch(e){}return null}
function enrich(payload,g){payload=payload||{};if(!g)return Object.assign(payload,{gpsStatus:payload.gpsStatus||'MISSING',gpsSource:payload.gpsSource||'MISSING'});payload.lat=g.latitude;payload.lng=g.longitude;payload.latitude=g.latitude;payload.longitude=g.longitude;payload.gpsStatus=g.source==='LAST_KNOWN'?'LAST_KNOWN':'OK';payload.gpsSource=g.source||'CURRENT';payload.gpsAgeSeconds=Number(g.ageSeconds||0);payload.gpsAccuracy=g.accuracy==null?null:Number(g.accuracy);payload.gpsCapturedAt=g.capturedAt||new Date().toISOString();save(g);return payload}
function wrapQueue(){if(typeof OfflineQueue==='undefined'||!OfflineQueue||OfflineQueue.__gpsFallbackWrapped||typeof OfflineQueue.enqueue!=='function')return false;const orig=OfflineQueue.enqueue.bind(OfflineQueue);OfflineQueue.enqueue=async function(action,payload){if(['trip/start','trip/complete','shift/start','shift/end','fuel','issue'].includes(action)){payload=enrich(payload,await best(action))}return orig(action,payload)};OfflineQueue.__gpsFallbackWrapped=true;return true}
function boot(){startWatch();if(!wrapQueue()){let n=0;const t=setInterval(()=>{n++;if(wrapQueue()||n>30)clearInterval(t)},150)}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopWatch();else startWatch()});window.addEventListener('focus',startWatch);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
