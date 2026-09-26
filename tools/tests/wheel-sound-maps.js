// Âm thanh vòng quay (giả lập Web Audio để đếm tiếng) + liên kết Google Maps ở kết quả quay và trang chi tiết món.
// Chạy: node tools/tests/run.js wheel-sound-maps
const { chromium } = require('playwright');
const { BASE, login } = require('./lib');
let pass = 0, fail = 0;
const ok = (c, n, x) => { c ? pass++ : fail++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c ? '' : '   ' + (x ?? ''))); };

// AudioContext giả: ghi lại mọi nốt được phát ({ freq, type }) để đếm, không cần có loa
const FAKE_AUDIO = () => {
  window.__notes = [];
  const param = (rec) => ({ setValueAtTime(v) { if (rec) rec.freq = v; }, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, value: 0 });
  class FakeCtx {
    constructor() { this.state = 'running'; this.currentTime = 0; this.sampleRate = 44100; this.destination = {}; }
    get t() { return (this.currentTime = performance.now() / 1000); }
    resume() { return Promise.resolve(); }
    createGain() { return { gain: param(), connect(n) { return n; } }; }
    createOscillator() { const rec = { freq: 0, type: '' }; const o = { frequency: param(rec), connect(n) { return n; }, start() { window.__notes.push(rec); }, stop() {} }; Object.defineProperty(o, 'type', { set(v) { rec.type = v; }, get() { return rec.type; } }); return o; }
    createBuffer() { return { getChannelData: () => new Float32Array(8) }; }
    createBufferSource() { return { connect(n) { return n; }, start() { window.__notes.push({ freq: 0, type: 'noise' }); }, stop() {}, set buffer(v) {} }; }
    createBiquadFilter() { return { frequency: { value: 0 }, connect(n) { return n; } }; }
  }
  Object.defineProperty(FakeCtx.prototype, 'currentTime', { get() { return performance.now() / 1000; }, set() {} });
  window.AudioContext = FakeCtx; window.webkitAudioContext = FakeCtx;
};

async function spinAndWait(p) {
  await p.click('[data-spin]');
  await p.waitForSelector('#resultModal.show', { timeout: 15000 });
  await p.waitForTimeout(400);
}
const ticks = p => p.evaluate(() => window.__notes.filter(n => n.type === 'triangle' && n.freq >= 940 && n.freq <= 1050).length);
const dings = p => p.evaluate(() => window.__notes.filter(n => n.type === 'sine' && (Math.round(n.freq) === 784 || Math.round(n.freq) === 1175)).length);

(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, geolocation: { latitude: 10.776, longitude: 106.7 }, permissions: ['geolocation'] });
  await ctx.addInitScript(FAKE_AUDIO);
  await ctx.route(/https:\/\/www\.google\.com\/maps.*/, r => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>maps</title>' }));
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await login(ctx, p, 'nguyenvana@gmail.com', '123456');
  await p.goto(BASE + '/user/trang-chu.html', { waitUntil: 'networkidle' });

  console.log('Âm thanh khi quay');
  ok(await p.isVisible('.wheel-sound-btn'), 'có nút loa cạnh vòng quay');
  ok(await p.getAttribute('.wheel-sound-btn', 'aria-pressed') === 'true', 'mặc định bật tiếng');
  ok((await ticks(p)) === 0, 'chưa quay thì im lặng');
  await spinAndWait(p);
  const t1 = await ticks(p);
  ok(t1 >= 12, `có tiếng "tách" mỗi khi ô đi qua mũi tên (${t1} tiếng)`, t1);
  ok((await dings(p)) >= 2, 'có tiếng ting-ting khi dừng');

  console.log('Google Maps ở kết quả quay');
  const name = await p.textContent('#resultName');
  const href = await p.getAttribute('#resultMapsLink', 'href');
  ok(href === 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(name), 'link Google Maps tự điền đúng tên món: ' + name, href);
  ok(await p.getAttribute('#resultMapsLink', 'target') === '_blank' && /noopener/.test(await p.getAttribute('#resultMapsLink', 'rel')), 'mở tab mới, có noopener');
  const [popup] = await Promise.all([ctx.waitForEvent('page'), p.click('#resultMapsNear')]);
  await popup.waitForURL(/google\.com\/maps/, { timeout: 8000 });
  ok(popup.url().includes('/maps/search/' + encodeURIComponent(name) + '/@10.776000,106.700000,15z'), 'nút "gần vị trí của tôi" đặt tâm bản đồ tại vị trí người dùng', popup.url());
  await popup.close();

  console.log('Tắt tiếng');
  await p.click('#resultModal .btn-close'); await p.waitForSelector('#resultModal:not(.show)'); await p.waitForTimeout(600);
  await p.click('.wheel-sound-btn');
  ok(await p.getAttribute('.wheel-sound-btn', 'aria-pressed') === 'false' && await p.evaluate(() => localStorage.getItem('hom_nay_an_gi_sound')) === 'off', 'bấm loa → tắt và ghi nhớ');
  const before = await p.evaluate(() => window.__notes.length);
  await spinAndWait(p);
  ok(await p.evaluate(n => window.__notes.length === n, before), 'tắt tiếng thì quay không phát tiếng nào (kể cả pháo giấy)', (await p.evaluate(() => window.__notes.length)) + ' vs ' + before);
  await p.reload({ waitUntil: 'networkidle' });
  ok(await p.getAttribute('.wheel-sound-btn', 'aria-pressed') === 'false', 'tải lại trang vẫn nhớ đang tắt tiếng');

  console.log('Từ chối chia sẻ vị trí → vẫn mở Google Maps thường');
  const ctx2 = await b.newContext({ viewport: { width: 1280, height: 900 } });   // không cấp quyền vị trí
  await ctx2.addInitScript(FAKE_AUDIO);
  await ctx2.addInitScript(() => { navigator.geolocation.getCurrentPosition = (ok, err) => err({ code: 1, message: 'denied' }); });
  await ctx2.route(/https:\/\/www\.google\.com\/maps.*/, r => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>maps</title>' }));
  const p2 = await ctx2.newPage(); await login(ctx2, p2, 'nguyenvana@gmail.com', '123456');
  await p2.goto(BASE + '/user/chi-tiet-mon-an.html?id=pho-bo-ha-noi', { waitUntil: 'networkidle' });
  const [pop2] = await Promise.all([ctx2.waitForEvent('page'), p2.click('#detailMapsNear')]);
  await pop2.waitForURL(/google\.com\/maps/, { timeout: 8000 });
  ok(pop2.url() === 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Phở Bò Hà Nội'), 'bị từ chối vị trí → mở tìm kiếm thường với đúng tên món', pop2.url());
  ok((await p2.textContent('#appToastBody')).includes('Không lấy được vị trí'), 'có thông báo nhẹ nhàng cho người dùng');

  console.log('Trang chi tiết món');
  ok(await p2.getAttribute('#detailMapsLink', 'href') === 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Phở Bò Hà Nội'), 'nút "Tìm thêm quán … trên Google Maps" đúng tên món');
  const firstRestHref = await p2.getAttribute('#restaurantGrid a[href*="maps"]', 'href');
  ok(/query=Ph%E1%BB%9F%20Gia%20Truy%E1%BB%81n%20B%C3%A1t%20%C4%90%C3%A0n%2049%20B%C3%A1t%20%C4%90%C3%A0n/.test(firstRestHref) || firstRestHref.includes(encodeURIComponent('Phở Gia Truyền Bát Đàn')), 'mỗi quán có link "Chỉ đường" (tên + địa chỉ)', firstRestHref);
  ok(errs.length === 0, 'không lỗi JS', errs.join(' | '));

  console.log(`\n${pass} đạt, ${fail} lỗi`);
  await b.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
