/* Account identity comes from the PHP session and database bootstrap. */

function getCurrentUser() { return window.APP_USER || null; }
function isAdminUser(user) { return !!user && user.role === 'admin'; }
function loginUser(serverUser) { window.APP_USER = Object.assign({}, serverUser, { server:true }); return window.APP_USER; }
function logoutUser() {
  Sync.flush().then(function () { return Backend.logout(); }).then(function () {
    window.APP_USER = null; Sync.clearLocal(); window.location.href = 'index.html';
  }).catch(function (e) { showToast('error', e.message || 'Chưa lưu được thay đổi. Hãy thử lại.'); });
}
// Cập nhật hồ sơ trên server (profile.update): data = { name } và/hoặc { avatar: dataURL | null }
function updateUserProfile(data, failMessage) {
  return fetch('../../backend/api/user/index.php?action=profile.update', {
    method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data),
  }).then(function (r) { return r.json().then(function (b) {
    if (!r.ok || b.error) throw new Error(b.error || failMessage || 'Không cập nhật được tài khoản');
    if ('name' in b.data) window.APP_USER.name = b.data.name;
    if ('avatar' in b.data) window.APP_USER.avatar = b.data.avatar;
    return window.APP_USER;
  }); });
}
function updateUserName(name) { return updateUserProfile({ name: name }, 'Không cập nhật được tên'); }
function updateUserAvatar(dataUrl) { return updateUserProfile({ avatar: dataUrl }, 'Không cập nhật được ảnh đại diện'); }

// Ruột của ô avatar: ảnh đại diện nếu có, không thì chữ cái đầu của tên
function avatarInner(user) {
  return user && user.avatar ? '<img src="' + escHtml(user.avatar) + '" alt="">' : escHtml(initials((user && user.name) || '?'));
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
        '<span class="nav-user-avatar">' + avatarInner(user) + '</span>' +
        '<span class="nav-user-name">' + escHtml(user.name) + '</span>' +
      '</button>' +
      '<ul class="dropdown-menu dropdown-menu-end">' +
        '<li class="dropdown-header-user">' +
          '<span class="nav-user-avatar dropdown-header-avatar">' + avatarInner(user) + '</span>' +
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
        '<li><button class="dropdown-item" type="button" data-open-feedback><i class="bi bi-chat-heart"></i> Góp ý &amp; liên hệ</button></li>' +
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
