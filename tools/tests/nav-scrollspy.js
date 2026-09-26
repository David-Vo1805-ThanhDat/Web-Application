// Kiểm thử tự động (Playwright). Chạy từ thư mục gốc dự án: node tools/tests/nav-scrollspy.js
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
  await p.goto(BASE + '/user/index.html', { waitUntil: 'networkidle' });

  async function activeLabel() {
    return p.$eval('.site-navbar .nav-link.active', (el) => el.textContent.trim()).catch(() => '(không có)');
  }

  console.log('[tải trang] mục đang sáng:', await activeLabel());

  await p.click('a[href="index.html#gioi-thieu"]');
  await p.waitForTimeout(1200);
  console.log('[bấm Giới Thiệu] mục đang sáng:', await activeLabel());
  console.log('[bấm Giới Thiệu] số mục đang sáng cùng lúc:', await p.$$eval('.site-navbar .nav-link.active', (a) => a.length));

  await p.click('a[href="index.html#lien-he"]');
  await p.waitForTimeout(1200);
  console.log('[bấm Liên Hệ] mục đang sáng:', await activeLabel());
  console.log('[bấm Liên Hệ] số mục đang sáng cùng lúc:', await p.$$eval('.site-navbar .nav-link.active', (a) => a.length));

  // tự cuộn tay lên đầu trang (không bấm menu) -> phải tự về Trang Chủ
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(1200);
  console.log('[tự cuộn lên đầu] mục đang sáng:', await activeLabel());

  // tự cuộn tay xuống đúng đoạn Liên Hệ (không bấm menu)
  await p.evaluate(() => document.getElementById('lien-he').scrollIntoView());
  await p.waitForTimeout(1200);
  console.log('[tự cuộn tới Liên Hệ] mục đang sáng:', await activeLabel());

  // tự cuộn tay xuống hẳn cuối trang (đoạn Giới Thiệu / footer)
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(1200);
  console.log('[tự cuộn xuống cuối] mục đang sáng:', await activeLabel());

  console.log(errors.length ? errors : 'no errors');
  await browser.close();
})();
