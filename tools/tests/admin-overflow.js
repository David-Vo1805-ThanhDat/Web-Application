// Kiểm tra tất cả trang admin: lỗi console + tràn ngang ở nhiều độ rộng (đăng nhập admin thật qua backend).
// Chạy: node tools/tests/run.js admin-overflow
const { chromium } = require('playwright');
const { BASE, loginAdmin } = require('./lib');
const { installAdminRecipeMock } = require('./recipe-mock');   // trang công thức cần API mà backend chưa có → dùng bản giả lập để kiểm bố cục
const PAGES = ['dashboard', 'mon-an', 'mon-an-sua?id=pho-bo-ha-noi', 'danh-muc', 'quan-an', 'cong-thuc', 'nguoi-dung', 'danh-gia', 'thong-ke', 'cai-dat', 'nhat-ky'];
const WIDTHS = [1440, 1024, 768, 390];
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  let bad = 0;
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    await installAdminRecipeMock(ctx);
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await loginAdmin(ctx, p);
    for (const pg of PAGES) {
      const [file, q] = pg.split('?');
      await p.goto(BASE + '/admin/' + file + '.html' + (q ? '?' + q : ''), { waitUntil: 'networkidle' });
      await p.waitForTimeout(500);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > 0 || errs.length) { bad++; console.log(`✗ ${w}px ${pg}: overflow=${over}`, errs.splice(0)); }
    }
    await ctx.close();
  }
  console.log(bad ? `${bad} vấn đề` : 'OK: không lỗi, không tràn ngang');
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
