/**
 * qr.js
 * ------------------------------------------------------------
 * Quét QR trên máy để tự nhận MACHINE_ID (mục 14), tránh bắt
 * người dùng chọn lại thủ công.
 *
 * Dùng thư viện jsQR (tải qua CDN trong index.html). Nếu thiết bị
 * không có camera hoặc người dùng từ chối quyền, phần gọi chức
 * năng này luôn có lựa chọn "chọn thủ công" (select dropdown) để
 * dự phòng - không phụ thuộc hoàn toàn vào QR.
 * ------------------------------------------------------------
 */

const QrScanner = (function () {

  /**
   * Mở modal quét QR toàn màn hình, trả về MACHINE_ID nhận diện được.
   * Tự đóng modal khi quét thành công hoặc khi người dùng bấm đóng.
   */
  function scan() {
    return new Promise((resolve, reject) => {
      if (typeof jsQR === 'undefined') {
        reject({ code: 'QR_LIB_UNAVAILABLE', message: 'Không tải được thư viện quét QR. Vui lòng chọn máy thủ công.' });
        return;
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        reject({ code: 'CAMERA_UNSUPPORTED', message: 'Thiết bị không hỗ trợ camera. Vui lòng chọn máy thủ công.' });
        return;
      }

      var modal = document.createElement('div');
      modal.className = 'qr-modal';
      modal.innerHTML = `
        <video playsinline autoplay muted></video>
        <p class="qr-hint">Đưa camera vào mã QR trên máy</p>
        <button class="qr-close">✕ Đóng</button>
      `;
      document.body.appendChild(modal);

      var video = modal.querySelector('video');
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      var stream = null;
      var stopped = false;

      function cleanup() {
        stopped = true;
        if (stream) stream.getTracks().forEach((t) => t.stop());
        modal.remove();
      }

      modal.querySelector('.qr-close').addEventListener('click', function () {
        cleanup();
        reject({ code: 'QR_CANCELLED', message: 'Đã huỷ quét QR.' });
      });

      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          video.srcObject = stream;
          video.setAttribute('playsinline', true);
          video.play();
          requestAnimationFrame(tick);
        })
        .catch(() => {
          cleanup();
          reject({ code: 'CAMERA_DENIED', message: 'Vui lòng cấp quyền camera để quét QR, hoặc chọn máy thủ công.' });
        });

      function tick() {
        if (stopped) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          var code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            var machineId = parseMachineId_(code.data);
            if (machineId) {
              cleanup();
              resolve(machineId);
              return;
            }
          }
        }
        requestAnimationFrame(tick);
      }
    });
  }

  /**
   * QR chứa dạng "MACHINE_ID=EX03" (mục 14). Cũng chấp nhận QR chỉ
   * chứa mã máy thuần (vd "EX03") để linh hoạt hơn khi in QR thực tế.
   */
  function parseMachineId_(rawText) {
    var text = (rawText || '').trim();
    var match = text.match(/MACHINE_ID\s*=\s*([A-Za-z0-9\-_]+)/i);
    if (match) return match[1];
    if (/^[A-Za-z0-9\-_]{2,20}$/.test(text)) return text;
    return null;
  }

  return { scan: scan };
})();
