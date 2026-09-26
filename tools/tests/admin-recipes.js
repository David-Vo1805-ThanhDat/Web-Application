// Trang admin "Chất lượng công thức" (cong-thuc.html) + trang "Góp ý liên hệ" sau khi bỏ đánh giá sao.
// Chạy: node tools/tests/run.js admin-recipes. Backend chưa có recipe.quality.* nên dùng bản giả lập đúng hợp đồng (tools/tests/recipe-mock.js);
// REAL_API=1 để bỏ giả lập và chỉ kiểm tra trang tải được với backend thật.
const { chromium } = require('playwright');
const { BASE, loginAdmin } = require('./lib');
const { installAdminRecipeMock } = require('./recipe-mock');
let pass = 0, fail = 0;
const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c ? '' : '   ' + (x ?? ''))); };
const REAL = !!process.env.REAL_API;

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const open = async (mockOpts, viewport) => {
    const ctx = await b.newContext({ viewport: viewport || { width: 1440, height: 900 } });
    const mock = await installAdminRecipeMock(ctx, mockOpts);
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await loginAdmin(ctx, p);
    return { ctx, p, mock, errs };
  };

  console.log('Menu và trang Góp ý liên hệ');
  let s = await open();
  await s.p.goto(BASE + '/admin/danh-gia.html', { waitUntil: 'networkidle' });
  const nav = await s.p.$$eval('.sidebar .nav a', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
  ok(nav.some(t => t.startsWith('Chất lượng công thức')) && nav.some(t => t.startsWith('Góp ý liên hệ')) && !nav.some(t => t.includes('Đánh giá & góp ý')), 'menu có "Chất lượng công thức" và "Góp ý liên hệ" (không còn "Đánh giá & góp ý")', JSON.stringify(nav));
  ok(await s.p.textContent('h1') === 'Góp ý liên hệ' && (await s.p.$$('#tabs')).length === 0, 'trang Góp ý liên hệ không còn tab đánh giá');
  ok((await s.p.$$('.stat-card')).length === 3 && (await s.p.textContent('[data-stat=total]')) === '24' && (await s.p.textContent('[data-stat=new]')) === '8', '3 thẻ số: 24 góp ý, 8 chưa phản hồi, 16 đã phản hồi');
  ok((await s.p.$$('.review-card')).length === 4, 'danh sách góp ý (4 thẻ/trang) vẫn dùng dữ liệu thật của backend');
  await s.p.click('.review-card [data-reply]'); await s.p.waitForSelector('.modal'); await s.p.keyboard.press('Escape');
  ok(true, 'hộp phản hồi góp ý mở được');
  await s.ctx.close();

  if (REAL) {
    console.log('API thật: kiểm tra trang tải được');
    s = await open();
    await s.p.goto(BASE + '/admin/cong-thuc.html', { waitUntil: 'networkidle' }); await s.p.waitForTimeout(600);
    ok(await s.p.isVisible('#recipeBody tr[data-id], #recipeEmpty'), 'bảng hoặc trạng thái trống hiện ra');
    console.log(`\n${pass} đạt, ${fail} lỗi`); await b.close(); process.exit(fail ? 1 : 0);
  }

  console.log('Backend chưa có API → thông báo, không lỗi');
  s = await open({ missing: true });
  await s.p.goto(BASE + '/admin/cong-thuc.html', { waitUntil: 'networkidle' }); await s.p.waitForTimeout(500);
  ok(await s.p.isVisible('#notReady') && (await s.p.textContent('#notReady')).includes('recipe.quality.list'), 'hiện "Backend chưa hỗ trợ tính năng này"');
  ok(!(await s.p.isVisible('#recipesMain')) && await s.p.$eval('#loadError', e => e.hidden), 'không hiện bảng trống hay banner lỗi chung');
  ok(!(await s.p.$('.toast')) && s.errs.filter(e => !/recipe|không tồn tại/i.test(e)).length === 0, 'không có thông báo lỗi khó hiểu');
  await s.ctx.close();

  console.log('Danh sách và bộ lọc');
  s = await open();
  await s.p.goto(BASE + '/admin/cong-thuc.html', { waitUntil: 'networkidle' }); await s.p.waitForSelector('#recipeBody tr[data-id]');
  ok((await s.p.textContent('[data-stat=cooks]')) === '57' && (await s.p.textContent('[data-stat=fit]')) === '76%' && (await s.p.textContent('[data-stat=review]')) === '2', '3 thẻ số: 57 lượt nấu, 76% hợp khẩu vị, 2 công thức cần xem lại');
  const rows = await s.p.$$eval('#recipeBody tr', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
  ok(rows.length === 5 && rows[0].includes('Phở Bò Hà Nội') && rows[0].includes('79%') && rows[0].includes('Nên giảm 43%') && rows[0].includes('Hành tây') && rows[0].includes('Cần xem lại'), 'dòng đầu: món, 79%, "Nên giảm 43%", nguyên liệu, trạng thái', rows[0]);
  ok(rows[2].includes('Nên tăng 38%') && rows[2].includes('55%'), 'món có nguyên liệu cần tăng + hợp khẩu vị thấp', rows[2]);
  ok(rows[4].includes('Lẩu Thái') && rows[4].includes('0') && rows[4].includes('Chưa đủ dữ liệu') && rows[4].includes('—'), 'món chưa ai nấu vẫn có mặt, "—" thay cho phần trăm', rows[4]);
  ok(await s.p.$eval('#recipeBody tr:nth-child(3) .fit', e => e.classList.contains('is-low')), 'thanh hợp khẩu vị <60% màu đỏ');
  await s.p.selectOption('#fStatus', 'review'); await s.p.waitForTimeout(600);
  ok((await s.p.$$('#recipeBody tr[data-id]')).length === 2 && s.mock.calls.some(c => c.params.status === 'review'), 'lọc "Cần xem lại" gửi status=review lên backend, còn 2 món');
  await s.p.fill('#fQ', 'zzzz'); await s.p.waitForSelector('#recipeEmpty:not([hidden])');
  ok(true, 'không có kết quả → trạng thái trống');
  await s.p.click('#emptyClear'); await s.p.waitForSelector('#recipeBody tr[data-id]');
  ok((await s.p.$$('#recipeBody tr[data-id]')).length === 5, '"Xoá bộ lọc" trả lại đủ 5 món');
  ok(s.errs.length === 0, 'không lỗi JS', s.errs.join(' | '));
  await s.ctx.close();

  console.log('Mở từ chuông thông báo (?status=review)');
  s = await open();
  await s.p.goto(BASE + '/admin/cong-thuc.html?status=review', { waitUntil: 'networkidle' }); await s.p.waitForSelector('#recipeBody tr[data-id]');
  ok(await s.p.inputValue('#fStatus') === 'review' && (await s.p.$$('#recipeBody tr[data-id]')).length === 2, 'tự lọc sẵn "Cần xem lại"');
  await s.ctx.close();

  console.log('Chi tiết một món');
  s = await open();
  await s.p.goto(BASE + '/admin/cong-thuc.html', { waitUntil: 'networkidle' }); await s.p.waitForSelector('#recipeBody tr[data-id]');
  await s.p.click('[data-view="pho-bo-ha-noi"]'); await s.p.waitForSelector('.recipe-detail');
  ok(s.mock.calls.some(c => c.action === 'recipe.quality.get' && c.params.foodId === 'pho-bo-ha-noi'), 'gọi recipe.quality.get đúng món');
  const ing = await s.p.$$eval('.ing-row', els => els.map(e => ({ flag: e.classList.contains('is-flag'), text: e.textContent.replace(/\s+/g, ' ') })));
  ok(ing.length === 3 && ing[1].flag && !ing[0].flag && !ing[2].flag, 'chỉ nguyên liệu lệch ≥30% (≥5 phản hồi) được tô nổi bật', JSON.stringify(ing.map(x => x.flag)));
  ok(ing[1].text.includes('13 nên giảm (43%)') && ing[1].text.includes('12 vừa đủ (40%)'), 'số liệu từng nguyên liệu', ing[1].text);
  const widths = await s.p.$$eval('.ing-row:nth-child(2) .ibar i', els => els.map(e => Math.round(parseFloat(e.style.width))));
  ok(JSON.stringify(widths) === '[40,43,17]', 'thanh phân bố: 40% vừa đủ · 43% giảm · 17% tăng', JSON.stringify(widths));
  ok((await s.p.$$('.dist-item')).length === 5 && (await s.p.textContent('.recipe-detail')).includes('Lâu hơn'), 'có phân bố vị, độ khó, thời gian');
  ok((await s.p.$$('.note-item')).length === 2 && (await s.p.textContent('.note-list')).includes('Nêm nhạt hơn thì ngon hơn'), 'có ghi chú của người nấu thử');
  ok((await s.p.getAttribute('.recipe-actions a', 'href')) === 'mon-an-sua.html?id=pho-bo-ha-noi', 'nút "Sửa công thức" sang trang sửa món');
  await s.p.keyboard.press('Escape'); await s.p.waitForSelector('.recipe-detail', { state: 'detached' });
  ok(true, 'đóng hộp chi tiết bằng phím Esc');
  await s.ctx.close();

  console.log('Điện thoại (390px)');
  s = await open({}, { width: 390, height: 844 });
  await s.p.goto(BASE + '/admin/cong-thuc.html', { waitUntil: 'networkidle' }); await s.p.waitForSelector('#recipeBody tr[data-id]');
  ok(await s.p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'trang không tràn ngang');
  await s.p.click('[data-view="pho-bo-ha-noi"]'); await s.p.waitForSelector('.recipe-detail');
  ok(await s.p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'hộp chi tiết không tràn ngang');
  if (process.env.SHOTS) await s.p.screenshot({ path: process.env.SHOTS + '/recipe_detail_m.png' });
  await s.ctx.close();

  console.log(`\n${pass} đạt, ${fail} lỗi`);
  await b.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
