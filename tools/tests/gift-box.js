// Kiểm thử tự động (Playwright). Chạy từ thư mục gốc dự án: node tools/tests/gift-box.js
// Cần đã build frontend (python tools/build/build.py) và cài playwright (tools/node_modules).
const { chromium } = require('playwright');
const SITE = require('path').resolve(__dirname, '../../frontend/user').split(require('path').sep).join('/');
const { BASE } = require('./lib');
const OUT = require('os').tmpdir(); // ảnh chụp minh hoạ

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  p.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()));

  await p.goto(BASE + '/user/dang-ky.html', { waitUntil: 'networkidle' });
  await p.fill('#regName', 'Box'); await p.fill('#regEmail', 'box@test.com');
  await p.fill('#regPassword', '123456'); await p.fill('#regPassword2', '123456');
  await p.click('#registerForm button[type=submit]');
  await p.waitForTimeout(300);

  await p.goto(BASE + '/user/goi-y.html', { waitUntil: 'networkidle' });
  await p.click('#modeBoxBtn');
  await p.waitForTimeout(200);

  const boxCount = await p.$$eval('#boxGrid .box', a => a.length);
  const svgCount = await p.$$eval('#boxGrid .box-icon-svg', a => a.length);
  console.log('[hộp] số hộp:', boxCount, '| số svg vẽ ra:', svgCount, '| khớp:', boxCount === svgCount);
  await p.screenshot({ path: OUT + '/box_grid.png' });

  await p.click('.box[data-idx="0"]');
  await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + '/box_appear.png' });
  await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/box_anticipate.png' });
  await p.waitForTimeout(450);
  await p.screenshot({ path: OUT + '/box_open_moment.png' });

  await p.waitForSelector('#resultModal.show', { timeout: 9000 });
  console.log('[kết quả] modal hiện, món:', await p.textContent('#resultName'));
  console.log('[kết quả] overlay hộp vẫn còn hiển thị (is-show):', await p.$eval('#boxOpenOverlay', el => el.classList.contains('is-show')));
  await p.screenshot({ path: OUT + '/box_result_over_open.png' });

  await p.click('#resultModal .btn-close');
  await p.waitForTimeout(500);
  console.log('[đóng modal] overlay đã đóng:', !(await p.$eval('#boxOpenOverlay', el => el.classList.contains('is-show'))));
  console.log('[đóng modal] hộp 0 đã mở trong lưới:', await p.$eval('.box[data-idx="0"]', el => el.classList.contains('is-opened')));
  await p.screenshot({ path: OUT + '/box_after_close.png' });

  console.log(errors.length ? errors : 'no errors');
  await browser.close();
})();
