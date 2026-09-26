// Kiểm thử tự động (Playwright). Chạy từ thư mục gốc dự án: node tools/tests/responsive.js
// Cần đã build frontend (python tools/build/build.py) và cài playwright (tools/node_modules).
const { chromium } = require('playwright');
const { BASE } = require('./lib');
const SITE = require('path').resolve(__dirname, '../../frontend/user').split(require('path').sep).join('/');
const OUT = require('os').tmpdir(); // ảnh chụp khi phát hiện tràn ngang

const WIDTHS = [320, 360, 390, 412, 430, 576, 768, 820, 899, 900, 901, 992, 1024, 1200, 1280, 1440, 1920];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const errors = [];
  let overflowCount = 0;

  // đăng nhập trước để test cả các trang bên trong
  const setup = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const sp = await setup.newPage();
  await sp.goto(BASE + '/user/dang-ky.html', { waitUntil: 'networkidle' });
  await sp.fill('#regName', 'Test Responsive');
  await sp.fill('#regEmail', 'responsive@test.com');
  await sp.fill('#regPassword', '123456');
  await sp.fill('#regPassword2', '123456');
  await sp.click('#registerForm button[type=submit]');
  await sp.waitForTimeout(300);
  const storageState = await setup.storageState();
  await setup.close();

  const pages = [
    ['index.html', false],
    ['dang-nhap.html', false],
    ['dang-ky.html', false],
    ['trang-chu.html', true],
    ['goi-y.html', true],
  ];

  for (const [url, needsLogin] of pages) {
    const ctx = await browser.newContext({ storageState: needsLogin ? storageState : undefined });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(url + ' pageerror: ' + e.message));
    for (const w of WIDTHS) {
      await p.setViewportSize({ width: w, height: 900 });
      await p.goto(BASE + '/user/' + url, { waitUntil: 'load' });
      await p.waitForTimeout(150);
      const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 1) {
        overflowCount++;
        console.log('[TRÀN NGANG]', url, 'rộng ' + w + 'px -> scrollWidth thừa ' + overflow + 'px');
        await p.screenshot({ path: OUT + '/overflow_' + url.replace('.html', '') + '_' + w + '.png', fullPage: false });
      }
    }
    await ctx.close();
  }

  console.log('--- xong sweep, lỗi console/js ---');
  console.log(errors.length ? errors : 'không có');
  await browser.close();
  process.exit(overflowCount || errors.length ? 1 : 0);
})();
