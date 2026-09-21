/** Lấy vị trí tại thời điểm phát sinh nghiệp vụ; không theo dõi liên tục. */
const Gps=(function(){
function getCurrentPosition(timeoutMs){return new Promise((resolve,reject)=>{if(!('geolocation' in navigator)){reject({code:'GPS_UNSUPPORTED',message:'Thiết bị không hỗ trợ định vị.'});return;}navigator.geolocation.getCurrentPosition(pos=>resolve({latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy:pos.coords.accuracy}),()=>reject({code:'GPS_MISSING',message:'Không lấy được vị trí. Giao dịch vẫn có thể tiếp tục.'}),{enableHighAccuracy:true,timeout:timeoutMs||7000,maximumAge:30000});});}
return{getCurrentPosition};
})();
/** Helper dùng chung: GPS là thông tin bổ sung, không chặn nghiệp vụ khi không lấy được. */
async function gps(){try{return await Gps.getCurrentPosition(7000)}catch(e){return null}}
