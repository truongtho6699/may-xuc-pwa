/**
 * app.js
 * ------------------------------------------------------------
 * Logic chính của PWA: điều hướng màn hình (SPA đơn giản, không
 * dùng framework), toàn bộ nghiệp vụ Phase 1-6:
 * Đăng nhập, Trang chủ, Bắt đầu/Kết thúc ca, Đổ dầu + xác nhận,
 * Báo sự cố (gồm cả Bơm mỡ như 1 lựa chọn bên trong), Nhật ký,
 * Dashboard quản lý.
 * ------------------------------------------------------------
 */

(function () {

  // ============================================================
  // TIỆN ÍCH DÙNG CHUNG: Toast, trạng thái mạng, đồng bộ offline
  // ============================================================

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
      if (result.success > 0) showToast('🟢 Đã đồng bộ ' + result.success + ' giao dịch.', 'success');
    } else {
      showToast('Đồng bộ ' + result.success + ' thành công, ' + result.failed + ' thất bại.', 'warning');
    }
    if (currentRoute === 'home') render();
  }

  window.addEventListener('online', function () { updateNetworkStatus(); handleSyncNow(); });
  window.addEventListener('offline', updateNetworkStatus);

  /**
   * Gửi 1 giao dịch (bắt đầu ca, đổ dầu, sự cố, bơm mỡ...) theo nguyên tắc
   * "Offline-first": nếu có mạng -> gửi ngay; nếu mất mạng hoặc gửi lỗi mạng
   * -> lưu vào hàng đợi IndexedDB, KHÔNG làm mất dữ liệu người dùng đã nhập
   * (mục 16). Trả về { synced: boolean, data }.
   */
  async function submitTransaction(action, payload) {
    payload.clientTransactionId = payload.clientTransactionId || crypto.randomUUID();

    if (navigator.onLine) {
      try {
        var data = await Api.post(action, payload);
        return { synced: true, data: data };
      } catch (err) {
        // Lỗi nghiệp vụ (backend từ chối rõ ràng) -> báo luôn, KHÔNG queue lại
        if (err && err.code && err.code !== 'PARSE_ERROR') {
          throw err;
        }
        // Lỗi mạng/không rõ nguyên nhân -> chuyển sang hàng đợi offline
      }
    }

    await OfflineQueue.enqueue(action, payload);
    await updateSyncBanner();
    return { synced: false, data: payload };
  }

  // ============================================================
  // TRẠNG THÁI CA LÀM VIỆC CỤC BỘ (để UI phản hồi ngay cả khi offline)
  // ============================================================

  var LocalState = {
    getActiveMachine: function () { return localStorage.getItem('local_active_machine') || ''; },
    setActiveMachine: function (machineId) { localStorage.setItem('local_active_machine', machineId || ''); },
    clearActiveMachine: function () { localStorage.removeItem('local_active_machine'); }
  };

  async function resolveCurrentShift() {
    if (navigator.onLine) {
      try {
        var shift = await Api.getCurrentShift();
        if (shift) LocalState.setActiveMachine(shift.MACHINE_ID); else LocalState.clearActiveMachine();
        return shift;
      } catch (err) {
        // rơi xuống dùng trạng thái cục bộ
      }
    }
    var localMachine = LocalState.getActiveMachine();
    return localMachine ? { MACHINE_ID: localMachine, STATUS: 'ACTIVE', __local: true } : null;
  }

  // ============================================================
  // CAMERA + GPS: helper dùng chung cho các form
  // ============================================================

  var cameraInput = document.getElementById('camera-input');

  async function captureWatermarkedImage(watermarkInfo) {
    var file = await Camera.pickImage(cameraInput);
    return Camera.processImage(file, watermarkInfo);
  }

  async function tryGetGps() {
    try {
      return await Gps.getCurrentPosition();
    } catch (err) {
      showToast(err.message || 'Vui lòng bật vị trí để thực hiện giao dịch.', 'warning');
      return null;
    }
  }

  function nowText_() {
    var d = new Date();
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml_(str) {
    var div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function fmtDateTime_(value) {
    if (!value) return '';
    var d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  // ============================================================
  // BỘ CHỌN MÁY DÙNG CHUNG (QR hoặc chọn thủ công) - mục 14, 38
  // ============================================================

  async function renderMachinePicker(container, onSelected) {
    container.innerHTML = `
      <button class="btn-qr" id="qr-scan-btn">📷 QUÉT QR TRÊN MÁY</button>
      <div class="field">
        <label>Hoặc chọn máy thủ công</label>
        <select class="select-field" id="machine-select">
          <option value="">-- Chọn máy --</option>
        </select>
      </div>
    `;

    var select = container.querySelector('#machine-select');
    try {
      var machines = await Api.getMachines();
      machines.forEach(function (m) {
        var opt = document.createElement('option');
        opt.value = m.MACHINE_ID;
        opt.textContent = m.MACHINE_ID + ' - ' + m.MACHINE_NAME;
        select.appendChild(opt);
      });
    } catch (err) {
      showToast(err.message || 'Không tải được danh sách máy.', 'error');
    }

    select.addEventListener('change', function () {
      if (select.value) onSelected(select.value);
    });

    container.querySelector('#qr-scan-btn').addEventListener('click', async function () {
      try {
        var machineId = await QrScanner.scan();
        select.value = machineId;
        onSelected(machineId);
        showToast('Đã nhận diện máy ' + machineId, 'success');
      } catch (err) {
        if (err.code !== 'QR_CANCELLED') showToast(err.message || 'Không quét được QR.', 'error');
      }
    });
  }

  // ============================================================
  // Ô CHỤP ẢNH DÙNG CHUNG (1 slot ảnh, có thể bắt buộc hoặc tuỳ chọn)
  // ============================================================

  function renderPhotoSlot(container, opts) {
    // opts: { id, title, optional, onCapture }
    var slot = document.createElement('div');
    slot.className = 'photo-slot';
    slot.id = 'slot-' + opts.id;
    slot.innerHTML = `
      <div class="photo-placeholder">📷</div>
      <div class="photo-info">
        <p class="photo-title">${escapeHtml_(opts.title)}</p>
        <p class="photo-optional">${opts.optional ? 'Không bắt buộc' : 'Bắt buộc'}</p>
      </div>
      <button type="button">Chụp</button>
    `;
    container.appendChild(slot);

    var state = { base64: null };
    var btn = slot.querySelector('button');
    var placeholderEl = slot.querySelector('.photo-placeholder');

    btn.addEventListener('click', async function () {
      try {
        var base64 = await captureWatermarkedImage(opts.watermark ? opts.watermark() : null);
        state.base64 = base64;
        slot.classList.add('filled');
        btn.textContent = 'Chụp lại';
        var img = document.createElement('img');
        img.className = 'photo-thumb';
        img.src = 'data:image/jpeg;base64,' + base64;
        placeholderEl.replaceWith(img);
        placeholderEl = img;
        if (opts.onCapture) opts.onCapture(base64);
      } catch (err) {
        if (err.code !== 'NO_IMAGE') showToast(err.message || 'Không thể chụp ảnh.', 'error');
      }
    });

    return { getBase64: function () { return state.base64; } };
  }

  // ============================================================
  // ROUTER ĐƠN GIẢN
  // ============================================================

  var routes = {
    login: renderLogin,
    home: renderHome,
    account: renderAccount,
    'shift-start': renderShiftStart,
    'shift-end': renderShiftEnd,
    'fuel-report': renderFuelReport,
    'issue-menu': renderIssueMenu,
    'issue-report': renderIssueReport,
    'grease-report': renderGreaseReport,
    history: renderHistory,
    'issues-manage': renderIssuesManage
  };

  var currentRoute = 'login';
  var routeContext = {};

  function navigate(route, context) {
    currentRoute = route;
    routeContext = context || {};
    render();
    document.getElementById('screen-scroll-anchor');
    window.scrollTo(0, 0);
  }
  window.navigate = navigate;

  function render() {
    var screenEl = document.getElementById('screen');
    var bottomNav = document.getElementById('bottom-nav');

    if (!Api.isLoggedIn() && currentRoute !== 'login') currentRoute = 'login';

    if (currentRoute === 'login') {
      bottomNav.classList.add('hidden');
    } else {
      bottomNav.classList.remove('hidden');
      updateActiveNavButton();
    }

    screenEl.innerHTML = '';
    var fn = routes[currentRoute] || renderHome;
    fn(screenEl);
  }

  function updateActiveNavButton() {
    document.querySelectorAll('#bottom-nav button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.route === currentRoute);
    });
  }

  function backHeader(container, title, backRoute) {
    var header = document.createElement('div');
    header.className = 'page-header';
    header.innerHTML = `<button class="back-btn">←</button><h2>${escapeHtml_(title)}</h2>`;
    header.querySelector('.back-btn').addEventListener('click', function () {
      navigate(backRoute || 'home');
    });
    container.appendChild(header);
    var body = document.createElement('div');
    body.className = 'page-body';
    container.appendChild(body);
    return body;
  }

  // ============================================================
  // MÀN HÌNH: ĐĂNG NHẬP
  // ============================================================

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
        0900000001 – Admin (toàn quyền)<br>
        0900000002 – Quản lý<br>
        0900000003 – Lái máy<br>
        0900000004 – Lái máy 2
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

  // ============================================================
  // MÀN HÌNH: TRANG CHỦ
  // ============================================================

  async function renderHome(container) {
    var user = Api.getCurrentUser();
    if (!user) { navigate('login'); return; }

    if (user.ROLE === 'ADMIN' || user.ROLE === 'MANAGER') {
      return renderManagerHome_(container, user);
    }

    var wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.innerHTML = `
      <div class="app-header">
        <p class="greeting">Xin chào</p>
        <p class="user-name">${escapeHtml_(user.FULL_NAME)}</p>
        <div class="header-info-row">
          <div class="info-chip">
            <p class="label">Máy đang vận hành</p>
            <p class="value" id="header-machine">—</p>
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
      var shift = await resolveCurrentShift();
      renderActionButtons_(wrap.querySelector('#action-list'), user, shift);
      if (shift) {
        wrap.querySelector('#header-machine').textContent = shift.MACHINE_ID;
        wrap.querySelector('#header-shift-status').textContent = shift.__local ? '🟠 Đang làm việc (chưa đồng bộ)' : '🟢 Đang làm việc';
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

    // Theo yêu cầu điều chỉnh: DRIVER và FUELER đã gộp thành 1 vai trò.
    // Lái xe tự đề xuất và tự ghi nhận việc đổ dầu cho máy mình đang vận hành.
    buttons.push({ icon: '▶', label: 'BẮT ĐẦU CA', route: 'shift-start', primary: !hasActiveShift, disabled: hasActiveShift });
    buttons.push({ icon: '⛽', label: 'ĐỔ DẦU', route: 'fuel-report', disabled: !hasActiveShift });
    // "Bơm mỡ" được gộp vào bên trong luồng "Báo sự cố" theo yêu cầu điều chỉnh.
    buttons.push({ icon: '🔧', label: 'BÁO SỰ CỐ', route: 'issue-menu', danger: true, disabled: !hasActiveShift });
    buttons.push({ icon: '⏹', label: 'KẾT THÚC CA', route: 'shift-end', disabled: !hasActiveShift });

    buttons.forEach(function (b) {
      var btn = document.createElement('button');
      btn.className = 'btn-big' + (b.primary ? ' primary' : '') + (b.danger ? ' danger-outline' : '') + (b.disabled ? ' disabled' : '');
      btn.innerHTML = '<span class="icon">' + b.icon + '</span><span>' + b.label + '</span>';
      btn.addEventListener('click', function () { navigate(b.route); });
      container.appendChild(btn);
    });

    if (!hasActiveShift) {
      var notice = document.createElement('p');
      notice.style.cssText = 'text-align:center;color:var(--color-text-muted);font-size:13px;margin-top:6px;';
      notice.textContent = 'Hãy bắt đầu ca làm việc để mở khoá các chức năng khác.';
      container.appendChild(notice);
    }
  }

  // ---------- Trang chủ cho MANAGER / ADMIN: Dashboard ----------
  async function renderManagerHome_(container, user) {
    var wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.innerHTML = `
      <div class="app-header">
        <p class="greeting">Xin chào</p>
        <p class="user-name">${escapeHtml_(user.FULL_NAME)} <span style="font-size:13px;opacity:.85;">(${user.ROLE === 'ADMIN' ? 'Toàn quyền' : 'Quản lý'})</span></p>
      </div>
      <div id="dashboard-content">
        <div class="loading-wrap"><div class="spinner"></div> Đang tải dashboard...</div>
      </div>
    `;
    container.appendChild(wrap);

    try {
      var data = await Api.get('dashboard', {});
      renderDashboardContent_(wrap.querySelector('#dashboard-content'), data);
    } catch (err) {
      wrap.querySelector('#dashboard-content').innerHTML =
        '<div class="form-error show" style="margin:16px;">' + (err.message || 'Không tải được dashboard.') + '</div>';
    }
  }

  function renderDashboardContent_(container, data) {
    var s = data.summary;
    container.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card"><p class="stat-value">${s.totalMachines}</p><p class="stat-label">Tổng số máy</p></div>
        <div class="stat-card"><p class="stat-value">${s.activeCount}</p><p class="stat-label">Đang hoạt động</p></div>
        <div class="stat-card"><p class="stat-value">${s.brokenCount}</p><p class="stat-label">Dừng máy</p></div>
        <div class="stat-card"><p class="stat-value">${s.openIssueCount}</p><p class="stat-label">Sự cố</p></div>
        <div class="stat-card"><p class="stat-value">${s.todayFuelTotal}</p><p class="stat-label">Dầu hôm nay (L)</p></div>
        <div class="stat-card"><p class="stat-value">${s.todayHoursTotal}</p><p class="stat-label">Giờ máy hôm nay</p></div>
      </div>
      <div class="dashboard-table" id="machine-table"></div>
    `;

    var dotMap = { GREEN: '🟢', ORANGE: '🟠', RED: '🔴', GRAY: '⚪' };
    var table = container.querySelector('#machine-table');
    if (!data.machines.length) {
      table.innerHTML = '<div class="empty-state"><div class="emoji">📭</div>Chưa có dữ liệu máy.</div>';
      return;
    }
    data.machines.forEach(function (m) {
      var row = document.createElement('div');
      row.className = 'machine-row';
      row.innerHTML = `
        <div class="m-left">
          <p class="m-name">${dotMap[m.STATUS_COLOR] || '⚪'} ${escapeHtml_(m.MACHINE_ID)} - ${escapeHtml_(m.MACHINE_NAME || '')}</p>
          <p class="m-sub">${m.DRIVER_NAME ? 'Lái xe: ' + escapeHtml_(m.DRIVER_NAME) : 'Chưa có lái xe'} · ${m.HOURS_TODAY} giờ hôm nay</p>
        </div>
        <div class="m-right">
          <p class="m-lph">${m.L_PER_HOUR !== null ? m.L_PER_HOUR + ' L/h' : '—'}</p>
          <p class="m-sub">Định mức ≤ ${m.FUEL_STANDARD_MAX}</p>
        </div>
      `;
      table.appendChild(row);
    });
  }

  // ============================================================
  // MÀN HÌNH: TÀI KHOẢN
  // ============================================================

  function renderAccount(container) {
    var user = Api.getCurrentUser();
    var roleLabelMap = { ADMIN: 'Quản trị viên (toàn quyền)', MANAGER: 'Quản lý', DRIVER: 'Lái máy (tự đề xuất & ghi nhận đổ dầu)' };

    var wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.innerHTML = `
      <div class="app-header">
        <p class="greeting">Tài khoản</p>
        <p class="user-name">${escapeHtml_(user.FULL_NAME)}</p>
      </div>
      <div class="account-card">
        <p class="name">${escapeHtml_(user.FULL_NAME)}</p>
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
      LocalState.clearActiveMachine();
      showToast('Đã đăng xuất.', '');
      navigate('login');
    });
  }

  // ============================================================
  // MÀN HÌNH: BẮT ĐẦU CA (mục 7)
  // ============================================================

  function renderShiftStart(container) {
    var wrap = document.createElement('div');
    wrap.className = 'screen';
    var body = backHeader(wrap, 'Bắt đầu ca', 'home');
    container.appendChild(wrap);

    var selectedMachine = null;
    var photoState = null;

    var machinePickerWrap = document.createElement('div');
    body.appendChild(machinePickerWrap);
    renderMachinePicker(machinePickerWrap, function (machineId) { selectedMachine = machineId; });

    var form = document.createElement('div');
    form.innerHTML = `
      <div class="field">
        <label>Giờ máy đầu ca</label>
        <input type="number" step="0.1" inputmode="decimal" id="start-hour-meter" placeholder="Ví dụ: 3582.7">
      </div>
      <div class="photo-slot-group" id="photo-group"></div>
      <button class="btn-primary" id="submit-btn">BẮT ĐẦU LÀM VIỆC</button>
    `;
    body.appendChild(form);

    photoState = renderPhotoSlot(form.querySelector('#photo-group'), {
      id: 'hourmeter', title: 'Ảnh đồng hồ giờ máy', optional: false,
      watermark: function () { return { machineId: selectedMachine || '', dateTimeText: nowText_(), userName: Api.getCurrentUser().FULL_NAME }; }
    });

    form.querySelector('#submit-btn').addEventListener('click', async function () {
      var hourMeter = form.querySelector('#start-hour-meter').value;
      if (!selectedMachine) { showToast('Vui lòng chọn máy (quét QR hoặc chọn thủ công).', 'error'); return; }
      if (!hourMeter || Number(hourMeter) < 0) { showToast('Vui lòng nhập giờ máy hợp lệ.', 'error'); return; }
      if (!photoState.getBase64()) { showToast('Vui lòng chụp ảnh đồng hồ giờ máy.', 'error'); return; }

      var btn = form.querySelector('#submit-btn');
      btn.disabled = true; btn.textContent = 'Đang xử lý...';

      var gps = await tryGetGps();

      try {
        var result = await submitTransaction('shift/start', {
          machineId: selectedMachine,
          startHourMeter: Number(hourMeter),
          startImage: photoState.getBase64(),
          lat: gps ? gps.latitude : '',
          lng: gps ? gps.longitude : '',
          accuracy: gps ? gps.accuracy : ''
        });
        LocalState.setActiveMachine(selectedMachine);
        showToast(result.synced ? '✅ Đã bắt đầu ca làm việc.' : '🟠 Đã lưu tạm, sẽ đồng bộ khi có mạng.', result.synced ? 'success' : 'warning');
        navigate('home');
      } catch (err) {
        showToast(err.message || 'Không thể bắt đầu ca. Vui lòng thử lại.', 'error');
        btn.disabled = false; btn.textContent = 'BẮT ĐẦU LÀM VIỆC';
      }
    });
  }

  // ============================================================
  // MÀN HÌNH: KẾT THÚC CA (mục 13)
  // ============================================================

  async function renderShiftEnd(container) {
    var wrap = document.createElement('div');
    wrap.className = 'screen';
    var body = backHeader(wrap, 'Kết thúc ca', 'home');
    container.appendChild(wrap);

    var shift = await resolveCurrentShift();
    if (!shift) {
      body.innerHTML = '<div class="empty-state"><div class="emoji">⚪</div>Bạn chưa bắt đầu ca làm việc nào.</div>';
      return;
    }

    body.innerHTML = `<div class="machine-badge">🚜 Máy: ${escapeHtml_(shift.MACHINE_ID)}</div>`;

    var form = document.createElement('div');
    form.innerHTML = `
      <div class="field">
        <label>Giờ máy cuối ca</label>
        <input type="number" step="0.1" inputmode="decimal" id="end-hour-meter" placeholder="Ví dụ: 3591.5">
      </div>
      <div class="photo-slot-group" id="photo-group"></div>
      <button class="btn-primary" id="submit-btn">KẾT THÚC CA</button>
    `;
    body.appendChild(form);

    var photoState = renderPhotoSlot(form.querySelector('#photo-group'), {
      id: 'hourmeter', title: 'Ảnh đồng hồ giờ máy', optional: false,
      watermark: function () { return { machineId: shift.MACHINE_ID, dateTimeText: nowText_(), userName: Api.getCurrentUser().FULL_NAME }; }
    });

    form.querySelector('#submit-btn').addEventListener('click', async function () {
      var endHourMeter = form.querySelector('#end-hour-meter').value;
      if (!endHourMeter || Number(endHourMeter) < 0) { showToast('Vui lòng nhập giờ máy hợp lệ.', 'error'); return; }
      if (!photoState.getBase64()) { showToast('Vui lòng chụp ảnh đồng hồ giờ máy.', 'error'); return; }

      var btn = form.querySelector('#submit-btn');
      btn.disabled = true; btn.textContent = 'Đang xử lý...';
      var gps = await tryGetGps();

      try {
        var result = await submitTransaction('shift/end', {
          endHourMeter: Number(endHourMeter),
          endImage: photoState.getBase64(),
          lat: gps ? gps.latitude : '',
          lng: gps ? gps.longitude : ''
        });
        LocalState.clearActiveMachine();
        showToast(result.synced ? '✅ Đã kết thúc ca làm việc.' : '🟠 Đã lưu tạm, sẽ đồng bộ khi có mạng.', result.synced ? 'success' : 'warning');
        navigate('home');
      } catch (err) {
        showToast(err.message || 'Không thể kết thúc ca. Vui lòng thử lại.', 'error');
        btn.disabled = false; btn.textContent = 'KẾT THÚC CA';
      }
    });
  }

  // ============================================================
  // MÀN HÌNH: ĐỔ DẦU (TỰ ĐỀ XUẤT - TỰ GHI NHẬN) - mục 8 (đã điều chỉnh)
  // DRIVER và FUELER đã gộp thành 1 vai trò: lái xe tự ghi nhận số lít dầu
  // đã đổ cho máy mình đang vận hành, không cần người khác xác nhận chéo.
  // Máy được lấy tự động theo ca đang hoạt động - không cần chọn/quét lại
  // (mục 37: không bắt người dùng nhập lại thông tin đã có sẵn).
  // ============================================================

  async function renderFuelReport(container) {
    var wrap = document.createElement('div');
    wrap.className = 'screen';
    var body = backHeader(wrap, 'Đổ dầu', 'home');
    container.appendChild(wrap);

    var shift = await resolveCurrentShift();
    if (!shift) {
      body.innerHTML = '<div class="empty-state"><div class="emoji">⚪</div>Bạn cần bắt đầu ca làm việc trước.</div>';
      return;
    }

    body.innerHTML = `<div class="machine-badge">🚜 Máy: ${escapeHtml_(shift.MACHINE_ID)}</div>`;

    var form = document.createElement('div');
    form.innerHTML = `
      <div class="field">
        <label>Số lít</label>
        <input type="number" step="0.1" inputmode="decimal" id="fuel-qty" placeholder="Ví dụ: 87">
      </div>
      <div class="field">
        <label>Giờ máy</label>
        <input type="number" step="0.1" inputmode="decimal" id="fuel-hourmeter" placeholder="Ví dụ: 3591.5">
      </div>
      <div class="photo-slot-group" id="photo-group"></div>
      <button class="btn-primary" id="submit-btn">GHI NHẬN ĐỔ DẦU</button>
    `;
    body.appendChild(form);

    var photoGroup = form.querySelector('#photo-group');
    var slotPump = renderPhotoSlot(photoGroup, {
      id: 'pump', title: 'Ảnh đồng hồ bơm/cây dầu', optional: false,
      watermark: function () { return { machineId: shift.MACHINE_ID, dateTimeText: nowText_(), userName: Api.getCurrentUser().FULL_NAME }; }
    });
    var slotHourMeter = renderPhotoSlot(photoGroup, {
      id: 'hourmeter', title: 'Ảnh đồng hồ giờ máy', optional: false,
      watermark: function () { return { machineId: shift.MACHINE_ID, dateTimeText: nowText_(), userName: Api.getCurrentUser().FULL_NAME }; }
    });
    var slotReceipt = renderPhotoSlot(photoGroup, {
      id: 'receipt', title: 'Ảnh phiếu dầu', optional: true
    });

    form.querySelector('#submit-btn').addEventListener('click', async function () {
      var qty = form.querySelector('#fuel-qty').value;
      var hourMeter = form.querySelector('#fuel-hourmeter').value;

      if (!qty || Number(qty) <= 0) { showToast('Số lít phải lớn hơn 0.', 'error'); return; }
      if (!hourMeter || Number(hourMeter) < 0) { showToast('Vui lòng nhập giờ máy hợp lệ.', 'error'); return; }
      if (!slotPump.getBase64()) { showToast('Vui lòng chụp ảnh đồng hồ bơm.', 'error'); return; }
      if (!slotHourMeter.getBase64()) { showToast('Vui lòng chụp ảnh đồng hồ giờ máy.', 'error'); return; }

      var btn = form.querySelector('#submit-btn');
      btn.disabled = true; btn.textContent = 'Đang xử lý...';
      var gps = await tryGetGps();

      try {
        var result = await submitTransaction('fuel', {
          quantity: Number(qty),
          hourMeter: Number(hourMeter),
          imagePump: slotPump.getBase64(),
          imageHourMeter: slotHourMeter.getBase64(),
          imageReceipt: slotReceipt.getBase64() || '',
          lat: gps ? gps.latitude : '',
          lng: gps ? gps.longitude : ''
        });
        showToast(result.synced ? '✅ Đã ghi nhận đổ dầu.' : '🟠 Đã lưu tạm, sẽ đồng bộ khi có mạng.', result.synced ? 'success' : 'warning');
        navigate('home');
      } catch (err) {
        showToast(err.message || 'Không thể ghi nhận đổ dầu.', 'error');
        btn.disabled = false; btn.textContent = 'GHI NHẬN ĐỔ DẦU';
      }
    });
  }

  // ============================================================
  // MÀN HÌNH: BÁO SỰ CỐ (gồm menu chọn "Báo sự cố" hoặc "Bơm mỡ")
  // Theo yêu cầu điều chỉnh: Bơm mỡ nằm TRONG Báo sự cố.
  // ============================================================

  function renderIssueMenu(container) {
    var wrap = document.createElement('div');
    wrap.className = 'screen';
    var body = backHeader(wrap, 'Báo sự cố', 'home');
    container.appendChild(wrap);

    body.innerHTML = `
      <p style="color:var(--color-text-muted);font-size:14px;margin:0 0 16px;">Chọn loại yêu cầu bạn muốn gửi:</p>
      <div class="action-list" style="padding:0;">
        <button class="btn-big danger-outline" id="btn-go-issue">
          <span class="icon">🔧</span><span>BÁO SỰ CỐ MÁY</span>
        </button>
        <button class="btn-big" id="btn-go-grease">
          <span class="icon">🛢</span><span>BƠM MỠ</span>
        </button>
      </div>
    `;
    body.querySelector('#btn-go-issue').addEventListener('click', function () { navigate('issue-report'); });
    body.querySelector('#btn-go-grease').addEventListener('click', function () { navigate('grease-report'); });
  }

  // ---------- Form: Báo sự cố (mục 10) ----------

  var ISSUE_TYPES = ['Động cơ', 'Thủy lực', 'Điện', 'Gầm', 'Gầu', 'Xích', 'Điều hòa', 'Rò dầu', 'Khác'];
  var SEVERITY_OPTIONS = [
    { value: 'LOW', label: '🟢 Vẫn hoạt động' },
    { value: 'MEDIUM', label: '🟠 Hoạt động hạn chế' },
    { value: 'HIGH', label: '🔴 Dừng máy' }
  ];

  async function renderIssueReport(container) {
    var wrap = document.createElement('div');
    wrap.className = 'screen';
    var body = backHeader(wrap, 'Báo sự cố máy', 'issue-menu');
    container.appendChild(wrap);

    var shift = await resolveCurrentShift();
    if (!shift) {
      body.innerHTML = '<div class="empty-state"><div class="emoji">⚪</div>Bạn cần bắt đầu ca làm việc trước.</div>';
      return;
    }

    var selectedType = null;
    var selectedSeverity = null;
    var images = [];

    body.innerHTML = `<div class="machine-badge">🚜 Máy: ${escapeHtml_(shift.MACHINE_ID)}</div>`;

    var form = document.createElement('div');
    form.innerHTML = `
      <div class="field">
        <label>Loại lỗi</label>
        <div class="chip-group" id="type-chips"></div>
      </div>
      <div class="field">
        <label>Mức độ</label>
        <div class="chip-group" id="severity-chips"></div>
      </div>
      <div class="field">
        <label>Ảnh hiện trạng (tối đa 5 ảnh)</label>
        <div class="image-grid" id="image-grid"></div>
      </div>
      <div class="field">
        <label>Ghi chú</label>
        <textarea id="issue-note" placeholder="Không bắt buộc - mô tả thêm về sự cố"></textarea>
      </div>
      <button class="btn-primary" id="submit-btn">GỬI SỰ CỐ</button>
    `;
    body.appendChild(form);

    var typeChips = form.querySelector('#type-chips');
    ISSUE_TYPES.forEach(function (t) {
      var chip = document.createElement('button');
      chip.type = 'button'; chip.className = 'chip'; chip.textContent = t;
      chip.addEventListener('click', function () {
        typeChips.querySelectorAll('.chip').forEach((c) => c.classList.remove('selected'));
        chip.classList.add('selected');
        selectedType = t;
      });
      typeChips.appendChild(chip);
    });

    var sevChips = form.querySelector('#severity-chips');
    SEVERITY_OPTIONS.forEach(function (s) {
      var chip = document.createElement('button');
      chip.type = 'button'; chip.className = 'chip severity-' + s.value; chip.textContent = s.label;
      chip.addEventListener('click', function () {
        sevChips.querySelectorAll('.chip').forEach((c) => c.classList.remove('selected'));
        chip.classList.add('selected');
        selectedSeverity = s.value;
      });
      sevChips.appendChild(chip);
    });

    var imageGrid = form.querySelector('#image-grid');
    function renderImageGrid() {
      imageGrid.innerHTML = '';
      images.forEach(function (b64, idx) {
        var el = document.createElement('div');
        el.className = 'grid-photo';
        el.innerHTML = `<img src="data:image/jpeg;base64,${b64}"><button type="button" class="remove-btn">✕</button>`;
        el.querySelector('.remove-btn').addEventListener('click', function () {
          images.splice(idx, 1);
          renderImageGrid();
        });
        imageGrid.appendChild(el);
      });
      if (images.length < 5) {
        var addBtn = document.createElement('button');
        addBtn.type = 'button'; addBtn.className = 'add-photo-btn'; addBtn.textContent = '+';
        addBtn.addEventListener('click', async function () {
          try {
            var base64 = await captureWatermarkedImage({ machineId: shift.MACHINE_ID, dateTimeText: nowText_() });
            images.push(base64);
            renderImageGrid();
          } catch (err) {
            if (err.code !== 'NO_IMAGE') showToast(err.message || 'Không thể chụp ảnh.', 'error');
          }
        });
        imageGrid.appendChild(addBtn);
      }
    }
    renderImageGrid();

    form.querySelector('#submit-btn').addEventListener('click', async function () {
      if (!selectedType) { showToast('Vui lòng chọn loại lỗi.', 'error'); return; }
      if (!selectedSeverity) { showToast('Vui lòng chọn mức độ sự cố.', 'error'); return; }

      var btn = form.querySelector('#submit-btn');
      btn.disabled = true; btn.textContent = 'Đang gửi...';
      var gps = await tryGetGps();

      try {
        var result = await submitTransaction('issue', {
          machineId: shift.MACHINE_ID,
          issueType: selectedType,
          severity: selectedSeverity,
          description: form.querySelector('#issue-note').value || '',
          images: images,
          lat: gps ? gps.latitude : '',
          lng: gps ? gps.longitude : ''
        });
        showToast(result.synced ? '✅ Đã gửi báo cáo sự cố.' : '🟠 Đã lưu tạm, sẽ đồng bộ khi có mạng.', result.synced ? 'success' : 'warning');
        navigate('home');
      } catch (err) {
        showToast(err.message || 'Không thể gửi sự cố.', 'error');
        btn.disabled = false; btn.textContent = 'GỬI SỰ CỐ';
      }
    });
  }

  // ---------- Form: Bơm mỡ (mục 12) ----------

  var GREASE_REASONS = ['Thiếu mỡ', 'Tiếng kêu', 'Kiểm tra phát hiện', 'Sửa chữa', 'Khác'];

  async function renderGreaseReport(container) {
    var wrap = document.createElement('div');
    wrap.className = 'screen';
    var body = backHeader(wrap, 'Bơm mỡ', 'issue-menu');
    container.appendChild(wrap);

    var shift = await resolveCurrentShift();
    if (!shift) {
      body.innerHTML = '<div class="empty-state"><div class="emoji">⚪</div>Bạn cần bắt đầu ca làm việc trước.</div>';
      return;
    }

    var selectedGreaseType = null;
    var selectedReason = null;

    body.innerHTML = `<div class="machine-badge">🚜 Máy: ${escapeHtml_(shift.MACHINE_ID)}</div>`;

    var form = document.createElement('div');
    form.innerHTML = `
      <div class="field">
        <label>Giờ máy</label>
        <input type="number" step="0.1" inputmode="decimal" id="grease-hourmeter">
      </div>
      <div class="field">
        <label>Số lượng mỡ (kg)</label>
        <input type="number" step="0.1" inputmode="decimal" id="grease-qty">
      </div>
      <div class="field">
        <label>Loại</label>
        <div class="chip-group" id="type-chips">
          <button type="button" class="chip" data-value="ĐỊNH KỲ">ĐỊNH KỲ</button>
          <button type="button" class="chip" data-value="PHÁT SINH">PHÁT SINH</button>
        </div>
      </div>
      <div class="field hidden" id="reason-field">
        <label>Nguyên nhân</label>
        <div class="chip-group" id="reason-chips"></div>
      </div>
      <div class="photo-slot-group" id="photo-group"></div>
      <button class="btn-primary" id="submit-btn">HOÀN THÀNH</button>
    `;
    body.appendChild(form);

    var reasonField = form.querySelector('#reason-field');
    var reasonChips = form.querySelector('#reason-chips');
    GREASE_REASONS.forEach(function (r) {
      var chip = document.createElement('button');
      chip.type = 'button'; chip.className = 'chip'; chip.textContent = r;
      chip.addEventListener('click', function () {
        reasonChips.querySelectorAll('.chip').forEach((c) => c.classList.remove('selected'));
        chip.classList.add('selected');
        selectedReason = r;
      });
      reasonChips.appendChild(chip);
    });

    form.querySelectorAll('#type-chips .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        form.querySelectorAll('#type-chips .chip').forEach((c) => c.classList.remove('selected'));
        chip.classList.add('selected');
        selectedGreaseType = chip.dataset.value;
        reasonField.classList.toggle('hidden', selectedGreaseType !== 'PHÁT SINH');
      });
    });

    var photoState = renderPhotoSlot(form.querySelector('#photo-group'), {
      id: 'grease', title: 'Ảnh vị trí bơm mỡ', optional: true,
      watermark: function () { return { machineId: shift.MACHINE_ID, dateTimeText: nowText_() }; }
    });

    form.querySelector('#submit-btn').addEventListener('click', async function () {
      var hourMeter = form.querySelector('#grease-hourmeter').value;
      var qty = form.querySelector('#grease-qty').value;

      if (!hourMeter || Number(hourMeter) < 0) { showToast('Vui lòng nhập giờ máy hợp lệ.', 'error'); return; }
      if (!qty || Number(qty) <= 0) { showToast('Số lượng mỡ phải lớn hơn 0.', 'error'); return; }
      if (!selectedGreaseType) { showToast('Vui lòng chọn Định kỳ hoặc Phát sinh.', 'error'); return; }
      if (selectedGreaseType === 'PHÁT SINH' && !selectedReason) { showToast('Vui lòng chọn nguyên nhân.', 'error'); return; }

      var btn = form.querySelector('#submit-btn');
      btn.disabled = true; btn.textContent = 'Đang xử lý...';
      var gps = await tryGetGps();

      try {
        var result = await submitTransaction('grease', {
          machineId: shift.MACHINE_ID,
          hourMeter: Number(hourMeter),
          quantity: Number(qty),
          type: selectedGreaseType,
          reason: selectedReason || '',
          image: photoState.getBase64() || '',
          lat: gps ? gps.latitude : '',
          lng: gps ? gps.longitude : ''
        });
        showToast(result.synced ? '✅ Đã ghi nhận bơm mỡ.' : '🟠 Đã lưu tạm, sẽ đồng bộ khi có mạng.', result.synced ? 'success' : 'warning');
        navigate('home');
      } catch (err) {
        showToast(err.message || 'Không thể ghi nhận bơm mỡ.', 'error');
        btn.disabled = false; btn.textContent = 'HOÀN THÀNH';
      }
    });
  }

  // ============================================================
  // MÀN HÌNH: NHẬT KÝ (mục 29 bottom nav)
  // ============================================================

  var historyTab = 'all';

  async function renderHistory(container) {
    var wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.innerHTML = `<div class="app-header"><p class="user-name" style="margin:0;">📋 Nhật ký</p></div>`;
    container.appendChild(wrap);

    var tabs = [
      { value: 'all', label: 'Tất cả' },
      { value: 'shift', label: 'Ca làm việc' },
      { value: 'fuel', label: 'Đổ dầu' },
      { value: 'issue', label: 'Sự cố' },
      { value: 'grease', label: 'Bơm mỡ' }
    ];
    var tabGroup = document.createElement('div');
    tabGroup.className = 'tab-group';
    tabs.forEach(function (t) {
      var btn = document.createElement('button');
      btn.className = 'tab-btn' + (t.value === historyTab ? ' active' : '');
      btn.textContent = t.label;
      btn.addEventListener('click', function () {
        historyTab = t.value;
        renderHistory(container.parentElement ? container : container); // re-render
        navigate('history');
      });
      tabGroup.appendChild(btn);
    });
    wrap.appendChild(tabGroup);

    var listEl = document.createElement('div');
    listEl.className = 'page-body';
    listEl.innerHTML = '<div class="loading-wrap"><div class="spinner"></div> Đang tải...</div>';
    wrap.appendChild(listEl);

    try {
      var entries = await Api.get('history', { type: historyTab, limit: 50 });
      if (!entries.length) {
        listEl.innerHTML = '<div class="empty-state"><div class="emoji">📭</div>Chưa có dữ liệu.</div>';
        return;
      }
      var kindIcon = { SHIFT: '🚜', FUEL: '⛽', ISSUE: '🔧', GREASE: '🛢' };
      listEl.innerHTML = '';
      entries.forEach(function (e) {
        var card = document.createElement('div');
        card.className = 'list-card';
        card.innerHTML = `
          <div class="list-card-top">
            <div>
              <p class="list-card-title">${kindIcon[e.kind] || ''} ${escapeHtml_(e.title)}</p>
              <p class="list-card-subtitle">${escapeHtml_(e.subtitle || '')}</p>
            </div>
            <span class="list-card-time">${fmtDateTime_(e.time)}</span>
          </div>
          <span class="badge badge-${escapeHtml_(e.status)}">${escapeHtml_(e.status)}</span>
        `;
        listEl.appendChild(card);
      });
    } catch (err) {
      listEl.innerHTML = '<div class="form-error show">' + (err.message || 'Không tải được nhật ký.') + '</div>';
    }
  }

  // ============================================================
  // MÀN HÌNH: SỰ CỐ (bottom nav) - Driver xem của mình, Manager/Admin xử lý (mục 11)
  // ============================================================

  var issueStatusFilter = '';

  async function renderIssuesManage(container) {
    var user = Api.getCurrentUser();
    var isManager = (user.ROLE === 'ADMIN' || user.ROLE === 'MANAGER');

    var wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.innerHTML = `<div class="app-header"><p class="user-name" style="margin:0;">⚠ Sự cố</p></div>`;
    container.appendChild(wrap);

    if (isManager) {
      var statuses = [
        { value: '', label: 'Tất cả' },
        { value: 'NEW', label: 'Mới' },
        { value: 'ACKNOWLEDGED', label: 'Đã tiếp nhận' },
        { value: 'REPAIRING', label: 'Đang sửa' },
        { value: 'COMPLETED', label: 'Hoàn thành' }
      ];
      var tabGroup = document.createElement('div');
      tabGroup.className = 'tab-group';
      statuses.forEach(function (s) {
        var btn = document.createElement('button');
        btn.className = 'tab-btn' + (s.value === issueStatusFilter ? ' active' : '');
        btn.textContent = s.label;
        btn.addEventListener('click', function () { issueStatusFilter = s.value; navigate('issues-manage'); });
        tabGroup.appendChild(btn);
      });
      wrap.appendChild(tabGroup);
    }

    var listEl = document.createElement('div');
    listEl.className = 'page-body';
    listEl.innerHTML = '<div class="loading-wrap"><div class="spinner"></div> Đang tải...</div>';
    wrap.appendChild(listEl);

    try {
      var issues = await Api.get('issues', issueStatusFilter ? { status: issueStatusFilter } : {});
      if (!issues.length) {
        listEl.innerHTML = '<div class="empty-state"><div class="emoji">✅</div>Không có sự cố nào.</div>';
        return;
      }
      listEl.innerHTML = '';
      issues.forEach(function (issue) { listEl.appendChild(buildIssueCard_(issue, isManager)); });
    } catch (err) {
      listEl.innerHTML = '<div class="form-error show">' + (err.message || 'Không tải được danh sách sự cố.') + '</div>';
    }
  }

  var SEVERITY_ICON = { LOW: '🟢', MEDIUM: '🟠', HIGH: '🔴' };

  function buildIssueCard_(issue, isManager) {
    var card = document.createElement('div');
    card.className = 'list-card';
    var images = [issue.IMAGE_1, issue.IMAGE_2, issue.IMAGE_3, issue.IMAGE_4, issue.IMAGE_5].filter(Boolean);

    card.innerHTML = `
      <div class="list-card-top">
        <div>
          <p class="list-card-title">${SEVERITY_ICON[issue.SEVERITY] || ''} ${escapeHtml_(issue.ISSUE_TYPE)} — ${escapeHtml_(issue.MACHINE_ID)}</p>
          <p class="list-card-subtitle">${escapeHtml_(issue.DESCRIPTION || 'Không có ghi chú')}</p>
        </div>
        <span class="list-card-time">${fmtDateTime_(issue.DATE_TIME)}</span>
      </div>
      <span class="badge badge-${escapeHtml_(issue.STATUS)}">${escapeHtml_(issue.STATUS)}</span>
      ${images.length ? '<div class="image-grid" style="margin-top:10px;">' + images.map(function (url) { return '<div class="grid-photo"><img src="' + url + '"></div>'; }).join('') + '</div>' : ''}
    `;

    if (isManager) {
      var actionRow = document.createElement('div');
      actionRow.style.cssText = 'display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;';
      var nextStatusMap = {
        NEW: { next: 'ACKNOWLEDGED', label: 'TIẾP NHẬN' },
        ACKNOWLEDGED: { next: 'REPAIRING', label: 'BẮT ĐẦU SỬA' },
        REPAIRING: { next: 'COMPLETED', label: 'HOÀN THÀNH' }
      };
      var nextInfo = nextStatusMap[issue.STATUS];
      if (nextInfo) {
        var advanceBtn = document.createElement('button');
        advanceBtn.className = 'btn-confirm';
        advanceBtn.style.cssText = 'flex:1;min-height:42px;border-radius:10px;border:none;font-weight:700;';
        advanceBtn.textContent = nextInfo.label;
        advanceBtn.addEventListener('click', async function () {
          try {
            await Api.post('issue/update', { issueId: issue.ISSUE_ID, status: nextInfo.next });
            showToast('Đã cập nhật trạng thái sự cố.', 'success');
            navigate('issues-manage');
          } catch (err) {
            showToast(err.message || 'Không thể cập nhật.', 'error');
          }
        });
        actionRow.appendChild(advanceBtn);
      }
      if (issue.STATUS !== 'CANCELLED' && issue.STATUS !== 'COMPLETED') {
        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-dispute';
        cancelBtn.style.cssText = 'flex:1;min-height:42px;border-radius:10px;background:#fff;font-weight:700;';
        cancelBtn.textContent = 'HUỶ';
        cancelBtn.addEventListener('click', async function () {
          if (!confirm('Huỷ sự cố này?')) return;
          try {
            await Api.post('issue/update', { issueId: issue.ISSUE_ID, status: 'CANCELLED' });
            showToast('Đã huỷ sự cố.', '');
            navigate('issues-manage');
          } catch (err) {
            showToast(err.message || 'Không thể huỷ.', 'error');
          }
        });
        actionRow.appendChild(cancelBtn);
      }
      if (actionRow.children.length) card.appendChild(actionRow);
    }

    return card;
  }

  // ============================================================
  // BOTTOM NAVIGATION
  // ============================================================

  function setupBottomNav() {
    document.querySelectorAll('#bottom-nav button').forEach((btn) => {
      btn.addEventListener('click', function () {
        var route = btn.dataset.route;
        navigate(routes[route] ? route : 'home');
      });
    });
  }

  // ============================================================
  // KHỞI ĐỘNG APP
  // ============================================================

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
      if (navigator.onLine) handleSyncNow();
    } else {
      navigate('login');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
