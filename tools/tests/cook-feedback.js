// Khu "Nấu thử món này" ở trang chi tiết món (phản hồi từng nguyên liệu). Chạy: node tools/tests/run.js cook-feedback
// Backend chưa có API nên dùng bản giả lập đúng hợp đồng (tools/tests/recipe-mock.js). REAL_API=1: bỏ giả lập, chỉ kiểm tra luồng cơ bản với backend thật.
const { chromium } = require('playwright');
const { BASE, login } = require('./lib');
const { installRecipeMock } = require('./recipe-mock');
let pass = 0, fail = 0;
const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c ? '' : '   ' + (x ?? ''))); };
const URL_PHO = BASE + '/user/chi-tiet-mon-an.html?id=pho-bo-ha-noi';
const REAL = !!process.env.REAL_API;

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const newPage = async (opts = {}, mockOpts) => {
    const ctx = await b.newContext({ viewport: opts.viewport || { width: 1280, height: 900 } });
    const mock = await installRecipeMock(ctx, mockOpts);
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    if (opts.login !== false) await login(ctx, p, 'nguyenvana@gmail.com', '123456');
    return { ctx, p, mock, errs };
  };
  const visible = p => p.evaluate(() => !document.getElementById('cookSection').classList.contains('d-none'));

  if (REAL) {
    console.log('API thật: kiểm tra luồng cơ bản');
    const { p } = await newPage();
    await p.goto(URL_PHO, { waitUntil: 'networkidle' });
    ok(await visible(p), 'khu "Nấu thử" hiện khi backend đã có hành động recipe.*');
    await p.click('[data-cook-open]'); await p.click('[data-fit="1"]'); await p.click('[data-cook-send]');
    await p.waitForSelector('[data-cook-open]', { timeout: 8000 });
    ok((await p.textContent('#cookBody')).includes('Bạn đã gửi phản hồi'), 'gửi xong hiện "Bạn đã gửi phản hồi"');
    console.log(`\n${pass} đạt, ${fail} lỗi`); await b.close(); process.exit(fail ? 1 : 0);
  }

  console.log('Backend chưa có API → khu này tự ẩn');
  let s = await newPage({}, { missing: true });
  await s.p.goto(URL_PHO, { waitUntil: 'networkidle' });
  ok(!(await visible(s.p)), 'khu "Nấu thử" ẩn, trang vẫn dùng bình thường');
  ok(await s.p.isVisible('#detailDescription') && s.errs.length === 0, 'không lỗi JS');
  await s.ctx.close();

  console.log('Chưa đăng nhập: xem số tổng hợp, được mời đăng nhập');
  s = await newPage({ login: false });
  await s.p.goto(BASE + '/user/index.html');   // trang chi tiết yêu cầu có người dùng trong trình duyệt; phiên cũ không có cờ `server` = chưa đăng nhập backend
  await s.p.evaluate(() => localStorage.setItem('hom_nay_an_gi_user', JSON.stringify({ email: 'x@y.com', name: 'X', since: Date.now(), role: 'user' })));
  await s.p.goto(URL_PHO, { waitUntil: 'networkidle' });
  ok((await s.p.textContent('#cookSummary')).includes('34 người nấu thử') && (await s.p.textContent('#cookSummary')).includes('79% hợp khẩu vị'), 'tiêu đề: 34 người nấu thử · 79% hợp khẩu vị', await s.p.textContent('#cookSummary'));
  const rows = await s.p.$$eval('.cook-row', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
  ok(rows.length === 6 && rows[0].includes('Bánh phở tươi') && rows[0].includes('83% thấy vừa đủ'), 'mỗi nguyên liệu có phần trăm "vừa đủ"', rows[0]);
  ok(rows[3].includes('Nhiều người giảm bớt'), 'nguyên liệu bị ≥30% bảo nên giảm → "Nhiều người giảm bớt"', rows[3]);
  ok(rows[4].includes('Nhiều người tăng thêm'), 'nguyên liệu bị ≥30% bảo nên tăng → "Nhiều người tăng thêm"', rows[4]);
  ok(!/%|Nhiều người/.test(rows[5]), 'nguyên liệu mới có 3 phản hồi (<5) thì không hiện phần trăm', rows[5]);
  const chips = await s.p.textContent('.cook-card');
  ok(chips.includes('Nhiều người thấy hơi mặn') && chips.includes('Đa số thấy dễ nấu') && chips.includes('Thường mất lâu hơn'), 'có lời tổng hợp về vị, độ khó, thời gian');
  const href = await s.p.getAttribute('.cook-card a.btn-brand', 'href');
  ok(/dang-nhap\.html\?next=chi-tiet-mon-an\.html/.test(href), 'nút "Đăng nhập để nấu thử" quay lại đúng trang sau khi đăng nhập', href);
  ok(!(await s.p.isVisible('.cook-choice')), 'chưa có ô chọn phản hồi khi chưa đăng nhập');
  await s.ctx.close();

  console.log('Chưa đủ lượt: không lộ số liệu');
  s = await newPage();
  await s.p.goto(BASE + '/user/chi-tiet-mon-an.html?id=bun-bo-hue', { waitUntil: 'networkidle' });
  ok((await s.p.textContent('#cookSummary')).includes('3 người đã nấu thử') && (await s.p.textContent('#cookSummary')).includes('cần thêm'), 'tiêu đề nói cần thêm phản hồi', await s.p.textContent('#cookSummary'));
  ok(!/%|Nhiều người/.test(await s.p.textContent('.cook-list')), 'không hiện phần trăm nào');
  await s.ctx.close();

  console.log('Đã đăng nhập: điền phản hồi và gửi');
  s = await newPage();
  await s.p.goto(URL_PHO, { waitUntil: 'networkidle' });
  ok(await s.p.isVisible('[data-cook-open]'), 'có nút "Tôi đã nấu thử món này"');
  await s.p.click('[data-cook-open]');
  ok((await s.p.$$('.cook-list .cook-seg')).length === 6, 'mỗi nguyên liệu có 3 lựa chọn Vừa đủ / Nên giảm / Nên tăng');
  await s.p.click('[data-ing-status="0"][data-v="ok"]');
  await s.p.click('[data-ing-status="3"][data-v="less"]');
  await s.p.fill('[data-ing-note="3"]', 'thay bằng hành tím');
  await s.p.click('[data-ing-status="4"][data-v="more"]');
  await s.p.click('[data-portions="2"]');
  await s.p.click('[data-taste="salty"][data-v="high"]'); await s.p.click('[data-taste="spicy"][data-v="ok"]');
  await s.p.click('[data-difficulty="easy"]'); await s.p.click('[data-time="slower"]');
  await s.p.fill('#cookNote', 'Nêm nhạt hơn thì ngon');
  await s.p.click('[data-cook-send]');
  ok(!(await s.p.$eval('#cookError', e => e.classList.contains('d-none'))), 'chưa chọn "hợp khẩu vị" thì báo lỗi, chưa gửi');
  ok(s.mock.submissions.length === 0, 'chưa có gì gửi lên máy chủ');
  await s.p.click('[data-fit="1"]');
  await s.p.click('[data-ing-status="0"][data-v="ok"]');   // bấm lại lựa chọn đang chọn → bỏ chọn
  await s.p.click('[data-ing-status="0"][data-v="ok"]');   // chọn lại
  await s.p.click('[data-cook-send]');
  await s.p.waitForSelector('[data-cook-open]', { timeout: 5000 });
  const sent = s.mock.submissions[0];
  ok(sent && sent.foodId === 'pho-bo-ha-noi' && sent.portions === 2 && sent.fit === true && sent.difficulty === 'easy' && sent.time === 'slower', 'dữ liệu gửi: món, số người, hợp khẩu vị, độ khó, thời gian', JSON.stringify(sent));
  ok(sent && JSON.stringify(sent.ingredients) === JSON.stringify([{ index: 0, status: 'ok' }, { index: 3, status: 'less', note: 'thay bằng hành tím' }, { index: 4, status: 'more' }]), 'chỉ gửi nguyên liệu đã chọn; ghi chú chỉ kèm khi giảm/tăng', JSON.stringify(sent && sent.ingredients));
  ok(sent && sent.taste.salty === 'high' && sent.taste.spicy === 'ok' && sent.taste.sweet === null && sent.note === 'Nêm nhạt hơn thì ngon', 'vị: mặn/cay đã chọn, ngọt để trống (null); ghi chú');
  ok((await s.p.textContent('#cookBody')).includes('Bạn đã gửi phản hồi'), 'gửi xong: "Bạn đã gửi phản hồi cho món này"');
  ok((await s.p.textContent('#cookSummary')).includes('35 người nấu thử'), 'số người nấu thử cập nhật (34 → 35)', await s.p.textContent('#cookSummary'));
  ok((await s.p.$$('.cook-choice')).length === 0, 'form đã thu gọn');

  console.log('Sửa lại phản hồi');
  await s.p.click('[data-cook-open]');
  ok(await s.p.getAttribute('[data-ing-status="3"][data-v="less"]', 'aria-checked') === 'true' && await s.p.inputValue('[data-ing-note="3"]') === 'thay bằng hành tím', 'form điền sẵn lựa chọn và ghi chú cũ');
  ok(await s.p.getAttribute('[data-fit="1"]', 'aria-checked') === 'true' && await s.p.getAttribute('[data-portions="2"]', 'aria-checked') === 'true', 'điền sẵn hợp khẩu vị và số người');
  await s.p.click('[data-fit="0"]'); await s.p.click('[data-cook-send]'); await s.p.waitForSelector('[data-cook-open]');
  ok(s.mock.submissions.length === 2 && s.mock.submissions[1].fit === false, 'gửi lại ghi đè (không tăng số người nấu thử)');
  ok((await s.p.textContent('#cookSummary')).includes('35 người nấu thử'), 'vẫn 35 người (mỗi người 1 phản hồi)');
  await s.p.click('[data-cook-open]'); await s.p.click('[data-cook-cancel]');
  ok((await s.p.$$('.cook-choice')).length === 0, '"Để sau" đóng form, không gửi gì thêm');
  ok(s.errs.length === 0, 'không lỗi JS', s.errs.join(' | '));
  await s.ctx.close();

  console.log('Lỗi máy chủ');
  s = await newPage({}, { statsError: true });
  await s.p.goto(URL_PHO, { waitUntil: 'networkidle' });
  ok((await s.p.textContent('#cookBody')).includes('Không tải được phần nấu thử'), 'báo lỗi rõ ràng, có nút Thử lại');
  await s.ctx.close();

  console.log('Điện thoại (390px)');
  s = await newPage({ viewport: { width: 390, height: 844 } });
  await s.p.goto(URL_PHO, { waitUntil: 'networkidle' }); await s.p.click('[data-cook-open]');
  ok(await s.p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'không tràn ngang khi mở form');
  if (process.env.SHOTS) { await s.p.locator('#cookSection').screenshot({ path: process.env.SHOTS + '/cook_mobile.png' }); }
  await s.ctx.close();

  console.log(`\n${pass} đạt, ${fail} lỗi`);
  await b.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
