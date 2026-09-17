/**
 * api.js
 * ------------------------------------------------------------
 * Lớp giao tiếp DUY NHẤT với backend Supabase Nghi Sơn.
 * Toàn bộ phần còn lại của app không gọi fetch() trực tiếp,
 * mà gọi qua các hàm ở đây.
 * ------------------------------------------------------------
 */

const API_BASE_URL = 'https://dnqhikwqihfxvezqzqzn.supabase.co/functions/v1/nghi-son-api';

const Api = (function () {

  function getToken() {
    return localStorage.getItem('auth_token') || '';
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
    var res = await fetch(API_BASE_URL + '?action=' + encodeURIComponent(action), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
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
    localStorage.removeItem('cache_machines');
  }

  function getCurrentUser() {
    var raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  }

  function isLoggedIn() {
    return !!getToken();
  }

  async function getMachines(forceRefresh) {
    var CACHE_KEY = 'cache_machines';
    var CACHE_TTL_MS = 5 * 60 * 1000;

    if (!forceRefresh) {
      try {
        var cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
          return cached.data;
        }
      } catch (e) { /* cache hỏng -> gọi lại máy chủ */ }
    }

    var data = await get('machines', {});
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (e) { /* bỏ qua nếu bộ nhớ đầy */ }
    return data;
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
