// Web người dùng khi KHÔNG kết nối được backend: thanh báo lỗi đỏ, đăng nhập/đăng ký báo lỗi rõ ràng (không còn chế độ demo).
// Chạy: node tools/tests/run.js user-offline
const { chromium } = require('playwright');
const { BASE } = require('./lib');
let pass = 0, fail = 0;
const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c ? '' : '   ' + (x ?? ''))); };
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await (await b.newContext()).newPage();
  await p.route('**/backend/**', r => r.abort());
  await p.goto(BASE + '/user/dang-nhap.html', { waitUntil: 'load' });
  ok(await p.isVisible('[role=alert]'), 'hiện thanh báo lỗi đỏ khi không tải được món ăn');
  ok((await p.textContent('[role=alert]')).includes('XAMPP'), 'thanh báo hướng dẫn mở qua XAMPP / php -S');
  await p.fill('#loginEmail', 'admin@homnayangi.vn'); await p.fill('#loginPassword', 'abc');
  await p.click('#loginForm [type=submit]');
  await p.waitForSelector('#toastContainer .toast, .toast', { timeout: 5000 });
  ok(/Không kết nối được máy chủ/.test(await p.textContent('.toast')), 'đăng nhập báo "Không kết nối được máy chủ"');
  ok(/dang-nhap/.test(p.url()) && await p.evaluate(() => localStorage.getItem('hom_nay_an_gi_user')) === null, 'không được đăng nhập giả');
  ok(await p.isEnabled('#loginForm [type=submit]') && (await p.textContent('#loginForm [type=submit]')).trim() === 'Đăng nhập', 'nút trở lại bình thường để thử lại');
  await p.goto(BASE + '/user/dang-ky.html', { waitUntil: 'load' });
  await p.fill('#regName', 'A'); await p.fill('#regEmail', 'a@b.com'); await p.fill('#regPassword', '123456'); await p.fill('#regPassword2', '123456');
  await p.click('#registerForm [type=submit]'); await p.waitForSelector('.toast');
  ok(/Không kết nối được máy chủ/.test(await p.textContent('.toast')) && await p.evaluate(() => localStorage.getItem('hom_nay_an_gi_user')) === null, 'đăng ký cũng báo lỗi, không tạo tài khoản giả');
  await p.goto(BASE + '/user/index.html#lien-he', { waitUntil: 'load' });
  await p.fill('#cfEmail', 'a@b.com'); await p.fill('#cfMessage', 'Nội dung góp ý thử nghiệm');
  await p.click('#cfSubmitBtn'); await p.waitForFunction(() => document.querySelector('#appToast.show'), null, { timeout: 5000 });
  const t = await p.textContent('#appToastBody');
  ok(/Không kết nối được máy chủ/.test(t) && !/Cảm ơn/.test(t), 'form liên hệ báo lỗi thay vì giả vờ gửi thành công', t);
  console.log(`\n${pass} đạt, ${fail} lỗi`);
  await b.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
