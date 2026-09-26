/* core/backend.js — Gọi API PHP đăng nhập (backend/api/auth) từ web người dùng.
   Đăng nhập/đăng ký/đăng xuất là THẬT (phiên PHP). Web cần backend: nếu trang mở bằng file:// hoặc không có PHP thì
   available() trả false và các trang báo lỗi OFFLINE_MESSAGE (không còn chế độ demo). */
var Backend = (function () {
  var BASE = '../../backend/api/auth/index.php';
  var probe = null;
  var OFFLINE_MESSAGE = 'Không kết nối được máy chủ. Hãy mở trang qua XAMPP (Apache + PHP) hoặc chạy php -S — xem README.';

  function call(action, params) {
    return fetch(BASE + '?action=' + action, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params || {}),
    }).then(function (res) {
      return res.json().then(function (body) { return { ok: res.ok, status: res.status, body: body }; });
    });
  }

  // Có backend PHP trả JSON { data | error } hay không (kết quả nhớ lại để khỏi hỏi nhiều lần)
  function available() {
    if (probe) return probe;
    probe = /^https?:$/.test(location.protocol)
      ? call('ping').then(function (r) { return !!r.body && ('data' in r.body || 'error' in r.body); }).catch(function () { return false; })
      : Promise.resolve(false);
    return probe;
  }

  // Lỗi có thêm: status (mã HTTP) và missing = true khi backend CHƯA có hành động này (404 "Hành động không tồn tại"),
  // để giao diện tự ẩn tính năng thay vì báo lỗi.
  function unwrap(r) {
    if (!r.ok || r.body.error) {
      var err = new Error(r.body.error || 'Có lỗi xảy ra, vui lòng thử lại');
      err.status = r.status;
      err.missing = r.status === 404 && /không tồn tại/i.test(err.message);
      throw err;
    }
    return r.body.data;
  }

  // API công khai (góp ý, xem đánh giá) và API người dùng (gửi đánh giá)
  var PUBLIC = '../../backend/api/public/index.php', USER = '../../backend/api/user/index.php';
  function post(url, action, params) {
    return fetch(url + '?action=' + action, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params || {}),
    }).then(function (res) { return res.json().then(function (body) { return unwrap({ ok: res.ok, status: res.status, body: body }); }); });
  }

  return {
    OFFLINE_MESSAGE: OFFLINE_MESSAGE,
    available: available,
    sendFeedback: function (data) { return post(PUBLIC, 'feedback.create', data); },
    // Phản hồi nấu thử công thức (hợp đồng ở backend/HANDOFF.md, mục P0)
    recipeStats: function (foodId) { return post(PUBLIC, 'recipe.stats', { foodId: foodId }); },
    recipeMine: function (foodId) { return post(USER, 'recipe.mine', { foodId: foodId }); },
    recipeSubmit: function (data) { return post(USER, 'recipe.submit', data); },
    login: function (email, password) { return call('login', { email: email, password: password }).then(unwrap); },
    register: function (name, email, password) { return call('register', { name: name, email: email, password: password }).then(unwrap); },
    logout: function () { return call('logout').catch(function () {}); },
  };
})();
