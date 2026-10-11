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
    const vdir = path.join(__dirname, 'rec-d'); fs.rmSync(vdir, { recursive: true, force: true });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1,
      recordVideo: { dir: vdir, size: { width: 1280, height: 800 } } });
    const t0 = Date.now();
    await ctx.addCookies([{ name: 'HNAGSESSID', value: reg.cookie.split('=')[1], domain: '127.0.0.1', path: '/' }]);
    const p = await ctx.newPage();
    await p.goto(base + 'goi-y.html', { waitUntil: 'networkidle' });
    await p.addStyleTag({ content: '.chatbot-launcher,.music-toggle,.bg-music-btn,[class*="music"]{display:none!important} [data-reveal],[data-aos]{opacity:1!important;transform:none!important}' });
    await p.click('#tabGroup'); await p.waitForTimeout(200);
    while ((await p.$$('#people .person')).length < 4) { await p.click('#addPersonBtn'); await p.waitForTimeout(100); }
    const crew = [['Minh Anh', 'Phở bò'], ['Tuấn', 'Bún chả'], ['Linh', 'Phở bò'], ['Khoa', 'Cơm tấm']];
    const rows = await p.$$('#people .person');
    for (let i = 0; i < 4; i++) { await rows[i].$eval('.person-name', (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, crew[i][0]);
      await rows[i].$eval('.person-dish', (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, crew[i][1]); }
    await p.click('#modeBoxBtn'); await p.waitForTimeout(300);
    await p.evaluate(() => { const el = document.getElementById('boxStage'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 120); });
    await p.waitForTimeout(1200);
    const tShow = (Date.now() - t0) / 1000;
    await p.waitForTimeout(900);
    const tClick = (Date.now() - t0) / 1000;
    await p.click('#boxGrid .box >> nth=0');
    await p.waitForTimeout(3200);
    const result = await p.evaluate(() => (document.getElementById('simpleResultName') || {}).textContent);
    fs.writeFileSync(path.join(__dirname, 'rec-d-times.json'), JSON.stringify({ tShow, tClick, result }));
    await ctx.close();
    console.log('ok', fs.readFileSync(path.join(__dirname, 'rec-d-times.json'), 'utf8'), fs.readdirSync(path.join(__dirname, 'rec-d')).join(','));
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally {
    if (browser) await browser.close(); if (server) server.kill();
    if (created) spawnSync(PHP, ['backend/scripts/mysql_test_database.php', 'drop', dbName], { cwd: ROOT });
    fs.rmSync(storage, { recursive: true, force: true });
  }
})();
