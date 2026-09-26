/* pages/dang-nhap.js — logic riêng của trang dang-nhap.html (nạp sau js/core và js/widgets). */
document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  // Không có ?next= thì đưa về đúng giao diện theo vai trò do server trả về: admin → Bảng quản trị, người dùng → Trang chủ
  function homeFor(user) { return isAdminUser(user) ? '../admin/dashboard.html' : 'trang-chu.html'; }
  var next = params.get('next');

  // Đã đăng nhập sẵn thì khỏi cần thấy form nữa
  var current = getCurrentUser();
  if (current) { window.location.replace(next || homeFor(current)); return; }

  document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    if (!email || !password) {
      showToast('error', 'Nhập email và mật khẩu nhé');
      return;
    }
    var btn = e.target.querySelector('[type=submit]'), label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Đang đăng nhập…';
    Backend.available().then(function (online) {
      if (!online) throw new Error(Backend.OFFLINE_MESSAGE);
      return Backend.login(email, password);
    }).then(function (serverUser) {
      var user = loginUser(serverUser);
      return Sync.pull().then(function () { return user; }); // kéo yêu thích, hồ sơ sức khỏe... của tài khoản này xuống
    }).then(function (user) {
      btn.textContent = 'Đang vào…';
      window.location.href = next || homeFor(user);
    }).catch(function (err) {
      btn.disabled = false; btn.textContent = label;
      showToast('error', err.message);
    });
  });
});
