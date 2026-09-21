/** Các hàm tương thích dùng chung cho giao diện cũ/mới. */
async function gps(){
  try {
    if (typeof Gps === 'undefined' || !Gps || typeof Gps.getCurrentPosition !== 'function') return null;
    return await Gps.getCurrentPosition(7000);
  } catch (e) {
    // GPS là dữ liệu bổ sung, không chặn nghiệp vụ vận hành.
    return null;
  }
}
