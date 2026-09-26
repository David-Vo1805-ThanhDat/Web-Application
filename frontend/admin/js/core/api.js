/* core/api.js — Cổng gọi dữ liệu duy nhất của giao diện admin: Api.call('foods.list', {...}) → Promise.
   Gửi POST JSON tới backend PHP: <apiBase>index.php?action=<tên hành động> (xem backend/api/admin), nhận { data } hoặc { error }.
   File này không chứa dữ liệu; hết phiên đăng nhập (401) thì đưa về trang đăng nhập rồi quay lại đúng trang. */
(function () {
  'use strict';

  // Trạng thái ĐANG TẢI: <body class="is-loading"> (khung chờ nhấp nháy, xem components/skeleton.css) được gỡ khi các lời gọi
  // đầu tiên xong. Nếu lần tải đầu tiên LỖI thì hiện banner "Không tải được dữ liệu" kèm nút Thử lại.
  var pending = 0, firstLoadDone = false;
  function endFirstLoad() { firstLoadDone = true; document.body.classList.remove('is-loading'); }
  setTimeout(function () { if (!firstLoadDone) endFirstLoad(); }, 10000); // đề phòng: không để nhấp nháy mãi
  function settle() { if (--pending <= 0 && !firstLoadDone) endFirstLoad(); }
  function showLoadError(message) {
    var box = document.getElementById('loadError');
    if (!box || box.hidden === false) return;
    document.getElementById('loadErrorMsg').textContent = message;
    document.getElementById('loadErrorRetry').addEventListener('click', function () { location.reload(); });
    box.hidden = false; document.body.classList.add('has-load-error');
  }

  // Hết phiên (401): xoá thông tin đăng nhập cũ rồi về trang đăng nhập, sau đó quay lại đúng trang này
  function toLogin() {
    var cfg = window.ADMIN_CONFIG, page = location.pathname.split('/').pop() + location.search;
    try { localStorage.removeItem(cfg.userKey); } catch (e) {}
    location.replace(cfg.loginPage + '?next=' + encodeURIComponent('../admin/' + page));
    return new Promise(function () {}); // đang chuyển trang: không cho các bước sau chạy tiếp
  }

  function call(action, params) {
    var cfg = window.ADMIN_CONFIG;
    pending++;
    return fetch(cfg.apiBase + 'index.php?action=' + encodeURIComponent(action), {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params || {}),
    }).catch(function () {
      throw new Error('Không kết nối được máy chủ. Hãy mở trang qua XAMPP (Apache + PHP) hoặc chạy php -S — xem README.');
    }).then(function (res) {
      if (res.status === 401) return toLogin();
      return res.json().then(function (body) {
        if (!res.ok || body.error) {
          var err = new Error(body.error || ('Lỗi máy chủ ' + res.status));
          err.status = res.status;
          err.missing = res.status === 404 && /không tồn tại/i.test(err.message);   // backend CHƯA có hành động này
          throw err;
        }
        return body.data;
      }, function () { throw new Error('Máy chủ không trả về dữ liệu hợp lệ (PHP chưa chạy?)'); });
    }).then(function (data) { settle(); return data; }, function (err) {
      var firstLoad = !firstLoadDone;
      settle();
      if (err.missing) throw err;                    // trang tự xử lý (hiện "backend chưa hỗ trợ"), không báo lỗi chung
      if (firstLoad) showLoadError(err.message || String(err));      // lỗi ở lần tải đầu: banner + Thử lại
      else if (window.Toast) window.Toast.error('Có lỗi xảy ra', err.message || String(err));
      throw err;
    });
  }

  // Đăng xuất: huỷ phiên PHP rồi xoá đăng nhập phía trình duyệt
  function logout() {
    var cfg = window.ADMIN_CONFIG;
    return fetch(cfg.authBase + 'index.php?action=logout', { method: 'POST', credentials: 'include' }).catch(function () {})
      .then(function () { try { localStorage.removeItem(cfg.userKey); } catch (e) {} });
  }

  window.Api = { call: call, logout: logout };
})();
