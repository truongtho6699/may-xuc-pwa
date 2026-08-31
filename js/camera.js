/**
 * camera.js
 * ------------------------------------------------------------
 * Xử lý ảnh chụp từ camera điện thoại (mục 17, 18):
 * - Resize chiều rộng tối đa ~1280px.
 * - Nén JPEG, mục tiêu 300KB-800KB.
 * - Đóng watermark: MACHINE_ID, DateTime, User, GPS.
 *
 * Đây là khung sườn dùng chung cho các màn hình cần chụp ảnh
 * ở Phase 3-5 (bắt đầu ca, đổ dầu, báo sự cố, bơm mỡ).
 * ------------------------------------------------------------
 */

const Camera = (function () {
  const MAX_WIDTH = 1280;
  const TARGET_QUALITY_START = 0.85;
  const MIN_QUALITY = 0.5;
  const TARGET_MAX_BYTES = 800 * 1024;

  /**
   * Mở camera / thư viện ảnh của điện thoại qua <input type="file" capture="environment">
   * Trả về File object người dùng chọn/chụp.
   */
  function pickImage(inputElement) {
    return new Promise((resolve, reject) => {
      inputElement.value = '';
      inputElement.onchange = function () {
        if (inputElement.files && inputElement.files[0]) {
          resolve(inputElement.files[0]);
        } else {
          reject({ code: 'NO_IMAGE', message: 'Chưa chọn ảnh.' });
        }
      };
      inputElement.click();
    });
  }

  /**
   * Resize + nén ảnh, trả về base64 (không kèm prefix) sẵn sàng gửi lên backend.
   * @param {File} file
   * @param {object} watermarkInfo - { machineId, dateTimeText, userName, gpsText }
   */
  async function processImage(file, watermarkInfo) {
    var img = await loadImageFromFile_(file);
    var canvas = drawResizedCanvas_(img);

    if (watermarkInfo) {
      drawWatermark_(canvas, watermarkInfo);
    }

    var base64 = await compressToTargetSize_(canvas);
    return base64; // chuỗi base64 thuần, KHÔNG có "data:image/jpeg;base64,"
  }

  function loadImageFromFile_(file) {
    return new Promise((resolve, reject) => {
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject({ code: 'IMAGE_LOAD_ERROR', message: 'Không đọc được ảnh.' }); };
        img.src = e.target.result;
      };
      reader.onerror = function () { reject({ code: 'FILE_READ_ERROR', message: 'Không đọc được tệp ảnh.' }); };
      reader.readAsDataURL(file);
    });
  }

  function drawResizedCanvas_(img) {
    var scale = Math.min(1, MAX_WIDTH / img.width);
    var w = Math.round(img.width * scale);
    var h = Math.round(img.height * scale);

    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    return canvas;
  }

  function drawWatermark_(canvas, info) {
    var ctx = canvas.getContext('2d');
    var lines = [];
    if (info.machineId) lines.push(info.machineId);
    if (info.dateTimeText) lines.push(info.dateTimeText);
    if (info.userName) lines.push(info.userName);
    if (info.gpsText) lines.push(info.gpsText);
    if (lines.length === 0) return;

    var fontSize = Math.max(14, Math.round(canvas.width * 0.032));
    var lineHeight = fontSize * 1.35;
    var padding = 10;
    var boxHeight = lines.length * lineHeight + padding * 2;

    // Nền mờ phía dưới ảnh (không che nội dung chính - mục 18)
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, canvas.height - boxHeight, canvas.width, boxHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = fontSize + 'px sans-serif';
    ctx.textBaseline = 'top';

    lines.forEach(function (line, idx) {
      ctx.fillText(line, padding, canvas.height - boxHeight + padding + idx * lineHeight);
    });
  }

  function compressToTargetSize_(canvas) {
    return new Promise((resolve) => {
      var quality = TARGET_QUALITY_START;

      function tryCompress() {
        var dataUrl = canvas.toDataURL('image/jpeg', quality);
        var base64 = dataUrl.split(',')[1];
        var sizeBytes = Math.round((base64.length * 3) / 4);

        if (sizeBytes <= TARGET_MAX_BYTES || quality <= MIN_QUALITY) {
          resolve(base64);
        } else {
          quality -= 0.1;
          tryCompress();
        }
      }
      tryCompress();
    });
  }

  return { pickImage: pickImage, processImage: processImage };
})();
