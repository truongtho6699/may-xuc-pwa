/** GPS nghiệp vụ: lấy vị trí hiện tại kể cả offline, có fallback vị trí gần nhất đã lưu. */
const Gps=(function(){
const LAST_KEY='ns_last_known_gps_v2';
function now(){return Date.now()}
function saveLast_(g){try{localStorage.setItem(LAST_KEY,JSON.stringify({latitude:g.latitude,longitude:g.longitude,accuracy:g.accuracy||null,capturedAt:g.capturedAt||new Date().toISOString()}))}catch(e){}return g}
function readLast_(){try{return JSON.parse(localStorage.getItem(LAST_KEY)||'null')}catch(e){return null}}
function getLastKnown(maxAgeMs){const x=readLast_();if(!x||x.latitude==null||x.longitude==null||!x.capturedAt)return null;const age=Math.max(0,now()-new Date(x.capturedAt).getTime());if(maxAgeMs!=null&&age>maxAgeMs)return null;return{latitude:Number(x.latitude),longitude:Number(x.longitude),accuracy:x.accuracy==null?null:Number(x.accuracy),capturedAt:x.capturedAt,ageSeconds:Math.round(age/1000),source:'LAST_KNOWN',gpsStatus:'LAST_KNOWN'} }
function getCurrentPosition(timeoutMs){return new Promise((resolve,reject)=>{if(!('geolocation' in navigator)){reject({code:'GPS_UNSUPPORTED',message:'Thiết bị không hỗ trợ định vị.'});return;}navigator.geolocation.getCurrentPosition(pos=>{const g={latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy:pos.coords.accuracy,capturedAt:new Date(pos.timestamp||Date.now()).toISOString(),ageSeconds:0,source:'CURRENT',gpsStatus:'OK'};saveLast_(g);resolve(g)},()=>reject({code:'GPS_MISSING',message:'Không lấy được vị trí. Giao dịch vẫn có thể tiếp tục.'}),{enableHighAccuracy:true,timeout:timeoutMs||7000,maximumAge:0});});}
async function getBestPosition(timeoutMs,maxAgeMs){try{return await getCurrentPosition(timeoutMs||3500)}catch(e){const last=getLastKnown(maxAgeMs==null?600000:maxAgeMs);if(last)return last;throw e}}
return{getCurrentPosition,getBestPosition,getLastKnown};
})();
/** Helper dùng chung: ưu tiên GPS hiện tại, fallback vị trí gần nhất <= 10 phút. */
async function gps(){try{return await Gps.getBestPosition(3500,10*60*1000)}catch(e){return null}}
