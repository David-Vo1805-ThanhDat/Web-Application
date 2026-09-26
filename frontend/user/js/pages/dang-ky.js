/* pages/dang-ky.js — logic riêng của trang dang-ky.html (nạp sau js/core và js/widgets). */
document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var next = params.get('next') || 'trang-chu.html';

  if (getCurrentUser()) { window.location.replace(next); return; }

  document.getElementById('registerForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('regName').value.trim();
    var email = document.getElementById('regEmail').value.trim();
    var password = document.getElementById('regPassword').value;
    var password2 = document.getElementById('regPassword2').value;
    if (!name || !email) {
      showToast('error', 'Điền đủ tên và email nhé');
      return;
    }
    if (password.length < 6) {
      showToast('error', 'Mật khẩu cần ít nhất 6 ký tự');
      return;
    }
    if (password !== password2) {
      showToast('error', 'Hai lần nhập mật khẩu chưa khớp');
      return;
    }
    var btn = e.target.querySelector('[type=submit]'), label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Đang tạo tài khoản…';
    Backend.available().then(function (online) {
      if (!online) throw new Error(Backend.OFFLINE_MESSAGE);
      return Backend.register(name, email, password);
    }).then(function (serverUser) {
      loginUser(serverUser);
      return Sync.pull(); // dữ liệu có sẵn ở trình duyệt (nếu có) được chuyển lên tài khoản mới
    }).then(function () {
      btn.textContent = 'Đang vào…';
      window.location.href = next;
    }).catch(function (err) {
      btn.disabled = false; btn.textContent = label;
      showToast('error', err.message);
    });
  });
});
