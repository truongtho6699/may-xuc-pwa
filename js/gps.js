/**
 * gps.js
 * ------------------------------------------------------------
 * Lấy vị trí GPS tại các thời điểm sự kiện (mục 15):
 * bắt đầu ca, cấp dầu, báo sự cố, bơm mỡ, kết thúc ca.
 * KHÔNG theo dõi vị trí realtime liên tục.
 * ------------------------------------------------------------
 */

const Gps = (function () {

  /**
   * Lấy vị trí hiện tại 1 lần.
   * Trả về { latitude, longitude, accuracy } hoặc throw lỗi thân thiện.
   */
  function getCurrentPosition(timeoutMs) {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject({ code: 'GPS_UNSUPPORTED', message: 'Thiết bị không hỗ trợ định vị GPS.' });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
        },
        (err) => {
          // Không dùng thông báo lỗi kỹ thuật (mục 33) - luôn trả thông báo dễ hiểu
          reject({
            code: 'GPS_DENIED',
            message: 'Vui lòng bật vị trí (GPS) để thực hiện giao dịch.'
          });
        },
        {
          enableHighAccuracy: true,
          timeout: timeoutMs || 10000,
          maximumAge: 0
        }
      );
    });
  }

  return { getCurrentPosition: getCurrentPosition };
})();
