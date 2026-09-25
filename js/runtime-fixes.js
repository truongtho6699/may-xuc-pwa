/** Các hàm tương thích dùng chung cho giao diện cũ/mới. */
async function gps(){
  try {
    if (typeof Gps === 'undefined' || !Gps || typeof Gps.getCurrentPosition !== 'function') return null;
    return await Gps.getCurrentPosition(3500);
  } catch (e) {
    // GPS là dữ liệu bổ sung, không chặn nghiệp vụ vận hành.
    return null;
  }
}

// V1 tối ưu: chỉ nạp các lớp đang dùng để giảm xung đột MutationObserver và request lặp.
(function(){
  const files=[
    ['ns-v1-api-router','js/v1-api-router.js?v=20260925-2'],
    ['ns-v1-fast-home','js/v1-fast-home.js?v=20260925-1'],
    ['ns-v1-pa2-media','js/v1-pa2-media.js?v=20260925-1']
  ];
  function load(i){
    if(i>=files.length)return;
    const [id,src]=files[i];
    if(document.getElementById(id)){load(i+1);return;}
    const s=document.createElement('script');s.id=id;s.src=src;s.async=false;s.onload=()=>load(i+1);s.onerror=()=>load(i+1);document.head.appendChild(s);
  }
  load(0);
})();
