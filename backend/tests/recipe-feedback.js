// Phản hồi "Nấu thử món này" — 5 API recipe.* + counts/dashboard + giao diện (trang chi tiết món, trang admin Công thức).
// Database tạm hnag_test_* (không đụng hom_nay_an_gi). Chạy từ thư mục gốc:  node backend/tests/recipe-feedback.js
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const PHP = process.env.PHP_BIN || 'C:/xampp/php/php.exe';
const dbName = 'hnag_test_' + Date.now() + '_r' + Math.random().toString(16).slice(2, 8);
const storage = fs.mkdtempSync(path.join(os.tmpdir(), 'hnag-mysql-test-'));
const env = { ...process.env, DB_DATABASE: dbName, HNAG_STORAGE_DIR: storage };
const ADMIN_PASS = 'Recipe#Test2026';
let pass = 0, fail = 0;
const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c || x === undefined ? '' : '   ' + x)); };

function request(port, urlPath, json, cookie) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(json || {});
    const req = http.request({ host: '127.0.0.1', port, path: urlPath, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...(cookie ? { Cookie: cookie } : {}) } }, res => {
      let body = ''; res.on('data', c => { body += c; });
      res.on('end', () => {
        const set = (res.headers['set-cookie'] || []).map(c => c.split(';')[0]).find(c => c.startsWith('HNAGSESSID='));
        let parsed = {}; try { parsed = JSON.parse(body); } catch {}
        resolve({ status: res.statusCode, cookie: set || cookie, data: parsed.data, error: parsed.error, raw: body });
      });
    });
    req.on('error', reject); req.write(data); req.end();
  });
}

(async () => {
  let server, browser, created = false;
  try {
    const source = spawnSync(PHP, ['-r', "require 'backend/src/bootstrap.php'; echo App\\Core\\App::config('mysql')['dbname'];"], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
    const mk = spawnSync(PHP, ['backend/scripts/mysql_test_database.php', 'create', dbName, source], { cwd: ROOT, encoding: 'utf8' });
    if (mk.status !== 0) throw new Error(mk.stderr); created = true;
    // mật khẩu admin trong database tạm: đặt giá trị biết trước (database thật không đổi)
    const reset = spawnSync(PHP, ['-r', `require 'backend/src/bootstrap.php'; $pdo = App\\Storage\\MySqlConnection::open(App\\Core\\App::config('mysql'));
      $pdo->prepare('UPDATE admins SET password_hash = ? WHERE email = ?')->execute([password_hash('${ADMIN_PASS}', PASSWORD_DEFAULT), 'admin@homnayangi.vn']);`], { cwd: ROOT, env, encoding: 'utf8' });
    if (reset.status !== 0) throw new Error(reset.stderr);
    const port = 8600 + Math.floor(Math.random() * 90);
    server = spawn(PHP, ['-S', `127.0.0.1:${port}`, '-t', ROOT], { cwd: ROOT, stdio: 'ignore', env });
    for (let i = 0; i < 100; i++) { try { await request(port, '/backend/api/admin/index.php?action=ping'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
    const api = (svc, action, params, cookie) => request(port, `/backend/api/${svc}/index.php?action=${action}`, params, cookie);
    const reg = async n => (await request(port, '/backend/api/auth/index.php?action=register', { name: 'Người nấu ' + n, email: `nau.thu${n}@example.com`, password: '123456' })).cookie;
    const admin = (await request(port, '/backend/api/auth/index.php?action=login', { email: 'admin@homnayangi.vn', password: ADMIN_PASS })).cookie;
    const foods = (await api('admin', 'foods.list', { pageSize: 500 }, admin)).data.items.filter(f => f.status === 'visible');
    const pho = (await api('admin', 'foods.get', { id: 'pho-bo-ha-noi' }, admin)).data;
    const FOOD = pho.id, N = pho.ingredients.length;
    const base = { foodId: FOOD, portions: 2, ingredients: [{ index: 0, status: 'ok' }], taste: { salty: 'ok', sweet: null, spicy: null }, fit: true, difficulty: 'easy', time: 'same', note: '' };

    console.log('Phân quyền & 404');
    let r = await api('user', 'recipe.mine', { foodId: FOOD }); ok(r.status === 401, 'chưa đăng nhập: recipe.mine → 401', r.status);
    r = await api('user', 'recipe.submit', base); ok(r.status === 401, 'chưa đăng nhập: recipe.submit → 401', r.status);
    r = await api('user', 'recipe.submit', base, admin); ok(r.status === 403, 'tài khoản quản trị gửi phản hồi → 403', r.status);
    const u1 = await reg(1);
    r = await api('admin', 'recipe.quality.list', {}, u1); ok(r.status === 403, 'người dùng thường gọi recipe.quality.list → 403', r.status);
    r = await api('public', 'recipe.stats', { foodId: 'khong-co-mon-nay' }); ok(r.status === 404 && !/không tồn tại/i.test(r.error), 'món không tồn tại → 404 (không bị frontend hiểu là "chưa hỗ trợ")', r.status + ' ' + r.error);
    r = await api('user', 'recipe.mine', { foodId: FOOD }, u1); ok(r.status === 200 && r.data === null, 'chưa phản hồi: recipe.mine → null');

    console.log('Kiểm tra dữ liệu gửi lên (422)');
    const bad = [
      ['portions = 0', { portions: 0 }], ['portions là chuỗi', { portions: '2' }], ['portions = 11', { portions: 11 }],
      ['nguyên liệu ngoài công thức', { ingredients: [{ index: N, status: 'ok' }] }], ['nguyên liệu trùng', { ingredients: [{ index: 0, status: 'ok' }, { index: 0, status: 'less' }] }],
      ['trạng thái nguyên liệu lạ', { ingredients: [{ index: 0, status: 'bad' }] }], ['ghi chú nguyên liệu > 80 ký tự', { ingredients: [{ index: 0, status: 'less', note: 'x'.repeat(81) }] }],
      ['mức vị lạ', { taste: { salty: 'very' } }], ['thiếu fit', { fit: undefined }], ['fit là chuỗi', { fit: 'yes' }],
      ['độ khó lạ', { difficulty: 'pro' }], ['thời gian lạ', { time: 'later' }], ['ghi chú > 300 ký tự', { note: 'x'.repeat(301) }],
    ];
    for (const [name, patch] of bad) {
      r = await api('user', 'recipe.submit', { ...base, ...patch }, u1);
      ok(r.status === 422 && r.error, name + ' → 422', r.status + ' ' + r.error);
    }

    console.log('Gửi và ghi đè');
    r = await api('user', 'recipe.submit', { ...base, note: 'Lần 1' }, u1); ok(r.status === 200 && r.data.ok === true && r.data.updatedAt > 0, 'gửi hợp lệ → { ok, updatedAt }', r.raw);
    r = await api('user', 'recipe.submit', { ...base, portions: 4, fit: false, ingredients: [{ index: 0, status: 'less', note: ' bớt một nửa ' }], note: 'Lần 2' }, u1);
    r = await api('user', 'recipe.mine', { foodId: FOOD }, u1);
    ok(r.data && r.data.portions === 4 && r.data.fit === false && r.data.note === 'Lần 2' && r.data.ingredients[0].note === 'bớt một nửa' && r.data.updatedAt > 0, 'gửi lại → ghi đè (đọc lại đúng dữ liệu mới, ghi chú đã cắt khoảng trắng)', JSON.stringify(r.data));
    r = await api('public', 'recipe.stats', { foodId: FOOD });
    ok(r.data.cooks === 1 && r.data.enough === false && Object.keys(r.data).sort().join() === 'cooks,enough,foodId', 'dưới 5 lượt → chỉ trả { foodId, cooks, enough:false } (server giấu chi tiết)', JSON.stringify(r.data));

    console.log('Đủ 5 lượt → công khai số liệu');
    // u1: giảm nguyên liệu 0, chưa hợp. u2–u6: 3 người "giảm", 2 người "vừa" nguyên liệu 0; tất cả hợp khẩu vị.
    const cooks = [u1];
    for (let n = 2; n <= 6; n++) {
      const c = await reg(n); cooks.push(c);
      r = await api('user', 'recipe.submit', { ...base, ingredients: [{ index: 0, status: n <= 4 ? 'less' : 'ok' }, { index: 1, status: 'ok' }], taste: { salty: n % 2 ? 'high' : 'ok', sweet: null, spicy: 'ok' }, note: n === 2 ? 'Nêm nhạt hơn thì ngon' : '' }, c);
      if (r.status !== 200) ok(false, 'người nấu ' + n + ' gửi được', r.raw);
    }
    r = await api('public', 'recipe.stats', { foodId: FOOD }); const s = r.data;
    ok(s.enough === true && s.cooks === 6 && s.fitRate === 83, 'đủ lượt → enough, cooks = 6, fitRate = 83 (5/6)', JSON.stringify({ e: s.enough, c: s.cooks, f: s.fitRate }));
    const i0 = s.ingredients.find(x => x.index === 0);
    ok(i0 && i0.total === 6 && i0.less === 4 && i0.ok === 2 && i0.more === 0, 'nguyên liệu 0: 6 phản hồi, 4 nên giảm, 2 vừa đủ', JSON.stringify(i0));
    ok(s.taste.salty.high === 2 && s.taste.salty.ok === 4 && s.taste.sweet.low + s.taste.sweet.ok + s.taste.sweet.high === 0 && s.taste.spicy.ok === 5, 'vị: chỉ đếm người có trả lời (bỏ null)', JSON.stringify(s.taste));
    ok(!/Lần 2|Nêm nhạt|bớt một nửa/.test(r.raw) && !('notes' in s), 'ghi chú không bao giờ lộ ra API công khai');

    console.log('Trang quản trị');
    r = await api('admin', 'recipe.quality.list', { pageSize: 100 }, admin); const L = r.data;
    const row = L.items.find(x => x.foodId === FOOD);
    ok(row && row.status === 'review' && row.cooks === 6 && row.fitRate === 83, 'món lệch ≥ 30% → status "review"', JSON.stringify(row));
    ok(row && row.topIssue && row.topIssue.index === 0 && row.topIssue.kind === 'less' && row.topIssue.percent === 67 && row.topIssue.name === pho.ingredients[0].name, 'topIssue = nguyên liệu 0, nên giảm 67%', JSON.stringify(row && row.topIssue));
    ok(L.items[0].foodId === FOOD, 'mặc định: món "review" lên đầu');
    ok(L.total === foods.length && L.items.some(x => x.cooks === 0 && x.status === 'low-data' && x.fitRate === null && x.topIssue === null), 'trả cả món chưa ai nấu (cooks 0, low-data, fitRate null)', L.total + '/' + foods.length);
    ok(L.summary.totalCooks === 6 && L.summary.fitRate === 83 && L.summary.recipesToReview === 1, 'summary: totalCooks 6, fitRate 83, recipesToReview 1', JSON.stringify(L.summary));
    r = await api('admin', 'recipe.quality.list', { status: 'review' }, admin); ok(r.data.total === 1 && r.data.items[0].foodId === FOOD, 'lọc status=review → chỉ món cần xem lại');
    r = await api('admin', 'recipe.quality.list', { q: 'pho bo' }, admin); ok(r.data.items.some(x => x.foodId === FOOD), 'tìm "pho bo" (không dấu) → thấy Phở Bò');
    r = await api('admin', 'recipe.quality.list', { pageSize: 5, page: 2 }, admin); ok(r.data.items.length === 5 && r.data.page === 2 && r.data.pages === Math.ceil(foods.length / 5), 'phân trang chuẩn { items, total, page, pages, pageSize }');
    r = await api('admin', 'recipe.quality.get', { foodId: FOOD }, admin); const D = r.data;
    ok(D.food.name === pho.name && D.cooks === 6 && D.status === 'review' && D.ingredients[0].name === pho.ingredients[0].name && D.ingredients[0].amount === pho.ingredients[0].amount, 'recipe.quality.get: tên + định lượng từng nguyên liệu');
    ok(D.notes.length === 2 && D.notes.some(n => n.text === 'Lần 2; ' + pho.ingredients[0].name + ': bớt một nửa' && n.portions === 4 && n.fit === false), 'ghi chú gộp ghi chú nguyên liệu ("Tên: ghi chú"), mới nhất trước', JSON.stringify(D.notes));
    r = await api('admin', 'recipe.quality.get', { foodId: foods.find(f => f.id !== FOOD).id }, admin); ok(r.data.cooks === 0 && r.data.fitRate === null && r.data.status === 'low-data' && r.data.ingredients.length === 0, 'món chưa ai nấu: cooks 0, fitRate null, low-data');
    r = await api('admin', 'counts', {}, admin); ok(r.data.recipesToReview === 1, 'counts.recipesToReview = 1 (chuông thông báo)', JSON.stringify(r.data));
    r = await api('admin', 'dashboard', {}, admin); ok(r.data.attention.recipesToReview === 1, 'dashboard.attention.recipesToReview = 1');

    console.log('Sửa công thức → hết "review"');
    for (const c of cooks) await api('user', 'recipe.submit', { ...base, ingredients: [{ index: 0, status: 'ok' }] }, c);
    r = await api('admin', 'recipe.quality.list', { status: 'review' }, admin); ok(r.data.total === 0 && r.data.summary.recipesToReview === 0, 'mọi người báo vừa đủ → không còn món cần xem lại');
    r = await api('public', 'recipe.stats', { foodId: FOOD }); ok(r.data.cooks === 6, 'ghi đè không tạo dòng mới (vẫn 6 lượt)');

    console.log('Giới hạn tần suất');
    const spam = await reg(9); let last;
    const others = foods.filter(f => f.id !== FOOD);   // không đụng Phở để số liệu phần giao diện bên dưới rõ ràng
    for (const f of others.slice(0, 21)) last = await api('user', 'recipe.submit', { ...base, foodId: f.id, ingredients: [] }, spam);
    ok(last.status === 429, 'quá 20 món/giờ → 429', last.status);
    r = await api('user', 'recipe.submit', { ...base, foodId: others[0].id, ingredients: [] }, spam); ok(r.status === 200, 'sửa lại phản hồi món đã gửi vẫn được (không tính thêm lượt)', r.status);

    console.log('Giao diện');
    const { chromium } = require(path.join(ROOT, 'tools/node_modules/playwright'));
    browser = await chromium.launch({ channel: 'chrome' });
    const errs = [];
    const page = async cookie => {
      const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
      await ctx.addCookies([{ name: 'HNAGSESSID', value: cookie.split('=')[1], domain: '127.0.0.1', path: '/' }]);
      const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
      p.on('response', res => { if (res.status() >= 400 && /recipe\./.test(res.url())) errs.push(res.status() + ' ' + res.url()); });
      return p;
    };
    const u7 = await reg(7);
    let p = await page(u7);
    await p.goto(`http://127.0.0.1:${port}/frontend/user/chi-tiet-mon-an.html?id=${FOOD}`, { waitUntil: 'networkidle' });
    await p.waitForSelector('#cookSection:not(.d-none)', { timeout: 8000 }).catch(() => {});
    ok(await p.isVisible('#cookSection'), 'trang chi tiết món: khu "Nấu thử món này" hiện ra (trước đây bị ẩn vì backend chưa có)');
    ok(/6 người nấu thử/.test(await p.textContent('#cookSummary')), 'hiện tổng hợp "Đã có 6 người nấu thử · …% hợp khẩu vị"', await p.textContent('#cookSummary'));
    await p.click('[data-cook-open]');
    await p.click('[data-ing-status="0"][data-v="more"]');
    await p.click('[data-fit="1"]');
    await p.fill('#cookNote', 'Thêm hành cho thơm');
    await p.click('[data-cook-send]');
    await p.waitForTimeout(1200);
    r = await api('user', 'recipe.mine', { foodId: FOOD }, u7);
    ok(r.data && r.data.fit === true && r.data.note === 'Thêm hành cho thơm' && r.data.ingredients.some(x => x.index === 0 && x.status === 'more'), 'gửi phản hồi từ giao diện → lưu đúng vào database', JSON.stringify(r.data));
    ok(/7 người nấu thử/.test(await p.textContent('#cookSummary')), 'số người nấu thử cập nhật ngay (7)');
    await (await p.$('#cookSection')).screenshot({ path: path.join(os.tmpdir(), 'recipe-user.png') });

    p = await page(admin);
    await p.goto(`http://127.0.0.1:${port}/frontend/admin/cong-thuc.html`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(600);
    ok(await p.isHidden('#notReady') && await p.isVisible('#recipeBody tr'), 'trang admin Công thức: không còn báo "chưa hỗ trợ", có bảng món');
    ok((await p.textContent('[data-stat=cooks]')).trim() === '27', 'thẻ số liệu: 27 lượt nấu thử (Phở 7 + 20 món của người gửi nhiều)', await p.textContent('[data-stat=cooks]'));
    await p.click(`[data-view="${FOOD}"]`); await p.waitForTimeout(600);
    ok(/Thêm hành cho thơm/.test(await p.textContent('body')), 'mở chi tiết món → thấy ghi chú của người nấu thử');
    await p.screenshot({ path: path.join(os.tmpdir(), 'recipe-admin.png'), fullPage: false });
    ok(errs.length === 0, 'không lỗi JS, không API recipe.* nào lỗi', errs.join(' | '));
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
