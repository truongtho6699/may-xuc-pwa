/**
 * camera.js
 * Xử lý chụp/chọn ảnh trên điện thoại, resize, nén JPEG và đóng watermark.
 */
const Camera = (function () {
  const MAX_WIDTH = 1280;
  const TARGET_QUALITY_START = 0.85;
  const MIN_QUALITY = 0.5;
  const TARGET_MAX_BYTES = 800 * 1024;

  /**
   * Mở camera / thư viện ảnh.
   * Tạo input tạm gắn trực tiếp vào body thay vì phụ thuộc input hidden cố định.
   * Cách này ổn định hơn trên iOS Safari/PWA và Android WebView/Chrome.
   */
  function pickImage(inputElement) {
    return new Promise((resolve, reject) => {
      let input = inputElement;
      let temporary = false;

      // Nếu input cũ không tồn tại hoặc đang ở trạng thái không phù hợp,
      // tạo input mới ngay trong lần bấm của người dùng để giữ user gesture.
      if (!input || !(input instanceof HTMLInputElement) || input.type !== 'file') {
        input = document.createElement('input');
        temporary = true;
      }

      input.type = 'file';
      input.accept = 'image/*';
      input.setAttribute('capture', 'environment');
      input.value = '';

      // Không dùng display:none vì một số bản Safari/PWA không mở camera ổn định.
      // Đặt input ngoài màn hình nhưng vẫn thuộc DOM và có thể được kích hoạt.
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      input.style.top = '0';
      input.style.width = '1px';
      input.style.height = '1px';
      input.style.opacity = '0.01';
      input.style.pointerEvents = 'none';
      input.style.zIndex = '-1';

      if (!input.isConnected) {
        document.body.appendChild(input);
        temporary = true;
      }

      let settled = false;
      const cleanup = () => {
        input.onchange = null;
        input.oncancel = null;
        window.removeEventListener('focus', onFocusBack, true);
        if (temporary && input.parentNode) input.parentNode.removeChild(input);
      };
      const done = (file) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (file) resolve(file);
        else reject({ code: 'NO_IMAGE', message: 'Chưa chọn ảnh.' });
      };
      const onFocusBack = () => {
        // Safari không phải lúc nào cũng phát sự kiện cancel.
        // Chờ một nhịp để onchange có cơ hội chạy trước.
        setTimeout(() => {
          if (!settled && (!input.files || !input.files.length)) done(null);
        }, 600);
      };

      input.onchange = () => done(input.files && input.files[0] ? input.files[0] : null);
      input.oncancel = () => done(null);
      window.addEventListener('focus', onFocusBack, true);

      try {
        // click() phải chạy đồng bộ trong handler bấm nút để iOS cho phép mở camera.
        input.click();
      } catch (e) {
        cleanup();
        reject({ code: 'CAMERA_OPEN_ERROR', message: 'Không mở được camera. Vui lòng kiểm tra quyền Camera của trình duyệt.' });
      }
    });
  }

  async function processImage(file, watermarkInfo) {
    if (!file) throw { code: 'NO_IMAGE', message: 'Chưa chọn ảnh.' };
    if (file.type && !String(file.type).startsWith('image/')) {
      throw { code: 'INVALID_IMAGE', message: 'Tệp đã chọn không phải ảnh.' };
    }
    const img = await loadImageFromFile_(file);
    const canvas = drawResizedCanvas_(img);
    if (watermarkInfo) drawWatermark_(canvas, watermarkInfo);
    return await compressToTargetSize_(canvas);
  }

  function loadImageFromFile_(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = function () { reject({ code: 'IMAGE_LOAD_ERROR', message: 'Không đọc được ảnh.' }); };
        img.src = e.target.result;
      };
      reader.onerror = function () { reject({ code: 'FILE_READ_ERROR', message: 'Không đọc được tệp ảnh.' }); };
      reader.readAsDataURL(file);
    });
  }

  function drawResizedCanvas_(img) {
    const scale = Math.min(1, MAX_WIDTH / img.width);
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw { code: 'CANVAS_ERROR', message: 'Thiết bị không xử lý được ảnh.' };
    ctx.drawImage(img, 0, 0, w, h);
    return canvas;
  }

  function drawWatermark_(canvas, info) {
    const ctx = canvas.getContext('2d');
    const lines = [];
    if (info.machineId) lines.push(info.machineId);
    if (info.dateTimeText) lines.push(info.dateTimeText);
    if (info.userName) lines.push(info.userName);
    if (info.gpsText) lines.push(info.gpsText);
    if (!lines.length) return;

    const fontSize = Math.max(14, Math.round(canvas.width * 0.032));
    const lineHeight = fontSize * 1.35;
    const padding = 10;
    const boxHeight = lines.length * lineHeight + padding * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, canvas.height - boxHeight, canvas.width, boxHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = fontSize + 'px sans-serif';
    ctx.textBaseline = 'top';
    lines.forEach((line, idx) => ctx.fillText(line, padding, canvas.height - boxHeight + padding + idx * lineHeight));
  }

  function compressToTargetSize_(canvas) {
    return new Promise((resolve, reject) => {
      let quality = TARGET_QUALITY_START;
      function tryCompress() {
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64 = dataUrl.split(',')[1] || '';
          const sizeBytes = Math.round((base64.length * 3) / 4);
          if (sizeBytes <= TARGET_MAX_BYTES || quality <= MIN_QUALITY) resolve(base64);
          else { quality -= 0.1; tryCompress(); }
        } catch (e) {
          reject({ code: 'IMAGE_COMPRESS_ERROR', message: 'Không nén được ảnh.' });
        }
      }
      tryCompress();
    });
  }

  return { pickImage, processImage };
})();
