// Ảnh đại diện người dùng — database tạm hnag_test_* (không đụng hom_nay_an_gi). Chạy từ thư mục gốc:  node backend/tests/user-avatar.js
// Phần API luôn chạy; phần giao diện (Playwright + Chrome) chạy khi có tools/node_modules/playwright.
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '../..');
const PHP = process.env.PHP_BIN || 'C:/xampp/php/php.exe';
const dbName = 'hnag_test_' + Date.now() + '_a' + Math.random().toString(16).slice(2, 8);
const storage = fs.mkdtempSync(path.join(os.tmpdir(), 'hnag-mysql-test-'));
let pass = 0, fail = 0;
const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || x === undefined ? '' : '   ' + x)); };

// ---- Ảnh PNG thật, tự dựng (không cần thư viện ngoài) ----
function crc32(buf) { let c, crc = 0xffffffff; for (const b of buf) { c = (crc ^ b) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xffffffff) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function png(w, h, rgb = [234, 88, 12]) {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: w }, () => rgb).flat())]);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(Array(h).fill(row)))), chunk('IEND', Buffer.alloc(0))]);
}
const dataUrl = (mime, buf) => 'data:' + mime + ';base64,' + buf.toString('base64');

function request(port, method, urlPath, { cookie, json } = {}) {
  return new Promise((resolve, reject) => {
    const data = json ? JSON.stringify(json) : null;
    const req = http.request({ host: '127.0.0.1', port, path: urlPath, method,
      headers: { ...(cookie ? { Cookie: cookie } : {}), ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}) } }, res => {
      let body = ''; res.on('data', c => { body += c; });
      res.on('end', () => {
        const set = (res.headers['set-cookie'] || []).map(c => c.split(';')[0]).find(c => c.startsWith('HNAGSESSID='));
        let parsed = null; try { parsed = JSON.parse(body); } catch {}
        resolve({ status: res.statusCode, cookie: set || cookie, body, json: parsed });
      });
    });
    req.on('error', reject); if (data) req.write(data); req.end();
  });
}

(async () => {
  let server, created = false;
  try {
    const source = spawnSync(PHP, ['-r', "require 'backend/src/bootstrap.php'; echo App\\Core\\App::config('mysql')['dbname'];"], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
    const mk = spawnSync(PHP, ['backend/scripts/mysql_test_database.php', 'create', dbName, source], { cwd: ROOT, encoding: 'utf8' });
    if (mk.status !== 0) throw new Error(mk.stderr); created = true;
    const port = 8800 + Math.floor(Math.random() * 90);
    server = spawn(PHP, ['-S', `127.0.0.1:${port}`, '-t', ROOT], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, DB_DATABASE: dbName, HNAG_STORAGE_DIR: storage } });
    for (let i = 0; i < 100; i++) { try { await request(port, 'GET', '/backend/api/auth/index.php?action=ping'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
    const api = (action, json, cookie) => request(port, 'POST', '/backend/api/user/index.php?action=' + action, { cookie, json });

    console.log('API');
    const reg = await request(port, 'POST', '/backend/api/auth/index.php?action=register', { json: { name: 'Thử Ảnh', email: 'thu.anh@example.com', password: '123456' } });
    const cookie = reg.cookie;
    ok(reg.status === 200 && cookie, 'đăng ký tài khoản thử');
    const good = dataUrl('image/png', png(64, 64));
    let r = await api('profile.update', { avatar: good }, cookie);
    ok(r.status === 200 && r.json.data.avatar === good, 'lưu ảnh PNG hợp lệ', r.body.slice(0, 120));
    const boot = await request(port, 'GET', '/backend/api/auth/bootstrap.php', { cookie });
    const bootUser = JSON.parse((boot.body.match(/window\.APP_USER = (.*);\n/) || [, 'null'])[1]);
    ok(bootUser && bootUser.avatar === good, 'tải trang (bootstrap) trả kèm avatar');
    r = await api('profile.update', { name: 'Tên Mới' }, cookie);
    ok(r.status === 200 && r.json.data.name === 'Tên Mới' && r.json.data.avatar === good, 'đổi tên không làm mất ảnh');
    r = await api('profile.update', { avatar: dataUrl('image/png', Buffer.from('khong phai anh')) }, cookie);
    ok(r.status === 422, 'dữ liệu không phải ảnh → 422', r.status);
    r = await api('profile.update', { avatar: dataUrl('image/jpeg', png(32, 32)) }, cookie);
    ok(r.status === 422, 'ảnh PNG khai là JPEG → 422', r.status);
    r = await api('profile.update', { avatar: dataUrl('image/png', png(1100, 20)) }, cookie);
    ok(r.status === 422, 'ảnh rộng quá 1024px → 422', r.status);
    r = await api('profile.update', { avatar: 'data:image/png;base64,' + 'A'.repeat(220000) }, cookie);
    ok(r.status === 422, 'ảnh quá 150 KB → 422', r.status);
    r = await api('profile.update', { avatar: 'data:image/svg+xml;base64,' + Buffer.from('<svg/>').toString('base64') }, cookie);
    ok(r.status === 422, 'ảnh SVG (có thể chứa mã) → 422', r.status);
    r = await api('profile.update', { avatar: good });
    ok(r.status === 401, 'chưa đăng nhập → 401', r.status);
    const login = await request(port, 'POST', '/backend/api/auth/index.php?action=login', { json: { email: 'admin@homnayangi.vn', password: 'admin123' } });
    const list = await request(port, 'POST', '/backend/api/admin/index.php?action=users.list', { cookie: login.cookie, json: { q: 'thu.anh', pageSize: 5 } });
    const u = list.json && list.json.data.items[0];
    ok(u && u.hasAvatar === true && !('avatar' in u), 'admin thấy "có ảnh" nhưng danh sách không kèm ảnh', JSON.stringify(u || list.body).slice(0, 140));
    r = await api('profile.update', { avatar: null }, cookie);
    ok(r.status === 200 && r.json.data.avatar === null, 'xoá ảnh (avatar: null)');

    let playwright = null;
    try { playwright = require(path.join(ROOT, 'tools/node_modules/playwright')); } catch {}
    if (!playwright) { console.log('(bỏ qua phần giao diện: chưa cài tools/node_modules/playwright)'); return; }
    console.log('Giao diện');
    const imgFile = path.join(storage, 'anh-dai-dien.png');
    fs.writeFileSync(imgFile, png(400, 300, [21, 128, 61]));   // ảnh chữ nhật → trang phải tự cắt vuông
    const b = await playwright.chromium.launch({ channel: 'chrome' });
    try {
      const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
      await ctx.addCookies([{ name: 'HNAGSESSID', value: cookie.split('=')[1], domain: '127.0.0.1', path: '/' }]);
      const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
      const BASE = `http://127.0.0.1:${port}/frontend/user/`;
      await p.goto(BASE + 'tai-khoan.html', { waitUntil: 'networkidle' });
      ok(!(await p.$('#acctAvatar img')) && await p.isHidden('#avatarRemoveBtn'), 'chưa có ảnh: hiện chữ cái đầu, ẩn nút Xoá');
      await p.setInputFiles('#avatarInput', imgFile);
      await p.waitForSelector('#acctAvatar img', { timeout: 10000 });
      ok(await p.$('.nav-user-btn .nav-user-avatar img') && await p.isVisible('#avatarRemoveBtn'), 'chọn ảnh: hiện ở trang Tài khoản + thanh menu');
      const size = await p.$eval('#acctAvatar img', i => [i.naturalWidth, i.naturalHeight]);
      ok(size[0] === 256 && size[1] === 256, 'ảnh tự cắt vuông 256×256', size.join('x'));
      await p.reload({ waitUntil: 'networkidle' });
      ok(await p.$('#acctAvatar img'), 'tải lại trang vẫn còn ảnh (đã lưu trên server)');
      p.once('dialog', d => d.accept());
      await p.click('#avatarRemoveBtn');
      await p.waitForFunction(() => !document.querySelector('#acctAvatar img'), null, { timeout: 10000 });
      ok(!(await p.$('.nav-user-btn .nav-user-avatar img')), 'xoá ảnh: trở lại chữ cái đầu');
      ok(errs.length === 0, 'không lỗi JS', errs.join(' | '));
    } finally { await b.close(); }
  } catch (e) {
    fail++; console.error('  ✗ ' + (e.stack || e));
  } finally {
    if (server) { const ex = new Promise(r => server.once('exit', r)); server.kill(); await ex; }
    if (created) spawnSync(PHP, ['backend/scripts/mysql_test_database.php', 'drop', dbName], { cwd: ROOT });
    fs.rmSync(storage, { recursive: true, force: true });
    console.log(`\n${pass} đạt, ${fail} lỗi`);
    process.exitCode = fail ? 1 : 0;
  }
})();
