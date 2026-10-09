// Tiện ích dùng chung cho các test: địa chỉ site (do runner run.js cấp qua BASE_URL) và đăng nhập thật bằng backend.
// Các test KHÔNG chạy bằng file:// nữa vì dữ liệu món ăn và đăng nhập nằm ở backend PHP.
const ROOT = 'http://127.0.0.1:8099';
const BASE = process.env.BASE_URL || ROOT + '/frontend';       // .../frontend
const API = BASE.replace(/\/frontend$/, '') + '/backend/api';

// Đăng nhập thật; cookie phiên PHP được chia sẻ với các trang trong context.
async function login(ctx, page, email, password) {
  const r = await ctx.request.post(`${API}/auth/index.php?action=login`, { data: { email, password } });
  const body = await r.json();
  if (!body.data) throw new Error('Đăng nhập test thất bại: ' + JSON.stringify(body));
  await page.goto(BASE + '/user/index.html');
  return body.data;
}
const loginAdmin = (ctx, page) => login(ctx, page, 'admin@homnayangi.vn', 'admin123');

module.exports = { BASE, API, login, loginAdmin };
