// Chạy test với backend PHP thật: dựng `php -S` với thư mục dữ liệu TẠM (mỗi test một bản sạch, không đụng dữ liệu thật),
// chạy test, rồi tắt server.
//   node tools/tests/run.js                 chạy tất cả
//   node tools/tests/run.js health links    chỉ chạy một số test (tên file, không cần .js)
//   Test giao diện nằm ở tools/tests/, test backend ở backend/tests/ (vd: node tools/tests/run.js backend-api).
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '../..');
const PHP = process.env.PHP_BIN || 'C:/xampp/php/php.exe';
const TEST_DIRS = [__dirname, path.join(ROOT, 'backend/tests')];   // test giao diện (tools/tests) + test backend (backend/tests)
const SKIP = new Set(['lib', 'run', 'recipe-mock', 'run-mysql']);   // tệp hỗ trợ, không phải test
const fileOf = name => { const d = TEST_DIRS.find(dir => fs.existsSync(path.join(dir, name + '.js'))); if (!d) throw new Error('Không thấy test: ' + name); return path.join(d, name + '.js'); };

function waitUp(port) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    (function poll() {
      http.get({ host: '127.0.0.1', port, path: '/backend/api/public/foods.php' }, res => { res.resume(); resolve(); })
        .on('error', () => (Date.now() - t0 > 10000 ? reject(new Error('php -S không khởi động được')) : setTimeout(poll, 150)));
    })();
  });
}

async function runOne(name, port) {
  const storage = fs.mkdtempSync(path.join(os.tmpdir(), 'hnag-test-'));
  const server = spawn(PHP, ['-S', `127.0.0.1:${port}`, '-t', ROOT], { env: { ...process.env, HNAG_STORAGE: 'json', HNAG_STORAGE_DIR: storage }, stdio: 'ignore' });
  try {
    await waitUp(port);
    const r = spawnSync('node', [fileOf(name)], { stdio: 'inherit', env: { ...process.env, BASE_URL: `http://127.0.0.1:${port}/frontend`, API_BASE: `http://127.0.0.1:${port}/backend/api` } });
    return r.status === 0;
  } finally {
    server.kill();
    fs.rmSync(storage, { recursive: true, force: true });
  }
}

(async () => {
  const names = process.argv.length > 2 ? process.argv.slice(2) : TEST_DIRS.flatMap(d => fs.readdirSync(d).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3))).filter(n => !SKIP.has(n) && !n.startsWith('admin-shot'));
  const failed = [];
  let port = 8210;
  for (const n of names) {
    console.log(`\n===== ${n} =====`);
    if (!(await runOne(n, port++))) failed.push(n);
  }
  console.log(failed.length ? `\nLỖI: ${failed.join(', ')}` : `\nTất cả ${names.length} test đạt.`);
  process.exit(failed.length ? 1 : 0);
})();
