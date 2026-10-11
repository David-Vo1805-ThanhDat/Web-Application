/* pages/auth-google.js — nút "Tiếp tục với Google" ở trang đăng nhập/đăng ký (khối GOOGLE_AUTH_BLOCK trong tools/build/generate.py).
   - Gắn ?next= (trang muốn quay về sau khi đăng nhập) vào link backend/api/auth/google.php.
   - Google/backend trả về ?google=<mã> khi không đăng nhập được → hiện thông báo tương ứng (chỉ dùng câu có sẵn bên dưới,
     không hiện chữ lấy từ URL). */
document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var btn = document.getElementById('googleAuthBtn');
  var next = params.get('next');
  if (btn && next) btn.href = btn.getAttribute('href') + '?next=' + encodeURIComponent(next);

  var MESSAGES = {
    'chua-cau-hinh': 'Đăng nhập bằng Google chưa được bật trên máy chủ này. Bạn dùng email và mật khẩu giúp mình nhé.',
    'huy': 'Bạn đã huỷ đăng nhập bằng Google.',
    'het-han': 'Phiên đăng nhập Google đã hết hạn, bạn bấm lại nút Google nhé.',
    'quan-tri': 'Tài khoản quản trị vui lòng đăng nhập bằng email và mật khẩu.',
    'bi-khoa': 'Tài khoản đã bị tạm khoá. Vui lòng liên hệ quản trị viên.',
    'chua-xac-minh': 'Email Google của bạn chưa được xác minh.',
    'loi': 'Chưa đăng nhập được bằng Google, bạn thử lại sau nhé.',
  };
  var code = params.get('google');
  if (code) {
    if (typeof showToast === 'function') showToast('error', MESSAGES[code] || MESSAGES.loi);
    params.delete('google');   // bỏ mã lỗi khỏi địa chỉ để tải lại trang không hiện lại thông báo
    var qs = params.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
  }
});
