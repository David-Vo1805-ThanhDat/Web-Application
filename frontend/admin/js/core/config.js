/* core/config.js — Cấu hình chung của giao diện admin. Toàn bộ dữ liệu nằm ở backend PHP (backend/api/admin). */
window.ADMIN_CONFIG = {
  apiBase: '../../backend/api/admin/',
  authBase: '../../backend/api/auth/',
  loginPage: '../user/dang-nhap.html',
  userKey: 'hom_nay_an_gi_user',   // khoá đăng nhập dùng chung với web người dùng (xem frontend/user/js/core/auth.js)
  pageSize: 8,
};
