// Đăng nhập bằng Google — chạy với Google GIẢ LẬP và database tạm hnag_test_* (không đụng hom_nay_an_gi, không gọi Google thật).
// Chạy từ thư mục gốc:  node backend/tests/google-login.js
const { spawn, spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const PHP = process.env.PHP_BIN || 'C:/xampp/php/php.exe';
const dbName = 'hnag_test_' + Date.now() + '_g' + Math.random().toString(16).slice(2, 8);
const storage = fs.mkdtempSync(path.join(os.tmpdir(), 'hnag-mysql-test-'));
let pass = 0, fail = 0;
const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || x === undefined ? '' : '   ' + x)); };

// ---- Google giả lập: /token đổi code lấy token (kiểm tra PKCE), /userinfo trả hồ sơ theo token ----
const profiles = {};      // code -> hồ sơ Google sẽ trả về
const challenges = {};    // state -> code_challenge (lấy từ địa chỉ chuyển hướng)
let lastTokenRequest = null;
const mock = http.createServer((req, res) => {
  let body = '';
  req.on('data', c => { body += c; });
  req.on('end', () => {
    const send = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
    if (req.url === '/token' && req.method === 'POST') {
      const f = new URLSearchParams(body); lastTokenRequest = f;
      const p = profiles[f.get('code')];
      if (!p || f.get('client_id') !== 'test-client' || f.get('client_secret') !== 'test-secret' || f.get('grant_type') !== 'authorization_code') return send(400, { error: 'invalid_grant' });
      const challenge = crypto.createHash('sha256').update(f.get('code_verifier') || '').digest('base64url');
      if (challenge !== p.expectChallenge) return send(400, { error: 'invalid_grant', error_description: 'PKCE' });
      return send(200, { access_token: 'tok-' + f.get('code'), token_type: 'Bearer', expires_in: 3600 });
    }
    if (req.url === '/userinfo') {
      const code = (req.headers.authorization || '').replace('Bearer tok-', '');
      const p = profiles[code];
      return p ? send(200, p.info) : send(401, { error: 'invalid_token' });
    }
    send(404, {});
  });
});

// ---- HTTP + cookie phiên ----
function request(port, method, urlPath, { cookie, json } = {}) {
  return new Promise((resolve, reject) => {
    const data = json ? JSON.stringify(json) : null;
    const req = http.request({ host: '127.0.0.1', port, path: urlPath, method,
      headers: { ...(cookie ? { Cookie: cookie } : {}), ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}) } }, res => {
      let body = ''; res.on('data', c => { body += c; });
      res.on('end', () => {
        const set = (res.headers['set-cookie'] || []).map(c => c.split(';')[0]).find(c => c.startsWith('HNAGSESSID='));
        resolve({ status: res.statusCode, location: res.headers.location || '', cookie: set || cookie, body });
      });
    });
    req.on('error', reject); if (data) req.write(data); req.end();
  });
}

// Đi trọn luồng: bấm nút → (Google cho phép) → Google gọi về. Trả về { location, cookie }.
async function googleLogin(port, info, { next = 'kham-pha.html', tamperState = false, cancel = false } = {}) {
  const start = await request(port, 'GET', '/backend/api/auth/google.php?next=' + encodeURIComponent(next));
  const auth = new URL(start.location);
  const state = auth.searchParams.get('state');
  const code = 'code-' + Math.random().toString(16).slice(2);
  profiles[code] = { info, expectChallenge: auth.searchParams.get('code_challenge') };
  const q = cancel ? 'error=access_denied&state=' + state : 'code=' + code + '&state=' + (tamperState ? 'gia-mao' : state);
  const back = await request(port, 'GET', '/backend/api/auth/google-callback.php?' + q, { cookie: start.cookie });
  return { start, auth, back };
}
const me = async (port, cookie) => JSON.parse((await request(port, 'POST', '/backend/api/auth/index.php?action=me', { cookie, json: {} })).body);
function sql(query) {   // đọc database tạm
  const r = spawnSync(PHP, ['-r', `require 'backend/src/bootstrap.php'; $c=App\\Core\\App::config('mysql'); $p=new PDO("mysql:host={$c['host']};port={$c['port']};dbname={$c['dbname']};charset=utf8mb4",$c['user'],$c['password']); echo json_encode($p->query($argv[1])->fetchAll(PDO::FETCH_ASSOC), JSON_UNESCAPED_UNICODE);`, query],
    { cwd: ROOT, env: { ...process.env, DB_DATABASE: dbName }, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
  return JSON.parse(r.stdout);
}

(async () => {
  let server, created = false;
  try {
    const source = spawnSync(PHP, ['-r', "require 'backend/src/bootstrap.php'; echo App\\Core\\App::config('mysql')['dbname'];"], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
    const mk = spawnSync(PHP, ['backend/scripts/mysql_test_database.php', 'create', dbName, source], { cwd: ROOT, encoding: 'utf8' });
    if (mk.status !== 0) throw new Error(mk.stderr); created = true;

    await new Promise(r => mock.listen(0, '127.0.0.1', r));
    const g = 'http://127.0.0.1:' + mock.address().port;
    const port = 8900 + Math.floor(Math.random() * 90);
    server = spawn(PHP, ['-S', `127.0.0.1:${port}`, '-t', ROOT], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, DB_DATABASE: dbName, HNAG_STORAGE_DIR: storage,
      GOOGLE_CLIENT_ID: 'test-client', GOOGLE_CLIENT_SECRET: 'test-secret', GOOGLE_REDIRECT_URI: '',
      GOOGLE_AUTH_URL: g + '/auth', GOOGLE_TOKEN_URL: g + '/token', GOOGLE_USERINFO_URL: g + '/userinfo' } });
    for (let i = 0; i < 100; i++) { try { await request(port, 'GET', '/backend/api/auth/index.php?action=ping'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }

    const total = () => +sql('SELECT COUNT(*) n FROM users')[0].n;
    const startCount = total();

    console.log('Bắt đầu đăng nhập');
    const first = await googleLogin(port, { sub: 'g-1001', email: 'Moi.Ban@gmail.com', email_verified: true, name: 'Bạn Mới' });
    ok(first.start.status === 302 && first.auth.origin + first.auth.pathname === g + '/auth', 'nút Google chuyển sang trang Google');
    ok(['client_id', 'redirect_uri', 'state', 'code_challenge'].every(k => first.auth.searchParams.get(k)) && first.auth.searchParams.get('code_challenge_method') === 'S256'
      && first.auth.searchParams.get('scope') === 'openid email profile', 'có đủ client_id, redirect_uri, state, PKCE S256, scope');
    ok(first.auth.searchParams.get('redirect_uri') === `http://127.0.0.1:${port}/backend/api/auth/google-callback.php`, 'redirect_uri tự tính đúng', first.auth.searchParams.get('redirect_uri'));
    ok(lastTokenRequest && lastTokenRequest.get('code_verifier'), 'đổi code lấy token có gửi code_verifier (PKCE)');

    console.log('Người dùng mới');
    ok(first.back.status === 302 && first.back.location === '../../../frontend/user/kham-pha.html', 'đăng nhập xong quay về đúng trang next', first.back.location);
    const m1 = await me(port, first.back.cookie);
    ok(m1.data && m1.data.email === 'moi.ban@gmail.com' && m1.data.role === 'user', 'phiên đăng nhập đúng tài khoản (email viết thường)', JSON.stringify(m1));
    const row = sql("SELECT name, google_id FROM users WHERE email = 'moi.ban@gmail.com'");
    ok(row.length === 1 && row[0].google_id === 'g-1001' && row[0].name === 'Bạn Mới' && total() === startCount + 1, 'tạo 1 tài khoản mới có google_id', JSON.stringify(row));

    console.log('Quay lại lần 2 / gộp tài khoản có sẵn');
    const again = await googleLogin(port, { sub: 'g-1001', email: 'moi.ban@gmail.com', email_verified: true, name: 'Tên Khác' });
    ok(again.back.location.endsWith('/kham-pha.html') && total() === startCount + 1, 'đăng nhập lại không tạo trùng tài khoản');
    const existing = sql("SELECT email FROM users WHERE status = 'active' AND google_id IS NULL LIMIT 1")[0].email;
    const link = await googleLogin(port, { sub: 'g-2002', email: existing, email_verified: true, name: 'X' });
    const linked = sql(`SELECT google_id FROM users WHERE email = '${existing.replace(/'/g, "''")}'`);
    ok(link.back.location.endsWith('/kham-pha.html') && linked[0].google_id === 'g-2002' && total() === startCount + 1, 'email đã có tài khoản → liên kết Google, không tạo mới', existing);
    ok((await me(port, link.back.cookie)).data.email === existing, 'vào đúng tài khoản cũ');

    console.log('Các trường hợp bị từ chối');
    const adm = await googleLogin(port, { sub: 'g-3003', email: 'admin@homnayangi.vn', email_verified: true, name: 'A' });
    ok(adm.back.location.endsWith('dang-nhap.html?google=quan-tri'), 'email quản trị → bắt dùng mật khẩu', adm.back.location);
    const lockedEmail = sql("SELECT email FROM users WHERE status = 'locked' LIMIT 1")[0].email;
    const lk = await googleLogin(port, { sub: 'g-4004', email: lockedEmail, email_verified: true, name: 'L' });
    ok(lk.back.location.endsWith('google=bi-khoa'), 'tài khoản bị khoá → từ chối', lk.back.location);
    const nv = await googleLogin(port, { sub: 'g-5005', email: 'chua@xacminh.com', email_verified: false, name: 'N' });
    ok(nv.back.location.endsWith('google=chua-xac-minh') && total() === startCount + 1, 'email chưa xác minh → từ chối, không tạo tài khoản', nv.back.location);
    const bad = await googleLogin(port, { sub: 'g-6006', email: 'x@y.com', email_verified: true, name: 'S' }, { tamperState: true });
    ok(bad.back.location.endsWith('google=het-han'), 'state giả mạo → từ chối', bad.back.location);
    const cancel = await googleLogin(port, { sub: 'g-7007', email: 'z@y.com', email_verified: true, name: 'C' }, { cancel: true });
    ok(cancel.back.location.endsWith('google=huy'), 'bấm Huỷ ở Google → báo đã huỷ', cancel.back.location);
    const evil = await googleLogin(port, { sub: 'g-1001', email: 'moi.ban@gmail.com', email_verified: true, name: 'B' }, { next: 'https://evil.example/' });
    ok(evil.back.location === '../../../frontend/user/trang-chu.html', 'next lạ (trang ngoài) → về Trang chủ, không chuyển ra ngoài', evil.back.location);

    console.log('Trang quản trị');
    const login = await request(port, 'POST', '/backend/api/auth/index.php?action=login', { json: { email: 'admin@homnayangi.vn', password: 'admin123' } });
    const list = JSON.parse((await request(port, 'POST', '/backend/api/admin/index.php?action=users.list', { cookie: login.cookie, json: { q: 'moi.ban', pageSize: 5 } })).body);
    const u = list.data && list.data.items && list.data.items[0];
    ok(u && u.googleLinked === true && !('googleId' in u) && !('passwordHash' in u), 'admin thấy "đã liên kết Google" nhưng không lộ mã Google', JSON.stringify(u).slice(0, 160));
  } catch (e) {
    fail++; console.error('  ✗ ' + (e.stack || e));
  } finally {
    if (server) { const ex = new Promise(r => server.once('exit', r)); server.kill(); await ex; }
    mock.close();
    if (created) spawnSync(PHP, ['backend/scripts/mysql_test_database.php', 'drop', dbName], { cwd: ROOT });
    fs.rmSync(storage, { recursive: true, force: true });
  }
  console.log(`\n${pass} đạt, ${fail} lỗi`);
  process.exit(fail ? 1 : 0);
})();
