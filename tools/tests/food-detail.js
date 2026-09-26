// Kiểm thử tự động (Playwright). Chạy từ thư mục gốc dự án: node tools/tests/food-detail.js
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
  await p.fill('#regName', 'CT Check');
  await p.fill('#regEmail', 'ctcheck@test.com');
  await p.fill('#regPassword', '123456');
  await p.fill('#regPassword2', '123456');
  await p.click('#registerForm button[type=submit]');
  await p.waitForTimeout(400);

  await p.goto(BASE + '/user/chi-tiet-mon-an.html?id=pho-bo-ha-noi', { waitUntil: 'networkidle' });
  console.log('[trước] tiến độ:', await p.textContent('#ingredientProgress'));
  await p.click('.ingredient-btn:first-child');
  await p.waitForTimeout(200);
  console.log('[sau khi bấm 1 nguyên liệu] tiến độ:', await p.textContent('#ingredientProgress'));
  console.log('[sau khi bấm] class có ingredient-checked:', await p.$eval('.ingredient-btn:first-child', (el) => el.classList.contains('ingredient-checked')));

  // Yêu thích trên trang chi tiết
  const favBtn = await p.$('#detailFavBtn, .detail-fav-btn, [aria-label*="Lưu"], [aria-label*="yêu thích"]');
  console.log('[nút yêu thích] tìm thấy:', !!favBtn);
  if (favBtn) {
    await favBtn.click();
    await p.waitForTimeout(300);
    console.log('[sau khi bấm yêu thích] badge:', await p.textContent('.favorite-count-badge').catch(() => '(không có)'));
  }

  // Related foods - bấm sang món khác
  const relatedLink = await p.$('a.food-card-title, .food-card a');
  if (relatedLink) {
    const href = await relatedLink.getAttribute('href');
    console.log('[món tương tự] href ví dụ:', href);
  }

  console.log(errors.length ? errors : 'no errors');
  await browser.close();
})();
