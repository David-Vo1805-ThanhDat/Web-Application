/* =========================================================
   auth.js — trạng thái đăng nhập phía trình duyệt.
   Đăng nhập/đăng ký/đăng xuất là THẬT, do backend PHP xử lý (xem
   js/core/backend.js, backend/api/auth). Trình duyệt chỉ nhớ tên,
   email và vai trò server trả về (localStorage) để vẽ giao diện;
   quyền truy cập luôn được server kiểm tra lại ở mỗi lời gọi API.

   Các trang cần đăng nhập ("gated") đã tự chặn ngay trong <head>
   (xem build_head() trong generate.py) để không loé nội dung ra
   rồi mới đá về trang đăng nhập. File này chỉ lo phần còn lại:
   lưu/đọc người dùng, hiện tên trên navbar và đăng xuất.
   ========================================================= */

var AUTH_KEY = 'hom_nay_an_gi_user';

function getCurrentUser() {
  try {
    var raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

// Vai trò ('admin' | 'user') do SERVER quyết định và trả về khi đăng nhập
function isAdminUser(user) { return !!user && user.role === 'admin'; }

// serverUser: { email, name, role } do backend trả về sau khi đăng nhập/đăng ký thành công
function loginUser(serverUser) {
  var user = { email: serverUser.email, name: serverUser.name, since: Date.now(), role: serverUser.role, server: true };
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(user)); } catch (e) {}
  return user;
}

function logoutUser() {
  var done = function () { window.location.href = 'index.html'; };
  var clearAuth = function () { try { localStorage.removeItem(AUTH_KEY); } catch (e) {} };
  if (typeof Backend === 'undefined' || typeof Sync === 'undefined') { clearAuth(); return done(); }
  // Gửi nốt thay đổi còn chờ lên server, huỷ phiên PHP, rồi xoá đăng nhập + dữ liệu người dùng khỏi trình duyệt (máy dùng chung)
  var wasServer = Sync.active();
  Sync.flush()
    .then(function () { return Backend.available(); })
    .then(function (ok) { return ok ? Backend.logout() : null; })
    .then(function () { clearAuth(); if (wasServer) Sync.clearLocal(); })
    .then(done, function () { clearAuth(); done(); });
}

function updateUserName(name) {
  var user = getCurrentUser();
  if (!user) return null;
  user.name = (name || '').trim() || user.email.split('@')[0];
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(user)); } catch (e) {}
  return user;
}

function initials(name) {
  var words = name.trim().split(/\s+/).filter(Boolean).slice(-2);
  return words.map(function (w) { return w[0]; }).join('').toUpperCase() || '?';
}

/* Hiện chip tên người dùng + menu đăng xuất trên navbar (chỉ có ở các trang
   đã đăng nhập, nơi navbar() sinh sẵn khung rỗng #navUserSlot). */
// Escape khi chèn tên/email (do người dùng tự đặt) vào HTML
function escHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}

function renderAuthNav() {
  var slot = document.getElementById('navUserSlot');
  if (!slot) return;
  var user = getCurrentUser();
  if (!user) return;
  slot.innerHTML =
    '<div class="nav-user dropdown">' +
      '<button class="nav-user-btn dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">' +
        '<span class="nav-user-avatar">' + initials(user.name) + '</span>' +
        '<span class="nav-user-name">' + escHtml(user.name) + '</span>' +
      '</button>' +
      '<ul class="dropdown-menu dropdown-menu-end">' +
        '<li class="dropdown-header-user">' +
          '<span class="nav-user-avatar dropdown-header-avatar">' + initials(user.name) + '</span>' +
          '<span><span class="d-block fw-semibold text-truncate">' + escHtml(user.name) + '</span>' +
          '<span class="d-block small text-muted text-truncate">' + escHtml(user.email) + '</span></span>' +
        '</li>' +
        '<li><hr class="dropdown-divider"></li>' +
        '<li><a class="dropdown-item d-flex align-items-center" href="kham-pha.html?tab=favorites">' +
          '<i class="bi bi-heart"></i> Món yêu thích <span class="favorite-count-badge ms-auto" style="display:none;">0</span></a></li>' +
        '<li><a class="dropdown-item" href="goi-y.html#nhom"><i class="bi bi-people"></i> Chọn cùng cả nhóm</a></li>' +
        '<li><hr class="dropdown-divider"></li>' +
        (isAdminUser(user) ? '<li><a class="dropdown-item" href="../admin/dashboard.html"><i class="bi bi-speedometer2"></i> Bảng quản trị</a></li>' : '') +
        '<li><a class="dropdown-item" href="tai-khoan.html"><i class="bi bi-person-gear"></i> Tài khoản &amp; cài đặt</a></li>' +
        '<li><a class="dropdown-item" href="index.html#lien-he"><i class="bi bi-life-preserver"></i> Trợ giúp &amp; góp ý</a></li>' +
        '<li><hr class="dropdown-divider"></li>' +
        '<li><button class="dropdown-item" id="logoutBtn" type="button"><i class="bi bi-box-arrow-right"></i> Đăng xuất</button></li>' +
      '</ul>' +
    '</div>';
  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
  // huy hiệu "món yêu thích" vừa được tạo ra ở trên nên bỏ lỡ lần đồng bộ đầu
  // tiên của main.js (script đó chạy trước, khi huy hiệu này chưa tồn tại) —
  // gọi lại cho đúng số món đang lưu.
  if (typeof updateFavoriteBadge === 'function') updateFavoriteBadge();
}

document.addEventListener('DOMContentLoaded', renderAuthNav);
