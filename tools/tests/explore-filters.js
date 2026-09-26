// Kiểm thử tự động (Playwright). Chạy từ thư mục gốc dự án: node tools/tests/explore-filters.js
// Cần đã build frontend (python tools/build/build.py) và cài playwright (tools/node_modules).
const { chromium } = require('playwright');
const SITE = require('path').resolve(__dirname, '../../frontend/user').split(require('path').sep).join('/');
const { BASE } = require('./lib');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const errors = [];
  const hook = (p) => {
    p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  hook(p);
  await p.goto(BASE + '/user/dang-ky.html', { waitUntil: 'networkidle' });
  await p.fill('#regName', 'KP Filter');
  await p.fill('#regEmail', 'kpfilter@test.com');
  await p.fill('#regPassword', '123456');
  await p.fill('#regPassword2', '123456');
  await p.click('#registerForm button[type=submit]');
  await p.waitForTimeout(400);

  await p.goto(BASE + '/user/kham-pha.html', { waitUntil: 'networkidle' });
  await p.click('[data-bs-target="#filtersPanel"]');
  await p.waitForTimeout(400);
  await p.click('.chip-filter[data-value="vegetarian"]');
  await p.waitForTimeout(300);
  console.log('[lọc Ăn Chay] số món:', await p.$$eval('.food-card', (a) => a.length));
  const names = await p.$$eval('.food-card-title', (a) => a.map((e) => e.textContent.trim()));
  console.log('[lọc Ăn Chay] tên món:', names);

  // Lọc theo danh mục
  await p.click('.chip-filter[data-value="all"]');
  await p.click('[data-value="trang-mieng"]');
  await p.waitForTimeout(300);
  console.log('[lọc danh mục Tráng Miệng] số món:', await p.$$eval('.food-card', (a) => a.length));

  // Sắp xếp
  await p.selectOption('#sortSelect', 'price-asc').catch(async () => {
    console.log('[sắp xếp] không tìm thấy #sortSelect, thử selector khác');
  });

  console.log(errors.length ? errors : 'no errors');
  await browser.close();
})();
