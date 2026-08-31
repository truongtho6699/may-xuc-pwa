/**
 * api.js
 * ------------------------------------------------------------
 * Lớp giao tiếp DUY NHẤT với backend (Apps Script Web App).
 * Toàn bộ phần còn lại của app không gọi fetch() trực tiếp,
 * mà gọi qua các hàm ở đây -> sau này đổi backend (vd sang
 * Node/Supabase) chỉ cần sửa file này.
 * ------------------------------------------------------------
 */

// ⚠️ SAU KHI DEPLOY WEB APP, DÁN URL VÀO ĐÂY (xem README.md mục "Bước 7")
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbzK_nPWnvyJh9gxu4gQ1o1K6KxGaxmgyB0MrmDsT7d_SACMsiaEYjTFWXTD1bfHDRY2/exec';

const Api = (function () {

  function getToken() {
    return localStorage.getItem('auth_token') || '';
  }

  /**
   * Gọi API GET (đọc dữ liệu).
   */
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

  /**
   * Gọi API POST (ghi dữ liệu).
   * Tự động gắn token vào body.
   */
  async function post(action, body) {
    body = body || {};
    body.token = getToken();
    var res = await fetch(API_BASE_URL + '?action=' + encodeURIComponent(action), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // tránh preflight CORS phức tạp với Apps Script
      body: JSON.stringify(body)
    });
    return parseResponse_(res);
  }

  async function parseResponse_(res) {
    var json;
    try {
      json = await res.json();
    } catch (e) {
      throw { code: 'PARSE_ERROR', message: 'Không đọc được phản hồi từ máy chủ.' };
    }
    if (!json.success) {
      throw { code: json.errorCode || 'UNKNOWN_ERROR', message: json.message || 'Đã có lỗi xảy ra.' };
    }
    return json.data;
  }

  // ---------------- API nghiệp vụ cụ thể ----------------

  async function login(phone, password) {
    var data = await post('login', { phone: phone, password: password });
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    return data.user;
  }

  async function logout() {
    try { await post('logout', {}); } catch (e) { /* dù lỗi vẫn xoá session local */ }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  function getCurrentUser() {
    var raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  }

  function isLoggedIn() {
    return !!getToken();
  }

  async function getMachines() {
    return get('machines', {});
  }

  async function getMachineById(machineId) {
    return get('machine', { machineId: machineId });
  }

  async function getCurrentShift() {
    return get('current-shift', {});
  }

  return {
    login: login,
    logout: logout,
    getCurrentUser: getCurrentUser,
    isLoggedIn: isLoggedIn,
    getMachines: getMachines,
    getMachineById: getMachineById,
    getCurrentShift: getCurrentShift,
    get: get,
    post: post
  };
})();
