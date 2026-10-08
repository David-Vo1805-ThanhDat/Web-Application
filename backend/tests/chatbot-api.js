// Run: node backend/tests/chatbot-api.js (or node tools/tests/run.js chatbot-api).
// Uses temporary PHP + mock Gemini servers; never calls Google or reads the real API key.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

const ROOT = path.resolve(__dirname, '../..');
const PHP = process.env.PHP_BIN || (process.platform === 'win32' ? 'C:/xampp/php/php.exe' : 'php');
const message = (text, role = 'user') => ({ role, parts: [{ text }] });
const candidate = (text, finishReason) => ({ candidates: [{ content: { parts: [{ text }] }, ...(finishReason && { finishReason }) }] });
const frame = data => `data: ${JSON.stringify(data)}\r\n\r\n`;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let checks = 0;

async function check(name, task) {
  await task();
  checks++;
  console.log(`  PASS ${name}`);
}

function events(raw) {
  return raw.replace(/\r\n/g, '\n').split('\n\n').filter(Boolean).map(block => {
    const lines = block.split('\n');
    const data = lines.filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
    const event = lines.find(line => line.startsWith('event:'))?.slice(6).trim() || 'message';
    return data ? { event, data: JSON.parse(data) } : null;
  }).filter(Boolean);
}

async function freePort() {
  const reservation = net.createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  return port;
}

async function main() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'hnag-chatbot-test-'));
  let php;
  let startupError;
  let upstreamCalls = 0;
  let lastRequest;
  const sockets = new Set();
  const upstream = http.createServer(async (req, res) => {
    upstreamCalls++;
    let raw = '';
    for await (const chunk of req) raw += chunk;
    lastRequest = { url: req.url, headers: req.headers, body: JSON.parse(raw) };
    const mode = req.url.split('/')[1];
    if (['rate', 'unavailable', 'denied'].includes(mode)) {
      res.writeHead({ rate: 429, unavailable: 503, denied: 403 }[mode], { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'PRIVATE_UPSTREAM_DETAIL test-key' } }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    if (mode === 'blocked') {
      res.end(frame({ promptFeedback: { blockReason: 'SAFETY' } }));
    } else if (mode === 'empty') {
      res.end(frame({ candidates: [{ finishReason: 'STOP' }] }));
    } else if (mode === 'malformed') {
      res.end('data: {broken-json}\n\n');
    } else if (mode === 'partial') {
      res.write(frame(candidate('Phở bò')));
      // A clean HTTP close without Gemini's finish marker is still an incomplete answer.
      await delay(25);
      res.end();
    } else if (mode === 'late-error') {
      res.write(frame(candidate('Phở bò')));
      await delay(25);
      res.end(frame({ error: { code: 503, message: 'PRIVATE_UPSTREAM_DETAIL test-key' } }));
    } else {
      // Split inside both an SSE delimiter and a multibyte Vietnamese character.
      const bytes = Buffer.from(`: keepalive\r\n\r\n${frame(candidate('Gợi ý: '))}${frame(candidate('phở bò 🍜', 'STOP'))}`);
      const accent = bytes.indexOf(Buffer.from('ợ'));
      for (const [start, end] of [[0, 14], [14, accent + 1], [accent + 1, accent + 2], [accent + 2, bytes.length - 1], [bytes.length - 1, bytes.length]]) {
        res.write(bytes.subarray(start, end));
        await delay(5);
      }
      res.end();
    }
  });
  upstream.on('connection', socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });

  try {
    upstream.listen(0, '127.0.0.1');
    await once(upstream, 'listening');
    const mockPort = upstream.address().port;
    const phpPort = await freePort();
    const base = `http://127.0.0.1:${phpPort}`;
    const routerPath = path.join(temporary, 'router.php');
    const promptPath = path.join(temporary, 'prompt.txt');
    fs.writeFileSync(promptPath, 'You are FoodBot. Suggest Vietnamese food.');
    const phpString = value => `'${value.replace(/\\/g, '/').replace(/'/g, "\\'")}'`;
    fs.writeFileSync(routerPath, `<?php
if (parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) === '/__test_health') { echo 'ok'; return; }
if (parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) !== '/__test_chat') { return false; }
require ${phpString(path.join(ROOT, 'backend/src/bootstrap.php'))};
$mode = $_GET['mode'] ?? 'split';
$config = [
    'api_key' => $mode === 'missing-key' ? '' : 'test-key',
    'model' => 'gemini-test',
    'prompt_file' => ${phpString(promptPath)},
    'base_url' => 'http://127.0.0.1:${mockPort}/' . $mode . '/v1beta',
    'timeout' => 5,
];
try {
    $controller = new App\\Controllers\\ChatController(new App\\Services\\ChatService($config));
    $controller->stream(json_decode(file_get_contents('php://input'), true));
} catch (App\\Core\\HttpException $e) {
    http_response_code($e->status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Test router: ' . $e->getMessage()]);
}
`);
    php = spawn(PHP, ['-d', `sys_temp_dir=${temporary}`, '-d', `upload_tmp_dir=${temporary}`, '-S', `127.0.0.1:${phpPort}`, '-t', ROOT, routerPath], {
      cwd: ROOT,
      env: { ...process.env, GEMINI_API_KEY: '', API_KEY: '', HNAG_STORAGE_DIR: path.join(temporary, 'storage') },
      stdio: 'ignore',
      windowsHide: true,
    });
    php.on('error', error => { startupError = error; });
    const deadline = Date.now() + 10000;
    for (;;) {
      if (startupError) throw startupError;
      try {
        const health = await fetch(`${base}/__test_health`, { signal: AbortSignal.timeout(500) });
        if (health.ok && await health.text() === 'ok') break;
      } catch {}
      if (Date.now() > deadline || php.exitCode !== null) throw new Error('Temporary PHP server did not start. Check PHP_BIN.');
      await delay(100);
    }

    const call = async (route, body, options = {}) => {
      const response = await fetch(base + route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: typeof body === 'string' ? body : JSON.stringify(body),
        ...options,
        signal: AbortSignal.timeout(10000),
      });
      return { status: response.status, headers: response.headers, raw: await response.text() };
    };
    const endpoint = '/backend/api/chat/index.php';
    console.log('Chatbot HTTP contract');
    const httpCases = [
      ['GET requires POST', undefined, { method: 'GET', body: undefined }, 405],
      ['non-JSON content type', '{}', { headers: { 'Content-Type': 'text/plain' } }, 415],
      ['malformed JSON', '{"history":', {}, 400],
      ['request body limit', ' '.repeat(65537), {}, 413],
    ];
    for (const [name, body, options, status] of httpCases) {
      await check(name, async () => {
        const response = await call(endpoint, body, options);
        assert.equal(response.status, status, response.raw);
        assert.equal(typeof JSON.parse(response.raw).error, 'string');
      });
    }
    const historyCases = [
      ['missing history', {}],
      ['empty history', { history: [] }],
      ['history must be a list', { history: { message: message('Phở') } }],
      ['first message must be user', { history: [message('Phở', 'model')] }],
      ['history must end in user', { history: [message('Phở'), message('Bún', 'model')] }],
      ['roles must alternate', { history: [message('Phở'), message('Bún'), message('Cơm')] }],
      ['reject system role', { history: [message('Phở', 'system')] }],
      ['reject blank message', { history: [message(' \n\t ')] }],
      ['reject non-string message', { history: [message(42)] }],
      ['reject image parts', { history: [{ role: 'user', parts: [{ inlineData: { data: 'x' } }] }] }],
      ['reject multiple parts', { history: [{ role: 'user', parts: [{ text: 'Phở' }, { text: 'Bún' }] }] }],
      ['per-message Unicode limit', { history: [message('ế'.repeat(4001))] }],
      ['history message limit', { history: Array.from({ length: 27 }, (_, i) => message('Phở', i % 2 ? 'model' : 'user')) }],
      ['total conversation limit', { history: Array.from({ length: 7 }, (_, i) => message('a'.repeat(3000), i % 2 ? 'model' : 'user')) }],
    ];
    for (const [name, body] of historyCases) {
      await check(name, async () => {
        const response = await call(endpoint, body);
        assert.equal(response.status, 422, response.raw);
        assert.equal(typeof JSON.parse(response.raw).error, 'string');
      });
    }
    assert.equal(upstreamCalls, 0, 'Invalid requests must not reach Gemini');

    console.log('Chatbot Gemini stream (local mock only)');
    await check('UTF-8 and split SSE frames remain intact', async () => {
      const response = await call('/__test_chat?mode=split', { history: [message('  Gợi ý món ăn  ')] });
      assert.equal(response.status, 200, response.raw);
      assert.match(response.headers.get('content-type'), /^text\/event-stream/);
      const stream = events(response.raw);
      assert.equal(stream.filter(event => event.event === 'message').map(event => event.data.text).join(''), 'Gợi ý: phở bò 🍜');
      assert.equal(stream.at(-1).event, 'done');
      assert.equal(stream.filter(event => event.event === 'done').length, 1);
      assert.equal(stream.some(event => event.event === 'error'), false);
      assert.equal(lastRequest.headers['x-goog-api-key'], 'test-key');
      assert.equal(lastRequest.url, '/split/v1beta/models/gemini-test:streamGenerateContent?alt=sse');
      assert.equal(lastRequest.body.contents[0].parts[0].text, 'Gợi ý món ăn');
      const instruction = lastRequest.body.systemInstruction || lastRequest.body.system_instruction;
      assert.equal(instruction.parts[0].text, fs.readFileSync(promptPath, 'utf8'));
    });
    await check('4000 Unicode characters are accepted', async () => {
      const response = await call('/__test_chat?mode=split', { history: [message('ế'.repeat(4000))] });
      assert.equal(response.status, 200, response.raw);
      assert.equal(events(response.raw).at(-1).event, 'done');
    });
    await check('missing API key returns a configuration error without upstream request', async () => {
      const before = upstreamCalls;
      const response = await call('/__test_chat?mode=missing-key', { history: [message('Phở')] });
      assert.equal(response.status, 503, response.raw);
      assert.equal(typeof JSON.parse(response.raw).error, 'string');
      assert.equal(upstreamCalls, before);
    });
    for (const [mode, status] of [['rate', 429], ['unavailable', 503], ['denied', 503], ['blocked', 422], ['empty', 502], ['malformed', 502]]) {
      await check(`${mode}: error before text uses JSON HTTP ${status}`, async () => {
        const response = await call(`/__test_chat?mode=${mode}`, { history: [message('Phở')] });
        assert.equal(response.status, status, response.raw);
        assert.equal(typeof JSON.parse(response.raw).error, 'string');
        assert.doesNotMatch(response.raw, /PRIVATE_UPSTREAM_DETAIL|test-key/);
      });
    }
    for (const mode of ['partial', 'late-error']) {
      await check(`${mode}: failure after text has an error event and no done`, async () => {
        const response = await call(`/__test_chat?mode=${mode}`, { history: [message('Phở')] });
        assert.equal(response.status, 200, response.raw);
        const stream = events(response.raw);
        assert.equal(stream[0].data.text, 'Phở bò');
        assert.equal(stream.at(-1).event, 'error');
        assert.equal(stream.some(event => event.event === 'done'), false);
        assert.doesNotMatch(response.raw, /PRIVATE_UPSTREAM_DETAIL|test-key/);
      });
    }
    console.log(`\nAll ${checks} chatbot API checks passed.`);
  } finally {
    if (php && php.exitCode === null) {
      const exited = once(php, 'exit');
      php.kill();
      await Promise.race([exited, delay(2000)]);
    }
    for (const socket of sockets) socket.destroy();
    await new Promise(resolve => upstream.close(resolve));
    const resolved = path.resolve(temporary);
    if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('hnag-chatbot-test-')) {
      throw new Error('Refusing to remove a path outside the test temporary directory.');
    }
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
