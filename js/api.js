/**
 * api.js
 * Lớp giao tiếp duy nhất với backend Supabase Nghi Sơn.
 * Ảnh: ưu tiên Google Drive; Supabase chỉ lưu metadata liên kết.
 */

const API_BASE_URL = 'https://dnqhikwqihfxvezqzqzn.supabase.co/functions/v1/nghi-son-api';

const Api = (function () {
  function getToken() {
    return localStorage.getItem('auth_token') || '';
  }

  function driveUploadUrl_() {
    return (window.NGHI_SON_CONFIG && window.NGHI_SON_CONFIG.DRIVE_UPLOAD_URL) || '';
  }

  async function get(action, params) {
    params = params || {};
    params.action = action;
    params.token = getToken();
    var query = Object.keys(params)
      .filter(function (k) { return params[k] !== undefined && params[k] !== null; })
      .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); })
      .join('&');
    var res = await fetch(API_BASE_URL + '?' + query, { method: 'GET' });
    return parseResponse_(res);
  }

  async function post(action, body) {
    body = body || {};
    body.token = getToken();

    // Nếu đã cấu hình Drive Web App, tách toàn bộ ảnh base64 ra tải Drive trước.
    // Điều này áp dụng cả cho giao dịch gửi trực tiếp lẫn giao dịch offline gửi lại.
    body = await prepareDriveAttachments_(action, body);

    var res = await fetch(API_BASE_URL + '?action=' + encodeURIComponent(action), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      body: JSON.stringify(body)
    });
    return parseResponse_(res);
  }

  async function parseResponse_(res) {
    var json;
    try { json = await res.json(); }
    catch (e) { throw { code: 'PARSE_ERROR', message: 'Không đọc được phản hồi từ máy chủ.' }; }
    if (!json.success) throw { code: json.errorCode || 'UNKNOWN_ERROR', message: json.message || 'Đã có lỗi xảy ra.' };
    return json.data;
  }

  function imageFieldsForAction_(action, body) {
    var out = [];
    if (action === 'shift/start' && body.startImage) out.push({ key: 'startImage', label: 'start', base64: body.startImage, entityType: 'operation_session' });
    if (action === 'shift/end' && body.endImage) out.push({ key: 'endImage', label: 'end', base64: body.endImage, entityType: 'operation_session' });
    if (action === 'fuel') {
      if (body.imagePump) out.push({ key: 'imagePump', label: 'pump', base64: body.imagePump, entityType: 'fuel_log' });
      if (body.imageHourMeter) out.push({ key: 'imageHourMeter', label: 'meter', base64: body.imageHourMeter, entityType: 'fuel_log' });
      if (body.imageReceipt) out.push({ key: 'imageReceipt', label: 'receipt', base64: body.imageReceipt, entityType: 'fuel_log' });
    }
    if (action === 'grease' && body.image) out.push({ key: 'image', label: 'image-1', base64: body.image, entityType: 'maintenance_log' });
    if (action === 'issue' && Array.isArray(body.images)) {
      body.images.forEach(function (img, i) { if (img) out.push({ key: 'images', index: i, label: 'image-' + (i + 1), base64: img, entityType: 'maintenance_log' }); });
    }
    return out;
  }

  async function prepareDriveAttachments_(action, body) {
    var url = driveUploadUrl_();
    if (!url) return body; // chưa triển khai Drive Web App -> backend vẫn fallback Supabase Storage

    var fields = imageFieldsForAction_(action, body);
    if (!fields.length) return body;

    var copy = Object.assign({}, body);
    var driveAttachments = [];

    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var clientFileId = crypto.randomUUID();
      var uploaded = await uploadDriveImage_({
        base64: f.base64,
        label: f.label,
        entityType: f.entityType,
        entityId: copy.clientTransactionId || clientFileId,
        clientFileId: clientFileId
      });
      driveAttachments.push(uploaded);

      if (f.key === 'images') {
        if (!Array.isArray(copy.images)) copy.images = [];
        copy.images[f.index] = null;
      } else {
        copy[f.key] = null;
      }
    }

    copy.driveAttachments = (copy.driveAttachments || []).concat(driveAttachments);
    if (Array.isArray(copy.images)) copy.images = copy.images.filter(Boolean);
    return copy;
  }

  async function uploadDriveImage_(info) {
    var url = driveUploadUrl_();
    if (!url) throw { code: 'DRIVE_NOT_CONFIGURED', message: 'Chưa cấu hình dịch vụ lưu ảnh Google Drive.' };

    var res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: getToken(),
        base64: info.base64,
        label: info.label,
        entityType: info.entityType,
        entityId: info.entityId,
        clientFileId: info.clientFileId
      })
    });
    var json;
    try { json = await res.json(); }
    catch (e) { throw { code: 'DRIVE_PARSE_ERROR', message: 'Không đọc được phản hồi tải ảnh Drive.' }; }
    if (!json.success) throw { code: 'DRIVE_UPLOAD_ERROR', message: json.message || 'Không tải được ảnh lên Google Drive.' };
    return json.data;
  }

  function normalizePhone_(phone) {
    var p = String(phone || '').trim().replace(/[\s.\-()]/g, '');
    if (p.indexOf('+84') === 0) p = '0' + p.slice(3);
    else if (p.indexOf('84') === 0 && p.length === 11) p = '0' + p.slice(2);
    return p;
  }

  async function login(phone, password) {
    var normalizedPhone = normalizePhone_(phone);
    if (!/^0\d{9}$/.test(normalizedPhone)) {
      throw { code: 'INVALID_PHONE', message: 'Số điện thoại phải gồm 10 số và bắt đầu bằng 0.' };
    }
    var data = await post('login', { phone: normalizedPhone, password: password });
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    return data.user;
  }

  async function logout() {
    try { await post('logout', {}); } catch (e) {}
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('cache_machines');
  }

  function getCurrentUser() {
    var raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  }

  function isLoggedIn() { return !!getToken(); }

  async function getMachines(forceRefresh) {
    var CACHE_KEY = 'cache_machines';
    var CACHE_TTL_MS = 5 * 60 * 1000;
    if (!forceRefresh) {
      try {
        var cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) return cached.data;
      } catch (e) {}
    }
    var data = await get('machines', {});
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data })); } catch (e) {}
    return data;
  }

  async function getMachineById(machineId) { return get('machine', { machineId: machineId }); }
  async function getCurrentShift() { return get('current-shift', {}); }

  return {
    login: login,
    logout: logout,
    getCurrentUser: getCurrentUser,
    isLoggedIn: isLoggedIn,
    getMachines: getMachines,
    getMachineById: getMachineById,
    getCurrentShift: getCurrentShift,
    get: get,
    post: post,
    uploadDriveImage: uploadDriveImage_
  };
})();
