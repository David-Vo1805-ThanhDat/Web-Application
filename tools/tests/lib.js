// Tiện ích dùng chung cho các test: địa chỉ site (do runner run.js cấp qua BASE_URL) và đăng nhập thật bằng backend.
// Các test KHÔNG chạy bằng file:// nữa vì dữ liệu món ăn và đăng nhập nằm ở backend PHP.
const ROOT = 'http://127.0.0.1:8099';
const BASE = process.env.BASE_URL || ROOT + '/frontend';       // .../frontend
const API = BASE.replace(/\/frontend$/, '') + '/backend/api';

// Đăng nhập thật (cookie phiên PHP nằm trong context) rồi lưu thông tin như trang đăng nhập làm.
async function login(ctx, page, email, password) {
  const r = await ctx.request.post(`${API}/auth/index.php?action=login`, { data: { email, password } });
  const body = await r.json();
  if (!body.data) throw new Error('Đăng nhập test thất bại: ' + JSON.stringify(body));
  await page.goto(BASE + '/user/index.html');
  await page.evaluate(u => localStorage.setItem('hom_nay_an_gi_user', JSON.stringify({ email: u.email, name: u.name, since: Date.now(), role: u.role, server: true })), body.data);
  return body.data;
}
const loginAdmin = (ctx, page) => login(ctx, page, 'admin@homnayangi.vn', 'admin123');

module.exports = { BASE, API, login, loginAdmin };
