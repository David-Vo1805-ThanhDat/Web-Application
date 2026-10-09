// Runs against this machine's MySQL, in a disposable database. Never mutates hom_nay_an_gi.
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const ROOT = path.resolve(__dirname, '../..');
const PHP = process.env.PHP_BIN || 'C:/xampp/php/php.exe';
const name = 'hnag_test_' + Date.now() + '_' + Math.random().toString(16).slice(2, 10);
const storage = fs.mkdtempSync(path.join(os.tmpdir(), 'hnag-mysql-test-'));
const source = spawnSync(PHP, ['-r', "require 'backend/src/bootstrap.php'; echo App\\Core\\App::config('mysql')['dbname'];"], {cwd:ROOT,encoding:'utf8'});
if (source.status !== 0) throw new Error('Cannot read database configuration');
const env = { ...process.env, DB_DATABASE: name, HNAG_STORAGE_DIR: storage };
let server, created = false;
function php(file, args = []) {
  const result = spawnSync(PHP, [path.join(ROOT, file), ...args], { cwd: ROOT, env, stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Failed: ' + file);
}
async function ready(port) {
  for (let i = 0; i < 100; i++) {
    try {
      const status = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/backend/api/auth/index.php?action=ping`, r => { r.resume(); resolve(r.statusCode); }).on('error', reject);
      });
      if (status === 405) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Test PHP server did not start');
}
(async () => {
  try {
    php('backend/scripts/mysql_test_database.php', ['create', name, source.stdout.trim()]); created = true;
    const baseline = spawnSync(PHP, [path.join(__dirname, 'mysql-baseline.php')], {cwd:ROOT,env,encoding:'utf8'});
    if (baseline.status !== 0) throw new Error(baseline.stderr);
    const port = 8400 + Math.floor(Math.random() * 500);
    server = spawn(PHP, ['-S', `127.0.0.1:${port}`, '-t', ROOT], { cwd: ROOT, env, stdio: 'ignore' });
    await ready(port);
    const result = spawnSync('node', [path.join(__dirname, 'backend-api.js')], { cwd: ROOT,
      env: { ...env, TEST_EXPECTED:baseline.stdout, API_BASE: `http://127.0.0.1:${port}/backend/api` }, stdio: 'inherit' });
    if (result.status !== 0) throw new Error('MySQL API tests failed');
    php('backend/tests/mysql-storage.php');
    const uiTests = process.argv.slice(2);
    for (const test of uiTests) {
      if (!/^[a-z0-9-]+$/.test(test)) throw new Error('Invalid UI test name');
      const file = path.join(ROOT, 'tools/tests', test + '.js');
      const ui = spawnSync('node', [file], {cwd:ROOT,env:{...env,BASE_URL:`http://127.0.0.1:${port}/frontend`},stdio:'inherit'});
      if (ui.status !== 0) throw new Error('UI test failed: ' + test);
    }
  } finally {
    if (server && server.exitCode === null) {
      const exited = new Promise(resolve => server.once('exit', resolve)); server.kill(); await exited;
    }
    if (created) php('backend/scripts/mysql_test_database.php', ['drop', name]);
    if (path.dirname(storage) !== os.tmpdir() || !path.basename(storage).startsWith('hnag-mysql-test-')) throw new Error('Invalid test storage path');
    fs.rmSync(storage, { recursive: true, force: true });
  }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
