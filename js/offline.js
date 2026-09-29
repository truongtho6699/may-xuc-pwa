/** Hàng đợi offline IndexedDB - gửi tuần tự và giữ thứ tự giao dịch. */
const OfflineQueue=(function(){
const DB_NAME='may_xuc_offline_db',DB_VERSION=2,STORE_NAME='pending_transactions';let dbPromise=null;
function openDb_(){if(dbPromise)return dbPromise;dbPromise=new Promise((resolve,reject)=>{var r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=e=>{var db=e.target.result;if(!db.objectStoreNames.contains(STORE_NAME)){var s=db.createObjectStore(STORE_NAME,{keyPath:'clientTransactionId'});s.createIndex('status','status',{unique:false})}};r.onsuccess=e=>resolve(e.target.result);r.onerror=e=>reject(e.target.error)});return dbPromise}
function gpsLimit_(action){return ['fuel','issue'].includes(action)?5*60*1000:10*60*1000}
function shouldGps_(action){return ['trip/start','trip/complete','shift/start','shift/end','fuel','issue'].includes(action)}
async function enrichQueuedGps_(id,action){if(!shouldGps_(action)||typeof Gps==='undefined'||!Gps||typeof Gps.getBestPosition!=='function')return;try{const g=await Gps.getBestPosition(2800,gpsLimit_(action));if(!g)return;var db=await openDb_();await new Promise((resolve,reject)=>{var tx=db.transaction(STORE_NAME,'readwrite'),store=tx.objectStore(STORE_NAME),r=store.get(id);r.onsuccess=()=>{var rec=r.result;if(!rec){resolve();return}rec.payload=rec.payload||{};rec.payload.lat=g.latitude;rec.payload.lng=g.longitude;rec.payload.accuracy=g.accuracy;rec.payload.gpsStatus=g.gpsStatus||'OK';rec.payload.gpsSource=g.source||'CURRENT';rec.payload.gpsAgeSeconds=g.ageSeconds||0;rec.payload.gpsCapturedAt=g.capturedAt||new Date().toISOString();store.put(rec)};tx.oncomplete=resolve;tx.onerror=e=>reject(e.target.error)})}catch(e){}
}
async function enqueue(apiAction,payload){var db=await openDb_();var id=payload.clientTransactionId||crypto.randomUUID();payload.clientTransactionId=id;var rec={clientTransactionId:id,apiAction,payload,status:'PENDING_SYNC',createdAt:new Date().toISOString(),attempts:0,lastError:null};var saved=await new Promise((resolve,reject)=>{var tx=db.transaction(STORE_NAME,'readwrite');tx.objectStore(STORE_NAME).put(rec);tx.oncomplete=()=>resolve(rec);tx.onerror=e=>reject(e.target.error)});if(!navigator.onLine&&shouldGps_(apiAction)){enrichQueuedGps_(id,apiAction)}return saved}
async function all(){var db=await openDb_();return new Promise((resolve,reject)=>{var tx=db.transaction(STORE_NAME,'readonly'),r=tx.objectStore(STORE_NAME).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=e=>reject(e.target.error)})}
async function getAllPending(){return (await all()).filter(r=>r.status==='PENDING_SYNC').sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt))}
async function put(rec){var db=await openDb_();return new Promise((resolve,reject)=>{var tx=db.transaction(STORE_NAME,'readwrite');tx.objectStore(STORE_NAME).put(rec);tx.oncomplete=resolve;tx.onerror=e=>reject(e.target.error)})}
async function markSynced(id){var db=await openDb_();return new Promise((resolve,reject)=>{var tx=db.transaction(STORE_NAME,'readwrite');tx.objectStore(STORE_NAME).delete(id);tx.oncomplete=resolve;tx.onerror=e=>reject(e.target.error)})}
async function markError(rec,err,finalError){rec.attempts=(rec.attempts||0)+1;rec.lastError=(err&&err.message)||String(err||'');rec.status=finalError?'NEEDS_ATTENTION':'PENDING_SYNC';await put(rec)}
async function countPending(){return (await getAllPending()).length}
async function countAttention(){return (await all()).filter(r=>r.status==='NEEDS_ATTENTION').length}
async function syncAll(onProgress){var p=await getAllPending(),success=0,failed=0;for(var i=0;i<p.length;i++){var r=p[i];try{await Api.post(r.apiAction,r.payload);await markSynced(r.clientTransactionId);success++}catch(err){var code=err&&err.code||'';
if((code==='NO_ACTIVE_SHIFT'||code==='NO_ACTIVE_TRIP')&&(r.attempts||0)>0){await markSynced(r.clientTransactionId);success++;continue}
var business=!!code&&code!=='PARSE_ERROR'&&code!=='NETWORK_ERROR';await markError(r,err,business);failed++;if(!business)break}
if(onProgress)onProgress(i+1,p.length)}return{success,failed,attention:await countAttention()}}
return{enqueue,getAllPending,markSynced,countPending,countAttention,syncAll};
})();