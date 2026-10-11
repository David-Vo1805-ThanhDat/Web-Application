// Xuất khung hình từ video.html. node render.js preview  → vài khung xem thử; node render.js → toàn bộ 30 fps vào frames/
const path = require('path'), fs = require('fs');
const { chromium } = require(path.resolve(__dirname, '../node_modules/playwright'));
const FPS = 30;
(async () => {
  const preview = process.argv[2] === 'preview';
  const b = await chromium.launch({ channel: 'chrome' });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///' + path.join(__dirname, 'video.html').replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => new Promise(r => { const v = document.getElementById('clip5'); if (v.readyState >= 2) r(); else v.addEventListener('loadeddata', r); }));
  await p.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))));
  const dur = await p.evaluate(() => window.DURATION);
  const dir = path.join(__dirname, preview ? 'preview' : 'frames');
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
  const times = preview ? [21.4, 22.9, 23.5, 23.85, 24.4, 26.0, 28.8, 30.9, 33.9, 35.0, 35.6, 36.6] : Array.from({ length: Math.round(dur * FPS) }, (_, i) => i / FPS);
  for (let i = 0; i < times.length; i++) {
    await p.evaluate(t => { window.render(t); return window.seekClip(); }, times[i]);
    await p.screenshot({ path: path.join(dir, String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92 });
  }
  console.log(times.length, 'khung', 'lỗi JS:', errs.length, errs.join(' | '));
  await b.close();
})();
