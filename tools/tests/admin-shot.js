// Chụp màn hình 1 trang admin (đăng nhập admin thật). Chạy server rồi: node tools/tests/admin-shot.js <trang.html[?query]> <ảnh.png> [rộng cao]
// Cần backend đang chạy, ví dụ:  C:\xampp\php\php.exe -S 127.0.0.1:8099 -t .   (BASE_URL mặc định http://127.0.0.1:8099/frontend)
const { chromium } = require('playwright');
const { BASE, loginAdmin } = require('./lib');
const [,, page, out, w, h] = process.argv;
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: +(w || 1440), height: +(h || 900) } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await loginAdmin(ctx, p);
  await p.goto(BASE + '/admin/' + page, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  await p.screenshot({ path: out, fullPage: true });
  console.log(errs.length ? errs : 'no errors', 'url:', p.url().split('/').slice(-2).join('/'));
  await browser.close();
})();
