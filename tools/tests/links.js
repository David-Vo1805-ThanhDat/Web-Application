// Kiểm thử tự động (Playwright). Chạy từ thư mục gốc dự án: node tools/tests/links.js
// Cần đã build frontend (python tools/build/build.py) và cài playwright (tools/node_modules).
// Rà toàn bộ liên kết nội bộ (href) trên mọi trang: file có tồn tại không, neo (#id) có tồn tại
// trong trang đích không. Bỏ qua link ngoài (http/https), mailto, tel, javascript:void, "#".
const { chromium } = require('playwright');
const { BASE } = require('./lib');
const fs = require('fs');
const path = require('path');
const SITE = require('path').resolve(__dirname, '../../frontend/user').split(require('path').sep).join('/');

const PAGES = fs.readdirSync(SITE).filter(f => f.endsWith('.html'));

function idsInFile(file) {
  const full = path.join(SITE, file);
  if (!fs.existsSync(full)) return null;
  const html = fs.readFileSync(full, 'utf8');
  const ids = new Set();
  const re = /\sid=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(html))) ids.add(m[1]);
  return ids;
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();

  // đăng nhập trước để rà được cả các trang gated
  await p.goto(BASE + '/user/dang-ky.html', { waitUntil: 'networkidle' });
  await p.fill('#regName', 'Audit User');
  await p.fill('#regEmail', 'audituser@test.com');
  await p.fill('#regPassword', '123456');
  await p.fill('#regPassword2', '123456');
  await p.click('#registerForm button[type=submit]');
  await p.waitForTimeout(400);

  let totalBad = 0;
  for (const page of PAGES) {
    await p.goto(BASE + '/user/' + page, { waitUntil: 'networkidle' });
    const hrefs = await p.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    const bad = [];
    for (const href of hrefs) {
      if (!href || href === '#' || /^(https?:|mailto:|tel:|javascript:)/i.test(href)) continue;
      const [filePartRaw, hashPart] = href.split('#');
      const filePart = filePartRaw.split('?')[0]; // bỏ query string, chỉ giữ tên file
      const targetFile = filePart === '' ? page : filePart;
      const ids = idsInFile(targetFile);
      if (ids === null) { bad.push(href + '  -> FILE KHÔNG TỒN TẠI: ' + targetFile); continue; }
      // goi-y.html#nhom không phải id trong HTML: goi-y.js đọc hash này để mở sẵn tab "cả nhóm"
      const jsHash = targetFile === 'goi-y.html' && hashPart === 'nhom';
      if (hashPart && !jsHash && !ids.has(hashPart)) { bad.push(href + '  -> KHÔNG CÓ id="' + hashPart + '" trong ' + targetFile); }
    }
    console.log('[' + page + '] tổng link:', hrefs.length, '| lỗi:', bad.length);
    bad.forEach((b) => console.log('   !!', b));
    totalBad += bad.length;
  }
  console.log('=== TỔNG SỐ LINK LỖI:', totalBad, '===');
  await browser.close();
  process.exit(totalBad ? 1 : 0);
})();
