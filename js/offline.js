/**
 * offline.js
 * ------------------------------------------------------------
 * Quản lý hàng đợi giao dịch offline bằng IndexedDB (mục 16).
 *
 * Nguyên tắc:
 * - Mọi giao dịch (đổ dầu, báo sự cố, bơm mỡ, bắt đầu/kết thúc ca...)
 *   được lưu tạm vào IndexedDB với CLIENT_TRANSACTION_ID (UUID) NGAY
 *   khi người dùng bấm xác nhận, KHÔNG chờ có mạng.
 * - Trạng thái ban đầu: PENDING_SYNC.
 * - Khi có mạng (sự kiện 'online' hoặc kiểm tra định kỳ), tự động gửi
 *   từng giao dịch trong hàng đợi lên server.
 * - Backend kiểm tra CLIENT_TRANSACTION_ID trước khi insert để
 *   chống ghi trùng nếu request được gửi lại nhiều lần.
 *
 * LƯU Ý: Khung sườn này được chuẩn bị đầy đủ ở Phase 1, và sẽ được
 * dùng thực tế từ Phase 3 trở đi khi có API tạo giao dịch (shift/fuel/
 * issue/grease).
 * ------------------------------------------------------------
 */

const OfflineQueue = (function () {
  const DB_NAME = 'may_xuc_offline_db';
  const DB_VERSION = 1;
  const STORE_NAME = 'pending_transactions';

  let dbPromise = null;

  function openDb_() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          var store = db.createObjectStore(STORE_NAME, { keyPath: 'clientTransactionId' });
          store.createIndex('status', 'status', { unique: false });
        }
      };
      req.onsuccess = function (e) { resolve(e.target.result); };
      req.onerror = function (e) { reject(e.target.error); };
    });
    return dbPromise;
  }

  /**
   * Thêm 1 giao dịch mới vào hàng đợi offline.
   * @param {string} apiAction - action gọi tới backend (vd 'fuel', 'issue')
   * @param {object} payload - dữ liệu gửi kèm (đã có sẵn CLIENT_TRANSACTION_ID nếu cần)
   */
  async function enqueue(apiAction, payload) {
    var db = await openDb_();
    var clientTransactionId = payload.clientTransactionId || crypto.randomUUID();
    payload.clientTransactionId = clientTransactionId;

    var record = {
      clientTransactionId: clientTransactionId,
      apiAction: apiAction,
      payload: payload,
      status: 'PENDING_SYNC',
      createdAt: new Date().toISOString(),
      attempts: 0
    };

    return new Promise((resolve, reject) => {
      var tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = function () { resolve(record); };
      tx.onerror = function (e) { reject(e.target.error); };
    });
  }

  async function getAllPending() {
    var db = await openDb_();
    return new Promise((resolve, reject) => {
      var tx = db.transaction(STORE_NAME, 'readonly');
      var req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = function () {
        resolve(req.result.filter((r) => r.status === 'PENDING_SYNC'));
      };
      req.onerror = function (e) { reject(e.target.error); };
    });
  }

  async function markSynced(clientTransactionId) {
    var db = await openDb_();
    return new Promise((resolve, reject) => {
      var tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(clientTransactionId); // đồng bộ xong -> xoá khỏi hàng đợi local
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function (e) { reject(e.target.error); };
    });
  }

  async function markFailedAttempt(clientTransactionId) {
    var db = await openDb_();
    return new Promise((resolve, reject) => {
      var tx = db.transaction(STORE_NAME, 'readwrite');
      var store = tx.objectStore(STORE_NAME);
      var req = store.get(clientTransactionId);
      req.onsuccess = function () {
        var record = req.result;
        if (record) {
          record.attempts += 1;
          store.put(record);
        }
        resolve();
      };
      req.onerror = function (e) { reject(e.target.error); };
    });
  }

  async function countPending() {
    var pending = await getAllPending();
    return pending.length;
  }

  /**
   * Cố gắng đồng bộ toàn bộ giao dịch đang chờ lên server.
   * Trả về { success, failed } số lượng.
   */
  async function syncAll(onProgress) {
    var pending = await getAllPending();
    var success = 0, failed = 0;

    for (var i = 0; i < pending.length; i++) {
      var record = pending[i];
      try {
        await Api.post(record.apiAction, record.payload);
        await markSynced(record.clientTransactionId);
        success++;
      } catch (err) {
        await markFailedAttempt(record.clientTransactionId);
        failed++;
      }
      if (onProgress) onProgress(i + 1, pending.length);
    }

    return { success: success, failed: failed };
  }

  return {
    enqueue: enqueue,
    getAllPending: getAllPending,
    markSynced: markSynced,
    countPending: countPending,
    syncAll: syncAll
  };
})();
