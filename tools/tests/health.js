// Kiểm thử tự động (Playwright). Chạy từ thư mục gốc dự án: node tools/tests/health.js
// Cần đã build frontend (python tools/build/build.py) và cài playwright (tools/node_modules).
const { chromium } = require('playwright');
const SITE = require('path').resolve(__dirname, '../../frontend/user').split(require('path').sep).join('/');
const { BASE } = require('./lib');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const errors = [];
  const hook = (p) => {
    p.on('pageerror', (e) => errors.push('pageerror @ ' + p.url() + ': ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error') errors.push('console @ ' + p.url() + ': ' + m.text()); });
  };
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  hook(p);

  // Đăng ký tài khoản mới
  await p.goto(BASE + '/user/dang-ky.html', { waitUntil: 'networkidle' });
  await p.fill('#regName', 'Minh Khang');
  await p.fill('#regEmail', 'minhkhang@test.com');
  await p.fill('#regPassword', '123456');
  await p.fill('#regPassword2', '123456');
  await p.click('#registerForm button[type=submit]');
  await p.waitForTimeout(500);

  // Navbar app: phải thấy 2 mục sức khỏe, KHÔNG còn Giới Thiệu/Liên Hệ
  await p.goto(BASE + '/user/trang-chu.html', { waitUntil: 'networkidle' });
  console.log('[navbar app] có Thực Đơn Sức Khỏe:', await p.$eval('a[data-page="thuc-don-suc-khoe.html"]', el => !!el).catch(() => false));
  console.log('[navbar app] có Nhật Ký Sức Khỏe:', await p.$eval('a[data-page="nhat-ky-suc-khoe.html"]', el => !!el).catch(() => false));
  console.log('[navbar app] còn Giới Thiệu không (phải false):', await p.$eval('a[data-page="gioi-thieu.html"]', el => !!el).catch(() => false));
  console.log('[navbar app] còn Liên Hệ không (phải false):', await p.$eval('a[data-page="lien-he.html"]', el => !!el).catch(() => false));

  // Vào Thực Đơn Sức Khỏe khi CHƯA có hồ sơ -> empty state
  await p.goto(BASE + '/user/thuc-don-suc-khoe.html', { waitUntil: 'networkidle' });
  console.log('[thuc-don, chưa có hồ sơ] hiện empty state:', await p.$eval('#planEmptyState', el => !el.classList.contains('d-none')));
  console.log('[thuc-don, chưa có hồ sơ] planMain ẩn:', await p.$eval('#planMain', el => el.classList.contains('d-none')));

  // Vào Nhật Ký khi CHƯA có hồ sơ -> empty state
  await p.goto(BASE + '/user/nhat-ky-suc-khoe.html', { waitUntil: 'networkidle' });
  console.log('[nhat-ky, chưa có hồ sơ] hiện empty state:', await p.$eval('#logEmptyState', el => !el.classList.contains('d-none')));

  // Thiết lập hồ sơ sức khỏe ở Tài Khoản
  await p.goto(BASE + '/user/tai-khoan.html', { waitUntil: 'networkidle' });
  await p.fill('#hpHeight', '170');
  await p.fill('#hpWeight', '65');
  await p.fill('#hpAge', '22');
  await p.selectOption('#hpGender', 'nam');
  await p.selectOption('#hpActivity', 'vua');
  await p.selectOption('#hpGoal', 'giam');
  await p.click('#healthForm button[type=submit]');
  await p.waitForTimeout(300);
  console.log('[tai-khoan] BMI hiện:', await p.textContent('#hsBMI'));
  console.log('[tai-khoan] Mục tiêu calo hiện:', await p.textContent('#hsTarget'));
  console.log('[tai-khoan] summary hiện ra:', await p.$eval('#healthSummary', el => !el.classList.contains('d-none')));

  // Kiểm tra tính đúng của BMI/TDEE thủ công: BMI = 65/1.7^2 = 22.5, nam 22 tuổi vừa vận động, giảm cân
  const bmiText = await p.textContent('#hsBMI');
  const expectedBMI = Math.round((65 / (1.7 * 1.7)) * 10) / 10;
  console.log('[kiểm tra] BMI mong đợi:', expectedBMI, '- BMI hiện:', bmiText, '- khớp:', parseFloat(bmiText) === expectedBMI);

  // Vào lại Thực Đơn Sức Khỏe -> giờ phải có 7 thẻ ngày, mỗi thẻ có 3 hàng món (hoặc ít hơn nếu thiếu)
  await p.goto(BASE + '/user/thuc-don-suc-khoe.html', { waitUntil: 'networkidle' });
  console.log('[thuc-don] planMain hiện:', !(await p.$eval('#planMain', el => el.classList.contains('d-none'))));
  console.log('[thuc-don] số thẻ ngày:', await p.$$eval('.plan-day-card', a => a.length));
  console.log('[thuc-don] BMI trong summary:', await p.textContent('#psBMI'));
  const firstDayFoodBefore = await p.textContent('.plan-day-card .pi-name');
  await p.click('.plan-reroll-btn');
  await p.waitForTimeout(200);
  const firstDayFoodAfter = await p.textContent('.plan-day-card .pi-name');
  console.log('[thuc-don] đổi món: trước=', firstDayFoodBefore.trim(), '| sau=', firstDayFoodAfter.trim(), '| có đổi:', firstDayFoodBefore !== firstDayFoodAfter);

  await p.click('#planRegenBtn');
  await p.waitForTimeout(300);
  console.log('[thuc-don] sau khi tạo thực đơn mới, vẫn còn', await p.$$eval('.plan-day-card', a => a.length), 'thẻ ngày');

  // reload trang -> thực đơn phải giữ nguyên (không xáo lại ngẫu nhiên)
  const savedFirstFood = await p.textContent('.plan-day-card .pi-name');
  await p.reload({ waitUntil: 'networkidle' });
  const reloadedFirstFood = await p.textContent('.plan-day-card .pi-name');
  console.log('[thuc-don] thực đơn giữ nguyên sau reload:', savedFirstFood.trim() === reloadedFirstFood.trim());

  // Ghi nhật ký sức khỏe
  await p.goto(BASE + '/user/nhat-ky-suc-khoe.html', { waitUntil: 'networkidle' });
  console.log('[nhat-ky] logMain hiện:', !(await p.$eval('#logMain', el => el.classList.contains('d-none'))));
  await p.fill('#logWeight', '64.5');
  await p.click('#logForm button[type=submit]');
  await p.waitForTimeout(300);
  console.log('[nhat-ky] sau khi ghi nhận, cân nặng gần nhất:', await p.textContent('#lsWeight'));
  console.log('[nhat-ky] số dòng nhật ký:', await p.$$eval('.log-row', a => a.length));
  console.log('[nhat-ky] có cột trend chart:', await p.$$eval('.trend-bar-wrap', a => a.length));

  // Ghi thêm 1 mốc ngày khác để test delta + trend nhiều điểm
  await p.fill('#logDate', '2026-09-01');
  await p.fill('#logWeight', '66');
  await p.click('#logForm button[type=submit]');
  await p.waitForTimeout(300);
  console.log('[nhat-ky] sau 2 mốc, số dòng nhật ký:', await p.$$eval('.log-row', a => a.length));

  // Quay vòng quay ở goi-y.html (chế độ tiêu chí) -> món phải xuất hiện trong Lịch Sử Món Đã Chọn
  await p.goto(BASE + '/user/goi-y.html', { waitUntil: 'networkidle' });
  await p.click('#spinWheelBtn');
  await p.waitForSelector('#resultModal.show', { timeout: 9000 });
  const spunName = (await p.textContent('#resultName')).trim();
  console.log('[goi-y] quay ra:', spunName);
  await p.click('#resultModal .btn-close');
  await p.waitForTimeout(400);

  await p.goto(BASE + '/user/nhat-ky-suc-khoe.html', { waitUntil: 'networkidle' });
  const historyText = await p.textContent('#foodHistoryList');
  console.log('[nhat-ky] lịch sử món ăn có chứa món vừa quay:', historyText.includes(spunName));

  console.log(errors.length ? errors : 'no errors');
  await browser.close();
})();
