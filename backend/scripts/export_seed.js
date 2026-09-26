// Xuất DỮ LIỆU KHỞI TẠO cho backend: gộp món ăn gốc (backend/data/foods/*.json) rồi chạy các script trong seed/
// (bổ sung trạng thái, thống kê, người dùng, đánh giá, góp ý, nhật ký, cài đặt) và ghi ra backend/data/seed/*.json.
// Backend PHP đọc các file seed này để khởi tạo CSDL lần đầu.
// Chạy từ thư mục gốc dự án:  node backend/scripts/export_seed.js    (sau đó xoá backend/storage để nạp lại)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../..');
const FOODS_DIR = path.join(ROOT, 'backend/data/foods');
const SEED_SCRIPTS = path.join(__dirname, 'seed');
const OUT = path.join(ROOT, 'backend/data/seed');

// ----- Món ăn gốc: mỗi danh mục 1 file JSON, thứ tự hiển thị theo _order.json -----
function loadFoods() {
  const byId = new Map();
  for (const name of fs.readdirSync(FOODS_DIR).sort()) {
    if (!name.endsWith('.json') || name.startsWith('_')) continue;
    for (const food of JSON.parse(fs.readFileSync(path.join(FOODS_DIR, name), 'utf8'))) {
      if (byId.has(food.id)) throw new Error('Trùng id món ăn: ' + food.id);
      byId.set(food.id, food);
    }
  }
  const order = JSON.parse(fs.readFileSync(path.join(FOODS_DIR, '_order.json'), 'utf8'));
  for (const id of [...byId.keys()].sort()) if (!order.includes(id)) order.push(id); // món mới chưa có trong _order xếp cuối
  return order.filter(id => byId.has(id)).map(id => byId.get(id));
}

const ctx = { console, Date, Math, JSON, String, Number, Array, Object, Set };
ctx.window = ctx;
ctx.allFoods = loadFoods();
vm.createContext(ctx);
for (const f of ['seed-foods.js', 'seed-users.js', 'seed-community.js', 'seed-audit.js']) {
  vm.runInContext(fs.readFileSync(path.join(SEED_SCRIPTS, f), 'utf8'), ctx, { filename: f });
}

const S = ctx.Seed;
const foods = S.foods();
const users = S.users();
const data = {
  taxonomy: S.taxonomy,
  foods,
  restaurants: S.restaurants(),
  users,
  reviews: S.reviews(foods, users),
  feedback: S.feedback(users),
  audit: S.audit(),
  settings: S.settings(),
};

fs.mkdirSync(OUT, { recursive: true });
for (const [name, value] of Object.entries(data)) {
  fs.writeFileSync(path.join(OUT, name + '.json'), JSON.stringify(value), 'utf8');
  console.log(name + '.json:', Array.isArray(value) ? value.length + ' dòng' : 'object');
}
