// Chụp giao diện thật (chế độ điện thoại) để dựng video giới thiệu — database tạm hnag_test_*, không đụng dữ liệu thật.
const { spawn, spawnSync } = require('child_process');
const fs = require('fs'), http = require('http'), os = require('os'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const PHP = 'C:/xampp/php/php.exe';
const OUT = path.join(__dirname, 'shots'); fs.mkdirSync(OUT, { recursive: true });
const dbName = 'hnag_test_' + Date.now() + '_v';
const storage = fs.mkdtempSync(path.join(os.tmpdir(), 'hnag-video-'));

function request(port, method, p, json) {
  return new Promise((res, rej) => {
    const data = json ? JSON.stringify(json) : null;
    const r = http.request({ host: '127.0.0.1', port, path: p, method, headers: data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {} }, s => {
      let b = ''; s.on('data', c => b += c); s.on('end', () => res({ cookie: (s.headers['set-cookie'] || []).map(c => c.split(';')[0]).find(c => c.startsWith('HNAGSESSID=')), body: b }));
    }); r.on('error', rej); if (data) r.write(data); r.end();
  });
}

(async () => {
  let server, browser, created = false;
  try {
    const source = spawnSync(PHP, ['-r', "require 'backend/src/bootstrap.php'; echo App\\Core\\App::config('mysql')['dbname'];"], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
    const mk = spawnSync(PHP, ['backend/scripts/mysql_test_database.php', 'create', dbName, source], { cwd: ROOT, encoding: 'utf8' });
    if (mk.status !== 0) throw new Error(mk.stderr); created = true;
    const port = 8900 + Math.floor(Math.random() * 90);
    server = spawn(PHP, ['-S', `127.0.0.1:${port}`, '-t', ROOT], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, DB_DATABASE: dbName, HNAG_STORAGE_DIR: storage } });
    for (let i = 0; i < 100; i++) { try { await request(port, 'GET', '/backend/api/auth/index.php?action=ping'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }
    const reg = await request(port, 'POST', '/backend/api/auth/index.php?action=register', { name: 'Minh Anh', email: 'minh.anh@example.com', password: '123456' });
    const base = `http://127.0.0.1:${port}/frontend/user/`;

    const { chromium } = require(path.join(ROOT, 'tools/node_modules/playwright'));
    browser = await chromium.launch({ channel: 'chrome' });
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.addCookies([{ name: 'HNAGSESSID', value: reg.cookie.split('=')[1], domain: '127.0.0.1', path: '/' }]);
    // tắt nhạc nền + hiệu ứng hiện dần để ảnh chụp rõ
    await ctx.addInitScript(() => { try { localStorage.setItem('hnag-music', 'off'); } catch (e) {} });
    const p = await ctx.newPage();
    const settle = async () => { await p.addStyleTag({ content: '[data-reveal],[data-aos]{opacity:1!important;transform:none!important} .chatbot-launcher,.music-toggle,.bg-music-btn{display:none!important}' }); await p.waitForTimeout(900); };

    await p.goto(base + 'trang-chu.html', { waitUntil: 'networkidle' }); await settle();
    await p.screenshot({ path: path.join(OUT, 'trang-chu.png'), fullPage: true });
    const saveCanvas = async (sel, file) => { const d = await p.$eval(sel, c => c.toDataURL('image/png')); fs.writeFileSync(path.join(OUT, file), Buffer.from(d.split(',')[1], 'base64')); };
    await saveCanvas('#heroWheelCanvas', 'wheel.png');

    await p.goto(base + 'goi-y.html', { waitUntil: 'networkidle' }); await settle();
    await p.screenshot({ path: path.join(OUT, 'goi-y.png'), fullPage: true });
    await p.click('#tabGroup'); await p.waitForTimeout(300);
    while ((await p.$$('#people .person')).length < 4) { await p.click('#addPersonBtn'); await p.waitForTimeout(150); }
    const crew = [['Minh Anh', 'Phở bò'], ['Tuấn', 'Bún chả'], ['Linh', 'Phở bò'], ['Khoa', 'Cơm tấm']];
    const rows = await p.$$('#people .person');
    for (let i = 0; i < 4; i++) { await rows[i].$eval('.person-name', (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, crew[i][0]);
      await rows[i].$eval('.person-dish', (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, crew[i][1]); }
    await p.waitForTimeout(700);
    await p.screenshot({ path: path.join(OUT, 'goi-y-nhom.png'), fullPage: true });
    await saveCanvas('#wheelCanvas', 'wheel-nhom.png');
    await p.evaluate(() => { const el = document.getElementById('panelGroup'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 90); });
    await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(OUT, 'nhom-view.png') });

    const pho = await p.evaluate(() => (allFoods.find(f => /Phở Bò/.test(f.name)) || allFoods[0]));
    fs.writeFileSync(path.join(OUT, 'pho.json'), JSON.stringify({ id: pho.id, name: pho.name, image: pho.image, rating: pho.rating, price: pho.price, calories: pho.calories, cook: pho.cookTimeMinutes }));
    await p.goto(base + 'chi-tiet-mon-an.html?id=' + pho.id, { waitUntil: 'networkidle' }); await settle();
    await p.screenshot({ path: path.join(OUT, 'chi-tiet.png'), fullPage: true });

    await p.goto(base + 'kham-pha.html', { waitUntil: 'networkidle' }); await settle();
    await p.screenshot({ path: path.join(OUT, 'kham-pha.png'), fullPage: true });
    console.log('ok', fs.readdirSync(OUT).join(', '));
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally {
    if (browser) await browser.close(); if (server) server.kill();
    if (created) spawnSync(PHP, ['backend/scripts/mysql_test_database.php', 'drop', dbName], { cwd: ROOT });
    fs.rmSync(storage, { recursive: true, force: true });
  }
})();
