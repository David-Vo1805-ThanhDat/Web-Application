// Trạng thái ĐANG TẢI (khung chờ) và LỖI TẢI (banner + Thử lại) của các trang admin. Chạy: node tools/tests/run.js admin-states
// Ảnh chụp (tuỳ chọn): SHOTS=<thư mục> node tools/tests/run.js admin-states
const { chromium } = require('playwright');
const { BASE, loginAdmin } = require('./lib');
let pass = 0, fail = 0;
const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c ? '' : '   ' + (x ?? ''))); };
const SHOTS = process.env.SHOTS;

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  await loginAdmin(ctx, p);

  console.log('Đang tải: khung chờ hiện trong lúc chờ dữ liệu');
  await p.route('**/backend/api/admin/**', async route => { await new Promise(r => setTimeout(r, 1500)); try { await route.continue(); } catch (e) { /* trang đã đổi */ } });
  await p.goto(BASE + '/admin/mon-an.html', { waitUntil: 'domcontentloaded' });
  ok(await p.evaluate(() => document.body.classList.contains('is-loading')), 'trang mới mở có lớp is-loading');
  ok((await p.$$('#foodsBody .skel-row')).length === 8, 'bảng có 8 dòng khung chờ');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('#foodsSub')).animationName === 'skel-shimmer'), 'dòng phụ đề nhấp nháy (shimmer)');
  if (SHOTS) await p.screenshot({ path: SHOTS + '/state_loading.png' });
  await p.waitForSelector('#foodsBody tr[data-id]', { timeout: 10000 });
  await p.waitForFunction(() => !document.body.classList.contains('is-loading'));
  ok((await p.$$('#foodsBody .skel-row')).length === 0, 'có dữ liệu thì khung chờ biến mất');
  await p.waitForFunction(() => document.querySelector('#foodsSub').textContent.includes('món đang hiển thị'), null, { timeout: 10000 });
  ok(true, 'phụ đề đã có chữ thật');
  await p.unroute('**/backend/api/admin/**');

  console.log('Lỗi tải: banner + Thử lại');
  await p.route('**/backend/api/admin/**', route => route.abort());
  await p.goto(BASE + '/admin/danh-muc.html', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('#loadError:not([hidden])', { timeout: 8000 });
  ok(/Không kết nối được máy chủ/.test(await p.textContent('#loadErrorMsg')), 'banner nêu lý do: không kết nối được máy chủ');
  ok(await p.evaluate(() => document.body.classList.contains('has-load-error') && !document.body.classList.contains('is-loading')), 'ngừng nhấp nháy khi lỗi');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.skel-item')).display === 'none'), 'khung chờ được ẩn khi lỗi');
  if (SHOTS) await p.screenshot({ path: SHOTS + '/state_error.png' });
  await p.unroute('**/backend/api/admin/**');
  await p.click('#loadErrorRetry'); await p.waitForSelector('#catList .cat-row', { timeout: 8000 });
  ok(await p.evaluate(() => document.getElementById('loadError').hidden), 'bấm Thử lại → tải được, banner biến mất');

  console.log('Lỗi khi đang thao tác (không phải lần tải đầu) → chỉ hiện thông báo nhỏ');
  await p.goto(BASE + '/admin/mon-an.html', { waitUntil: 'networkidle' });
  await p.route('**/backend/api/admin/**', route => route.abort());
  await p.fill('#fQ', 'pho'); await p.waitForSelector('.toast', { timeout: 6000 });
  ok(await p.evaluate(() => document.getElementById('loadError').hidden), 'không hiện banner lỗi trang khi lọc thất bại');

  console.log(`\n${pass} đạt, ${fail} lỗi`);
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
