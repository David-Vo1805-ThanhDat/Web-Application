// Hộp thoại "Góp ý & liên hệ" (frontend/user/js/widgets/feedback.js) — database tạm hnag_test_* (không đụng hom_nay_an_gi).
// Chạy từ thư mục gốc:  node backend/tests/feedback-modal.js   (cần tools/node_modules/playwright + Chrome)
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const PHP = process.env.PHP_BIN || 'C:/xampp/php/php.exe';
const dbName = 'hnag_test_' + Date.now() + '_f' + Math.random().toString(16).slice(2, 8);
const storage = fs.mkdtempSync(path.join(os.tmpdir(), 'hnag-mysql-test-'));
let pass = 0, fail = 0;
const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || x === undefined ? '' : '   ' + x)); };

function request(port, method, urlPath, { json } = {}) {
  return new Promise((resolve, reject) => {
    const data = json ? JSON.stringify(json) : null;
    const req = http.request({ host: '127.0.0.1', port, path: urlPath, method,
      headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {} }, res => {
      let body = ''; res.on('data', c => { body += c; });
      res.on('end', () => {
        const set = (res.headers['set-cookie'] || []).map(c => c.split(';')[0]).find(c => c.startsWith('HNAGSESSID='));
        resolve({ status: res.statusCode, cookie: set, body });
      });
    });
    req.on('error', reject); if (data) req.write(data); req.end();
  });
}

function feedbackRows() {
  const r = spawnSync(PHP, ['-r', "require 'backend/src/bootstrap.php'; echo json_encode((new App\\Repositories\\FeedbackRepository())->all());"],
    { cwd: ROOT, encoding: 'utf8', env: { ...process.env, DB_DATABASE: dbName, HNAG_STORAGE_DIR: storage } });
  return JSON.parse(r.stdout || '[]');
}

(async () => {
  let server, browser, created = false;
  try {
    const source = spawnSync(PHP, ['-r', "require 'backend/src/bootstrap.php'; echo App\\Core\\App::config('mysql')['dbname'];"], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
    const mk = spawnSync(PHP, ['backend/scripts/mysql_test_database.php', 'create', dbName, source], { cwd: ROOT, encoding: 'utf8' });
    if (mk.status !== 0) throw new Error(mk.stderr); created = true;
    const port = 8800 + Math.floor(Math.random() * 90);
    server = spawn(PHP, ['-S', `127.0.0.1:${port}`, '-t', ROOT], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, DB_DATABASE: dbName, HNAG_STORAGE_DIR: storage } });
    for (let i = 0; i < 100; i++) { try { await request(port, 'GET', '/backend/api/auth/index.php?action=ping'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
    const base = `http://127.0.0.1:${port}/frontend/user/`;
    const before = feedbackRows().length;

    const { chromium } = require(path.join(ROOT, 'tools/node_modules/playwright'));
    browser = await chromium.launch({ channel: 'chrome' });

    console.log('Khách chưa đăng nhập (trang giới thiệu)');
    let p = await (await browser.newContext({ viewport: { width: 1366, height: 800 } })).newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(base + 'index.html', { waitUntil: 'networkidle' });
    const navLinks = await p.$$eval('.site-navbar .navbar-nav .nav-link', a => a.map(x => x.textContent.trim()));
    ok(navLinks.length === 0, 'menu khách không còn mục Trang Chủ / Giới Thiệu / Liên Hệ', JSON.stringify(navLinks));
    ok(!(await p.$('#lien-he')) && !(await p.$('#contactForm')), 'đã bỏ khối form Liên Hệ ở trang giới thiệu');
    await p.click('footer [data-open-feedback]');
    await p.waitForSelector('#feedbackModal.show');
    ok(await p.isVisible('#feedbackModal a[href="dang-nhap.html"]') && !(await p.$('#fbForm')), 'khách bấm "Góp ý & liên hệ" ở chân trang: thấy email/fanpage + nút đăng nhập, không có form');
    await p.screenshot({ path: path.join(os.tmpdir(), 'feedback-guest.png') });
    await p.context().close();

    console.log('Đã đăng nhập');
    const reg = await request(port, 'POST', '/backend/api/auth/index.php?action=register', { json: { name: 'Thử Góp Ý', email: 'thu.gopy@example.com', password: '123456' } });
    ok(reg.status === 200 && reg.cookie, 'đăng ký tài khoản thử');
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
    await ctx.addCookies([{ name: 'HNAGSESSID', value: reg.cookie.split('=')[1], domain: '127.0.0.1', path: '/' }]);
    p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.goto(base + 'kham-pha.html', { waitUntil: 'networkidle' });
    await p.click('.nav-user-btn');
    await p.click('.dropdown-menu [data-open-feedback]');
    await p.waitForSelector('#feedbackModal.show');
    ok(/Thử Góp Ý/.test(await p.textContent('.fb-sender')) && /thu\.gopy@example\.com/.test(await p.textContent('.fb-sender')), 'menu tài khoản mở hộp thoại, hiện sẵn tên + email tài khoản');
    ok(!(await p.$('#feedbackModal input[type=email]')), 'không bắt nhập lại tên/email');
    await p.click('#fbSubmit');
    ok(await p.isVisible('#fbError'), 'nội dung trống → báo lỗi, không gửi');
    await p.selectOption('#fbSubject', 'de-xuat-mon');
    ok(await p.isVisible('#fbDish'), 'chọn "Đề xuất món ăn mới" → hiện ô tên món');
    await p.fill('#fbDish', 'Bánh căn Phan Rang');
    await p.fill('#fbMessage', 'Nhóm thêm món này giúp mình nha!');
    await p.screenshot({ path: path.join(os.tmpdir(), 'feedback-user.png') });
    await p.click('#fbSubmit');
    await p.waitForSelector('#feedbackModal', { state: 'hidden' });
    await p.waitForTimeout(300);
    ok(/Cảm ơn/.test(await p.textContent('#appToastBody')), 'gửi xong: đóng hộp thoại + báo cảm ơn');
    const rows = feedbackRows();
    const last = rows[rows.length - 1] || {};
    ok(rows.length === before + 1 && last.email === 'thu.gopy@example.com' && last.name === 'Thử Góp Ý' && last.subject === 'de-xuat-mon'
      && /Món đề xuất: Bánh căn Phan Rang/.test(last.message), 'lưu vào bảng feedback với tên/email của tài khoản', JSON.stringify(last));
    ok(errs.length === 0, 'không lỗi JS', errs.join(' | '));
  } catch (e) {
    fail++; console.error(e);
  } finally {
    if (browser) await browser.close();
    if (server) server.kill();
    if (created) spawnSync(PHP, ['backend/scripts/mysql_test_database.php', 'drop', dbName], { cwd: ROOT });
    fs.rmSync(storage, { recursive: true, force: true });
    console.log(`\n${pass} đạt, ${fail} lỗi`);
    process.exit(fail ? 1 : 0);
  }
})();
