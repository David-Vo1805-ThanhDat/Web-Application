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
const env = { ...process.env, HNAG_STORAGE: 'mysql', DB_DATABASE: name, HNAG_STORAGE_DIR: storage };
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
    php('backend/scripts/mysql_test_database.php', ['create', name]); created = true;
    php('backend/scripts/import_json_to_mysql.php');
    php('backend/scripts/mysql_setup.php', ['--no-backup']);
    const port = 8400 + Math.floor(Math.random() * 500);
    server = spawn(PHP, ['-S', `127.0.0.1:${port}`, '-t', ROOT], { cwd: ROOT, env, stdio: 'ignore' });
    await ready(port);
    const result = spawnSync('node', [path.join(__dirname, 'backend-api.js')], { cwd: ROOT,
      env: { ...env, API_BASE: `http://127.0.0.1:${port}/backend/api` }, stdio: 'inherit' });
    if (result.status !== 0) throw new Error('MySQL API tests failed');
    php('backend/tests/mysql-storage.php');
  } finally {
    if (server && server.exitCode === null) {
      const exited = new Promise(resolve => server.once('exit', resolve)); server.kill(); await exited;
    }
    if (created) php('backend/scripts/mysql_test_database.php', ['drop', name]);
    fs.rmSync(storage, { recursive: true, force: true });
  }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
