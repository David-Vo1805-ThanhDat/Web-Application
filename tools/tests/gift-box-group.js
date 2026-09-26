// Kiểm thử tự động (Playwright). Chạy từ thư mục gốc dự án: node tools/tests/gift-box-group.js
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

  await p.goto(BASE + '/user/dang-ky.html', { waitUntil: 'networkidle' });
  await p.fill('#regName', 'BoxGrp'); await p.fill('#regEmail', 'boxgrp@test.com');
  await p.fill('#regPassword', '123456'); await p.fill('#regPassword2', '123456');
  await p.click('#registerForm button[type=submit]');
  await p.waitForTimeout(300);

  await p.goto(BASE + '/user/goi-y.html#nhom', { waitUntil: 'networkidle' });
  const dishes = ['Bánh tráng trộn mẹ nấu', 'Mì gói úp đại', 'Trà chanh giã tay'];
  const rows = await p.$$('.person');
  for (let i = 0; i < 3; i++) {
    await rows[i].$eval('.person-dish', (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, dishes[i]);
  }
  await p.waitForTimeout(200);
  await p.click('#modeBoxBtn');
  await p.waitForTimeout(300);

  console.log('[nhóm] số hộp:', await p.$$eval('#boxGrid .box', a => a.length));
  await p.click('.box[data-idx="0"]');
  await p.waitForSelector('#simpleResultModal.show', { timeout: 9000 });
  await p.waitForTimeout(250);
  await p.screenshot({ path: OUT + '/box_group_result.png' });

  await p.click('#simpleResultRejectBtn');
  await p.waitForTimeout(500);
  console.log('overlay đã đóng sau "Chưa vừa lòng":', !(await p.$eval('#boxOpenOverlay', el => el.classList.contains('is-show'))));

  // mở nốt 2 hộp còn lại, xong bấm "Đổi hộp mới"
  await p.click('.box[data-idx="1"]');
  await p.waitForSelector('#simpleResultModal.show', { timeout: 9000 });
  await p.click('#simpleResultAcceptBtn');
  await p.waitForTimeout(500);
  await p.click('.box[data-idx="2"]');
  await p.waitForSelector('#simpleResultModal.show', { timeout: 9000 });
  await p.click('#simpleResultAcceptBtn');
  await p.waitForTimeout(500);
  console.log('cả 3 hộp đã mở:', await p.$$eval('#boxGrid .box.is-opened', a => a.length));
  await p.click('#resetBoxesBtn');
  await p.waitForTimeout(300);
  console.log('sau "Đổi hộp mới", còn hộp mở nào không:', await p.$$eval('#boxGrid .box.is-opened', a => a.length));

  console.log(errors.length ? errors : 'no errors');
  await browser.close();
})();
