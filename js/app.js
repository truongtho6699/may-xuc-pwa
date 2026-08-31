/**
 * app.js
 * ------------------------------------------------------------
 * Logic chính của PWA: điều hướng màn hình (SPA đơn giản, không
 * dùng framework), xử lý đăng nhập, hiển thị Trang chủ, bottom
 * navigation, trạng thái mạng, toast thông báo.
 *
 * PHASE 1: chỉ có màn hình Đăng nhập + Trang chủ (shell) + Tài khoản.
 * Các nút nghiệp vụ (Bắt đầu ca, Đổ dầu, Báo sự cố, Bơm mỡ, Kết thúc
 * ca) hiện dẫn tới màn hình "Đang xây dựng" - sẽ được nối vào đúng
 * luồng nghiệp vụ ở Phase 3-5.
 * ------------------------------------------------------------
 */

(function () {

  var appEl = document.getElementById('app');

  // ---------------- Toast ----------------
  function showToast(message, type) {
    var container = document.getElementById('toast-container');
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || '');
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // ---------------- Trạng thái mạng ----------------
  function updateNetworkStatus() {
    var el = document.getElementById('network-status');
    if (!el) return;
    if (navigator.onLine) {
      el.textContent = '🟢 Online';
      el.classList.remove('offline');
    } else {
      el.textContent = '🟠 Offline';
      el.classList.add('offline');
    }
    updateSyncBanner();
  }

  async function updateSyncBanner() {
    var banner = document.getElementById('sync-banner');
    if (!banner) return;
    var count = await OfflineQueue.countPending();
    if (count > 0) {
      banner.classList.add('show');
      banner.querySelector('.sync-text').textContent = 'Có ' + count + ' giao dịch chờ đồng bộ.';
    } else {
      banner.classList.remove('show');
    }
  }

  async function handleSyncNow() {
    if (!navigator.onLine) {
      showToast('Vui lòng kiểm tra mạng và thử lại.', 'error');
      return;
    }
    showToast('Đang đồng bộ dữ liệu...', '');
    var result = await OfflineQueue.syncAll();
    await updateSyncBanner();
    if (result.failed === 0) {
      showToast('🟢 Đã đồng bộ ' + result.success + ' giao dịch.', 'success');
    } else {
      showToast('Đồng bộ ' + result.success + ' thành công, ' + result.failed + ' thất bại.', 'warning');
    }
  }

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);

  // ---------------- Router đơn giản ----------------
  var routes = {
    login: renderLogin,
    home: renderHome,
    account: renderAccount,
    placeholder: renderPlaceholder
  };

  var currentRoute = 'login';
  var placeholderContext = {};

  function navigate(route, context) {
    currentRoute = route;
    placeholderContext = context || {};
    render();
  }
  window.navigate = navigate; // để onclick trong HTML gọi được

  function render() {
    var screenEl = document.getElementById('screen');
    var bottomNav = document.getElementById('bottom-nav');

    if (!Api.isLoggedIn() && currentRoute !== 'login') {
      currentRoute = 'login';
    }

    if (currentRoute === 'login') {
      bottomNav.classList.add('hidden');
    } else {
      bottomNav.classList.remove('hidden');
      updateActiveNavButton();
    }

    screenEl.innerHTML = '';
    routes[currentRoute](screenEl);
  }

  function updateActiveNavButton() {
    document.querySelectorAll('#bottom-nav button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.route === currentRoute);
    });
  }

  // ---------------- Màn hình: Đăng nhập ----------------
  function renderLogin(container) {
    var wrap = document.createElement('div');
    wrap.className = 'screen login-screen';
    wrap.innerHTML = `
      <div class="login-logo">🚜</div>
      <h1 class="login-title">Nhật Ký Vận Hành Máy</h1>
      <p class="login-subtitle">Đăng nhập để bắt đầu ca làm việc</p>

      <div class="form-error" id="login-error"></div>

      <div class="field">
        <label>Số điện thoại</label>
        <input type="tel" id="login-phone" inputmode="numeric" placeholder="Ví dụ: 0900000003" autocomplete="off">
      </div>
      <div class="field">
        <label>Mật khẩu</label>
        <input type="password" id="login-password" placeholder="Nhập mật khẩu">
      </div>
      <button class="btn-primary" id="login-btn">ĐĂNG NHẬP</button>

      <div class="demo-hint">
        <b>Tài khoản demo (mật khẩu: 123456)</b>
        0900000001 – Admin<br>
        0900000002 – Quản lý<br>
        0900000003 – Lái máy<br>
        0900000004 – Cấp dầu
      </div>
    `;
    container.appendChild(wrap);

    var btn = wrap.querySelector('#login-btn');
    var errorEl = wrap.querySelector('#login-error');

    btn.addEventListener('click', async function () {
      var phone = wrap.querySelector('#login-phone').value.trim();
      var password = wrap.querySelector('#login-password').value;
      errorEl.classList.remove('show');

      if (!phone || !password) {
        errorEl.textContent = 'Vui lòng nhập đầy đủ số điện thoại và mật khẩu.';
        errorEl.classList.add('show');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Đang đăng nhập...';

      try {
        await Api.login(phone, password);
        showToast('Đăng nhập thành công 👋', 'success');
        navigate('home');
      } catch (err) {
        errorEl.textContent = err.message || 'Không thể đăng nhập. Vui lòng thử lại.';
        errorEl.classList.add('show');
      } finally {
        btn.disabled = false;
        btn.textContent = 'ĐĂNG NHẬP';
      }
    });
  }

  // ---------------- Màn hình: Trang chủ (Driver) ----------------
  async function renderHome(container) {
    var user = Api.getCurrentUser();
    var wrap = document.createElement('div');
    wrap.className = 'screen';

    wrap.innerHTML = `
      <div class="app-header">
        <p class="greeting">Xin chào</p>
        <p class="user-name">${escapeHtml_(user ? user.FULL_NAME : '')}</p>
        <div class="header-info-row">
          <div class="info-chip">
            <p class="label">Máy đang vận hành</p>
            <p class="value" id="header-machine">— </p>
          </div>
          <div class="info-chip">
            <p class="label">Trạng thái ca</p>
            <p class="value" id="header-shift-status">⚪ Chưa bắt đầu</p>
          </div>
        </div>
      </div>

      <div class="action-list" id="action-list">
        <div class="loading-wrap"><div class="spinner"></div> Đang tải...</div>
      </div>
    `;
    container.appendChild(wrap);

    try {
      var shift = await Api.getCurrentShift();
      renderActionButtons_(wrap.querySelector('#action-list'), user, shift);

      if (shift) {
        wrap.querySelector('#header-machine').textContent = shift.MACHINE_ID;
        wrap.querySelector('#header-shift-status').textContent = '🟢 Đang làm việc';
      } else {
        wrap.querySelector('#header-machine').textContent = 'Chưa chọn máy';
      }
    } catch (err) {
      wrap.querySelector('#action-list').innerHTML =
        '<div class="form-error show">' + (err.message || 'Không tải được dữ liệu.') + '</div>';
    }
  }

  function renderActionButtons_(container, user, shift) {
    var hasActiveShift = !!shift;
    container.innerHTML = '';

    var buttons = [];

    if (user.ROLE === 'FUELER') {
      buttons.push({ icon: '⛽', label: 'CẤP DẦU', route: 'fuel', primary: true });
    } else {
      // Mặc định: DRIVER (và ADMIN/MANAGER xem thử được luồng driver)
      buttons.push({ icon: '▶', label: 'BẮT ĐẦU CA', route: 'shift-start', primary: !hasActiveShift, disabled: hasActiveShift });
      buttons.push({ icon: '⛽', label: 'ĐỔ DẦU', route: 'fuel', disabled: !hasActiveShift });
      buttons.push({ icon: '🔧', label: 'BÁO SỰ CỐ', route: 'issue', danger: true, disabled: !hasActiveShift });
      buttons.push({ icon: '🛢', label: 'BƠM MỠ', route: 'grease', disabled: !hasActiveShift });
      buttons.push({ icon: '⏹', label: 'KẾT THÚC CA', route: 'shift-end', disabled: !hasActiveShift });
    }

    buttons.forEach(function (b) {
      var btn = document.createElement('button');
      btn.className = 'btn-big' + (b.primary ? ' primary' : '') + (b.danger ? ' danger-outline' : '') + (b.disabled ? ' disabled' : '');
      btn.innerHTML = '<span class="icon">' + b.icon + '</span><span>' + b.label + '</span>';
      btn.addEventListener('click', function () {
        navigate('placeholder', { title: b.label, icon: b.icon });
      });
      container.appendChild(btn);
    });
  }

  // ---------------- Màn hình: Tài khoản ----------------
  function renderAccount(container) {
    var user = Api.getCurrentUser();
    var roleLabelMap = { ADMIN: 'Quản trị viên', MANAGER: 'Quản lý', DRIVER: 'Lái máy', FUELER: 'Người cấp dầu' };

    var wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.innerHTML = `
      <div class="app-header">
        <p class="greeting">Tài khoản</p>
        <p class="user-name">${escapeHtml_(user ? user.FULL_NAME : '')}</p>
      </div>
      <div class="account-card">
        <p class="name">${escapeHtml_(user ? user.FULL_NAME : '')}</p>
        <span class="role-badge">${escapeHtml_(roleLabelMap[user.ROLE] || user.ROLE)}</span>
        <div class="detail-row"><span>Số điện thoại</span><span>${escapeHtml_(user.PHONE || '')}</span></div>
        <div class="detail-row"><span>Email</span><span>${escapeHtml_(user.EMAIL || '—')}</span></div>
        <div class="detail-row"><span>Trạng thái</span><span>${escapeHtml_(user.STATUS || '')}</span></div>
      </div>
      <button class="btn-logout" id="logout-btn">ĐĂNG XUẤT</button>
    `;
    container.appendChild(wrap);

    wrap.querySelector('#logout-btn').addEventListener('click', async function () {
      await Api.logout();
      showToast('Đã đăng xuất.', '');
      navigate('login');
    });
  }

  // ---------------- Màn hình placeholder (chức năng Phase sau) ----------------
  function renderPlaceholder(container) {
    var ctx = placeholderContext || {};
    var wrap = document.createElement('div');
    wrap.className = 'placeholder-screen';
    wrap.innerHTML = `
      <div class="emoji">${ctx.icon || '🚧'}</div>
      <h3>${escapeHtml_(ctx.title || 'Chức năng')}</h3>
      <p>Chức năng này sẽ được hoàn thiện ở Phase tiếp theo.</p>
      <button class="back-link" id="back-home-btn">← Quay lại Trang chủ</button>
    `;
    container.appendChild(wrap);
    wrap.querySelector('#back-home-btn').addEventListener('click', function () {
      navigate('home');
    });
  }

  function escapeHtml_(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  // ---------------- Bottom Navigation ----------------
  function setupBottomNav() {
    document.querySelectorAll('#bottom-nav button').forEach((btn) => {
      btn.addEventListener('click', function () {
        var route = btn.dataset.route;
        if (routes[route]) {
          navigate(route);
        } else {
          // Màn hình chưa xây ở Phase 1 (vd Nhật ký, Sự cố) -> placeholder
          navigate('placeholder', { title: btn.dataset.title || 'Chức năng', icon: btn.dataset.icon || '🚧' });
        }
      });
    });
  }

  // ---------------- Khởi động app ----------------
  function init() {
    setupBottomNav();
    document.getElementById('sync-now-btn').addEventListener('click', handleSyncNow);
    updateNetworkStatus();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(function (err) {
        console.warn('Không đăng ký được service worker:', err);
      });
    }

    if (Api.isLoggedIn()) {
      navigate('home');
    } else {
      navigate('login');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
