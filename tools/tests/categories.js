// Danh mục món ăn ở web người dùng: mặc định, và khi backend phát `allCategories` (admin đổi tên / thêm danh mục).
// Chạy: node tools/tests/run.js categories
const { chromium } = require('playwright');
const { BASE, login } = require('./lib');
let pass = 0, fail = 0;
const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c ? '' : '   ' + (x ?? ''))); };

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await login(ctx, p, 'nguyenvana@gmail.com', '123456');
  const pills = () => p.$$eval('#categoryPills .chip-filter', els => els.map(e => e.textContent.trim()));
  const tiles = () => p.$$eval('#bento .bento-name', els => els.map(e => e.textContent.trim()));

  console.log('Mặc định (backend chưa phát allCategories)');
  await p.goto(BASE + '/user/kham-pha.html', { waitUntil: 'networkidle' });
  let list = await pills(); ok(list.length === 8 && list[0].includes('Tất Cả') && list.some(t => t.includes('Món nước')), 'Khám phá: "Tất cả" + 7 danh mục', JSON.stringify(list));
  await p.goto(BASE + '/user/trang-chu.html', { waitUntil: 'networkidle' });
  list = await tiles(); ok(list.length === 7 && list.includes('Món nước'), 'Trang chủ: 7 ô danh mục', JSON.stringify(list));

  console.log('Backend phát allCategories: đổi tên + thêm danh mục mới');
  await p.route('**/backend/api/public/foods.php', async route => {
    const res = await route.fetch(); let js = await res.text();
    js += `\nallFoods.push(Object.assign({}, allFoods[0], { id: 'banh-ngot-test', name: 'Bánh Ngọt Test', category: 'banh-ngot' }));` +
          `\nconst allCategories = [{slug:'mon-nuoc',label:'Món nước ĐỔI TÊN'},{slug:'com',label:'Cơm'},{slug:'banh-ngot',label:'Bánh ngọt'},{slug:'rong',label:'Danh mục rỗng'}];`;
    await route.fulfill({ response: res, body: js });
  });
  await p.goto(BASE + '/user/kham-pha.html', { waitUntil: 'networkidle' });
  list = await pills();
  ok(list.some(t => t.includes('Món nước ĐỔI TÊN')), 'tên danh mục đổi theo admin', JSON.stringify(list));
  ok(list.some(t => t.includes('Bánh ngọt')), 'danh mục mới hiện ở bộ lọc');
  ok(!list.some(t => t.includes('Danh mục rỗng')), 'danh mục không có món thì ẩn');
  ok(!list.some(t => t.includes('Lẩu')), 'danh mục không còn trong danh sách của backend thì không hiện');
  await p.click('#categoryPills [data-value="banh-ngot"]'); await p.waitForTimeout(400);
  ok((await p.textContent('#foodGrid, #resultsGrid, main')).includes('Bánh Ngọt Test'), 'lọc theo danh mục mới ra đúng món');
  await p.goto(BASE + '/user/kham-pha.html?category=lau-nuong', { waitUntil: 'networkidle' });
  ok(await p.$eval('#categoryPills .chip-filter.active', e => e.dataset.value) === 'all', 'đường dẫn ?category= của danh mục đã bị xoá → về "Tất cả"');
  await p.goto(BASE + '/user/trang-chu.html', { waitUntil: 'networkidle' });
  list = await tiles(); ok(list.length === 3 && list.includes('Bánh ngọt') && list.includes('Món nước ĐỔI TÊN'), 'Trang chủ: ô bento theo danh mục của backend', JSON.stringify(list));
  ok(errs.length === 0, 'không lỗi JS', errs.join(' | '));

  console.log(`\n${pass} đạt, ${fail} lỗi`);
  await b.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
