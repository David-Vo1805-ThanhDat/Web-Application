// Kiểm thử đầu-cuối admin với backend PHP thật (qua http). Chạy server:  C:\xampp\php\php.exe -S 127.0.0.1:8099 -t .
// Chạy qua node backend/tests/run-mysql.js admin-e2e-http để dùng database test riêng.
const { chromium } = require('playwright');
const { BASE } = require('./lib');
let pass = 0, fail = 0;
const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c ? '' : '   ' + (x ?? ''))); };

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const errs = [], apiCalls = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !/401|403|409|422/.test(m.text())) errs.push(m.text()); });
  p.on('request', r => { if (r.url().includes('/backend/api/admin/') && !r.url().includes('ping')) apiCalls.push(new URL(r.url()).searchParams.get('action')); });

  console.log('Chưa đăng nhập');
  await p.goto(BASE + '/admin/dashboard.html'); await p.waitForURL(/dang-nhap\.html/);
  ok(/next=/.test(p.url()), 'admin chưa đăng nhập → về trang đăng nhập kèm next');

  console.log('Đăng nhập sai / đúng');
  await p.fill('#loginEmail', 'admin@homnayangi.vn'); await p.fill('#loginPassword', 'sai-mat-khau'); await p.click('#loginForm [type=submit]');
  await p.waitForSelector('.toast, [class*=toast]', { timeout: 4000 }).catch(() => {});
  ok(/dang-nhap/.test(p.url()), 'sai mật khẩu → vẫn ở trang đăng nhập');
  ok(await p.evaluate(() => localStorage.getItem('hom_nay_an_gi_user')) === null, 'không lưu thông tin đăng nhập khi sai');
  await p.fill('#loginPassword', 'admin123'); await p.click('#loginForm [type=submit]');
  await p.waitForURL(/admin\/dashboard\.html/, { timeout: 15000, waitUntil: 'domcontentloaded' });
  ok(true, 'đăng nhập admin đúng → vào dashboard (theo next)');
  await p.waitForSelector('[data-kpi=foods] [data-kpi-value]:not(:text("—"))', { timeout: 8000 });

  console.log('Dữ liệu từ API thật');
  ok(apiCalls.includes('dashboard') && apiCalls.includes('counts'), 'dashboard gọi API backend: ' + [...new Set(apiCalls)].join(','));
  const kpi = k => p.textContent(`[data-kpi=${k}] [data-kpi-value]`);
  ok((await kpi('foods')) === '29' && (await kpi('users')) === '1.284' && (await kpi('spins')) === '9.412', 'KPI: 29 món, 1.284 người dùng, 9.412 lượt quay', await kpi('foods'));
  ok(await p.textContent('[data-admin-name]') === 'Quản trị viên', 'tên admin lấy từ phiên PHP');

  console.log('Thao tác thật qua giao diện');
  await p.goto(BASE + '/admin/mon-an.html'); await p.waitForSelector('#foodsBody tr');
  ok((await p.$$('#foodsBody tr')).length === 8, 'danh sách món: 8 dòng/trang');
  await p.goto(BASE + '/admin/mon-an-sua.html?new=1'); await p.waitForSelector('#fName');
  await p.click('#publishBtn');
  ok(await p.isVisible('[data-err=name]'), 'form trống → hiện lỗi bắt buộc');
  await p.fill('#fName', 'Bánh Mì Test E2E'); await p.fill('#fDesc', 'Món thử nghiệm'); await p.fill('#fPrice', '25000');
  await p.click('#publishBtn'); await p.waitForURL(/mon-an\.html$/, { timeout: 15000, waitUntil: 'domcontentloaded' });
  await p.fill('#fQ', 'e2e'); await p.waitForTimeout(700);
  ok((await p.textContent('#foodsBody')).includes('Bánh Mì Test E2E'), 'món mới xuất hiện sau khi lưu (đã ghi vào backend)');
  await p.reload(); await p.fill('#fQ', 'e2e'); await p.waitForTimeout(700);
  ok((await p.textContent('#foodsBody')).includes('Bánh Mì Test E2E'), 'tải lại trang vẫn còn (dữ liệu nằm ở server)');
  await p.click('[data-delete]'); await p.click('.modal [data-ok]'); await p.waitForTimeout(800);
  ok(!(await p.textContent('#foodsBody')).includes('Bánh Mì Test E2E'), 'xoá món test');

  console.log('Các trang còn lại tải được dữ liệu');
  for (const pg of ['danh-muc', 'quan-an', 'nguoi-dung', 'danh-gia', 'thong-ke', 'cai-dat', 'nhat-ky']) {
    await p.goto(BASE + '/admin/' + pg + '.html'); await p.waitForLoadState('networkidle'); await p.waitForTimeout(400);
    ok(errs.length === 0, pg + ' không lỗi', errs.splice(0).join(' | '));
  }
  await p.goto(BASE + '/admin/danh-muc.html'); await p.waitForSelector('#tagList .pill');
  ok((await p.$$('#tagList .pill')).length > 50, 'trang danh mục hiện thẻ thật từ dữ liệu dự án');

  console.log('Hết phiên');
  await ctx.clearCookies();
  await p.goto(BASE + '/admin/nguoi-dung.html'); await p.waitForURL(/dang-nhap\.html/, { timeout: 15000, waitUntil: 'domcontentloaded' });
  ok(await p.evaluate(() => localStorage.getItem('hom_nay_an_gi_user')) === null, 'mất phiên → xoá đăng nhập cũ, về trang đăng nhập (không lặp vòng)');

  console.log('Người dùng thường / đăng xuất');
  await p.fill('#loginEmail', 'nguyenvana@gmail.com'); await p.fill('#loginPassword', '123456'); await p.click('#loginForm [type=submit]');
  await p.waitForURL(/trang-chu\.html/, { timeout: 20000, waitUntil: 'domcontentloaded' });   // không chờ "load": trang tải thư viện từ CDN có thể chậm
  ok(true, 'người dùng thường đăng nhập → trang chủ');
  await p.goto(BASE + '/admin/dashboard.html'); await p.waitForTimeout(800);
  ok(!/admin\/dashboard/.test(p.url()), 'người dùng thường không vào được admin');

  console.log(`\n${pass} đạt, ${fail} lỗi`);
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
