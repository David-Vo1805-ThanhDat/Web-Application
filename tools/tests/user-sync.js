// Đồng bộ dữ liệu người dùng với server: lưu ở máy A → đăng nhập máy B thấy đủ → đăng xuất dọn sạch trình duyệt;
// dữ liệu có sẵn ở trình duyệt được chuyển lên tài khoản lần đầu. Chạy: node tools/tests/run.js user-sync
const { chromium } = require('playwright');
const { BASE, API } = require('./lib');
let pass = 0, fail = 0;
const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c ? '' : '   ' + (x ?? ''))); };
const KEYS = { fav: 'hom_nay_an_gi_favorites', profile: 'hom_nay_an_gi_health_profile', log: 'hom_nay_an_gi_health_log' };
const ls = (p, k) => p.evaluate(key => localStorage.getItem(key), k);
const state = async ctx => (await (await ctx.request.post(`${API}/user/index.php?action=state.get`, { data: {} })).json());

async function loginUI(p, email, password, expectUrl = /trang-chu\.html/) {
  await p.goto(BASE + '/user/dang-nhap.html');
  await p.fill('#loginEmail', email); await p.fill('#loginPassword', password);
  await p.click('#loginForm [type=submit]'); await p.waitForURL(expectUrl, { timeout: 15000, waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(300);
}

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const email = `sync${Date.now()}@example.com`;

  console.log('Máy A: đăng ký, lưu dữ liệu');
  const ctxA = await b.newContext(); const A = await ctxA.newPage();
  await A.goto(BASE + '/user/dang-ky.html');
  await A.fill('#regName', 'Sync Test'); await A.fill('#regEmail', email); await A.fill('#regPassword', '123456'); await A.fill('#regPassword2', '123456');
  await A.click('#registerForm [type=submit]'); await A.waitForURL(/trang-chu\.html/, { timeout: 15000, waitUntil: 'domcontentloaded' });
  await A.waitForFunction(() => typeof allFoods !== 'undefined' && allFoods.length > 0);
  ok(JSON.parse(await ls(A, 'hom_nay_an_gi_user')).server === true, 'đăng ký qua backend, đánh dấu tài khoản do server cấp');
  await A.evaluate(() => { toggleFavoriteInStorage('pho-bo-ha-noi'); toggleFavoriteInStorage('bun-bo-hue'); });
  await A.evaluate(() => localStorage.setItem('hom_nay_an_gi_health_profile', JSON.stringify({ heightCm: 170, weightKg: 60 })));
  await A.evaluate(() => localStorage.setItem('hom_nay_an_gi_health_log', JSON.stringify([{ date: '2026-09-26', weightKg: 60 }])));
  await A.waitForTimeout(900);   // chờ đẩy lên server (~0,3 giây)
  let s = (await state(ctxA)).data;
  ok(Array.isArray(s.favorites) && s.favorites.length === 2 && s.healthProfile.heightCm === 170 && s.healthLog.length === 1, 'server đã nhận yêu thích, hồ sơ sức khỏe, nhật ký', JSON.stringify(s));

  console.log('Máy B: đăng nhập cùng tài khoản');
  const ctxB = await b.newContext(); const B = await ctxB.newPage();
  await loginUI(B, email, '123456');
  ok(JSON.parse(await ls(B, KEYS.fav)).length === 2, 'máy B thấy 2 món yêu thích');
  ok(JSON.parse(await ls(B, KEYS.profile)).heightCm === 170, 'máy B thấy hồ sơ sức khỏe');
  await B.goto(BASE + '/user/kham-pha.html?tab=favorites', { waitUntil: 'networkidle' });
  ok((await B.textContent('body')).includes('Phở Bò Hà Nội'), 'trang Khám phá ở máy B hiện đúng món yêu thích');
  await B.evaluate(() => toggleFavoriteInStorage('pho-bo-ha-noi'));    // bỏ 1 món ở máy B
  await B.waitForTimeout(900);
  s = (await state(ctxB)).data; ok(s.favorites.length === 1 && s.favorites[0] === 'bun-bo-hue', 'thay đổi ở máy B lên server');

  console.log('Đăng xuất dọn dữ liệu');
  await B.evaluate(() => logoutUser()); await B.waitForURL(/index\.html/, { timeout: 15000, waitUntil: 'domcontentloaded' });
  ok((await ls(B, KEYS.fav)) === null && (await ls(B, KEYS.profile)) === null && (await ls(B, 'hom_nay_an_gi_user')) === null, 'đăng xuất xoá yêu thích/hồ sơ/đăng nhập khỏi trình duyệt');
  ok((await state(ctxB)).error === 'Bạn chưa đăng nhập', 'phiên PHP cũng đã kết thúc');
  s = (await state(ctxA)).data; ok(s.favorites.length === 1, 'dữ liệu vẫn còn nguyên trên server sau khi B đăng xuất');

  console.log('Đăng xuất ngay sau khi sửa (không mất dữ liệu chưa kịp đẩy)');
  await loginUI(B, email, '123456');
  await B.evaluate(() => { toggleFavoriteInStorage('com-tam-suon-bi-cha'); logoutUser(); });   // bấm rồi thoát ngay, không chờ 0,3 giây
  await B.waitForURL(/index\.html/, { timeout: 15000, waitUntil: 'domcontentloaded' });
  s = (await state(ctxA)).data; ok(s.favorites.includes('com-tam-suon-bi-cha'), 'thay đổi cuối cùng vẫn được lưu trước khi đăng xuất', JSON.stringify(s.favorites));

  console.log('Dữ liệu có sẵn ở trình duyệt được chuyển lên tài khoản mới');
  const email2 = `adopt${Date.now()}@example.com`;
  await ctxA.request.post(`${API}/auth/index.php?action=register`, { data: { name: 'Adopt', email: email2, password: '123456' } });
  await ctxA.request.post(`${API}/auth/index.php?action=logout`, { data: {} });
  const ctxC = await b.newContext(); const C = await ctxC.newPage();
  await C.goto(BASE + '/user/dang-nhap.html');
  await C.evaluate(() => localStorage.setItem('hom_nay_an_gi_favorites', JSON.stringify(['ca-phe-sua-da-sai-gon'])));   // dữ liệu từ thời chưa có backend
  await loginUI(C, email2, '123456');
  await C.waitForTimeout(900);
  ok(JSON.parse(await ls(C, KEYS.fav))[0] === 'ca-phe-sua-da-sai-gon', 'dữ liệu cũ vẫn còn sau đăng nhập');
  s = (await state(ctxC)).data; ok(s.favorites && s.favorites[0] === 'ca-phe-sua-da-sai-gon', 'và đã được chuyển lên server (một lần)', JSON.stringify(s));

  console.log('Admin thấy số liệu thật');
  const adm = await b.newContext();
  await adm.request.post(`${API}/auth/index.php?action=login`, { data: { email: 'admin@homnayangi.vn', password: 'admin123' } });
  const list = await (await adm.request.post(`${API}/admin/index.php?action=users.list`, { data: { q: email } })).json();
  ok(list.data.items[0].favorites === 2 && list.data.items[0].hasHealthProfile === true, 'trang Người dùng của admin có số món yêu thích + hồ sơ sức khỏe thật', JSON.stringify(list.data.items[0]));

  console.log(`\n${pass} đạt, ${fail} lỗi`);
  await b.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
