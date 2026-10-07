// Kiểm thử API backend PHP (đăng nhập, phân quyền, CRUD, xác thực dữ liệu, số liệu khớp dữ liệu dự án).
// Chạy server:  C:\xampp\php\php.exe -S 127.0.0.1:8099 -t .   (từ thư mục gốc dự án) rồi:  node tools/tests/backend-api.js
const BASE = process.env.API_BASE || 'http://127.0.0.1:8099/backend/api';
const expected = JSON.parse(process.env.TEST_EXPECTED || '{}');
let pass = 0, fail = 0;
const ok = (cond, name, extra) => { cond ? pass++ : fail++; console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond ? '' : '   ' + (extra ?? ''))); };

function client() {
  let cookie = '';
  return async (svc, action, params = {}) => {
    const r = await fetch(`${BASE}/${svc}/index.php?action=${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(params) });
    const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
    const body = await r.json();
    return { status: r.status, data: body.data, error: body.error };
  };
}

(async () => {
  const anon = client(), admin = client(), user = client();

  console.log('Phân quyền');
  let r = await anon('admin', 'counts'); ok(r.status === 401, 'chưa đăng nhập → 401', r.status);
  r = await anon('admin', 'ping'); ok(r.status === 200, 'ping không cần đăng nhập');
  r = await anon('admin', 'khong-ton-tai'); ok(r.status === 404, 'hành động lạ → 404');
  r = await admin('auth', 'login', { email: 'admin@homnayangi.vn', password: 'sai' }); ok(r.status === 401, 'sai mật khẩu → 401');
  r = await user('auth', 'login', { email: 'nguyenvana@gmail.com', password: '123456' }); ok(r.status === 200 && r.data.role === 'user', 'người dùng thường đăng nhập được');
  r = await user('admin', 'counts'); ok(r.status === 403, 'người dùng thường vào API admin → 403', r.status);
  r = await user('auth', 'login', { email: 'huy.do.qn@gmail.com', password: '123456' }); ok(r.status === 403, 'tài khoản bị khoá không đăng nhập được', r.status);
  r = await admin('auth', 'login', { email: 'admin@homnayangi.vn', password: 'admin123' }); ok(r.status === 200 && r.data.role === 'admin', 'admin đăng nhập');
  r = await admin('admin', 'me'); ok(r.data.email === 'admin@homnayangi.vn', 'me trả đúng tài khoản');

  console.log('Số liệu khớp dữ liệu dự án');
  r = await admin('admin', 'counts'); ok(r.data.foods === expected.foods && r.data.restaurants === expected.restaurants && r.data.pending === expected.pending && r.data.feedbackNew === expected.feedbackNew, 'counts khớp database', JSON.stringify(r.data));
  r = await admin('admin', 'users.stats'); ok(r.data.total === expected.users && r.data.hasHealth === expected.hasHealth && r.data.locked === expected.locked && r.data.activeToday >= 1 && r.data.activeToday <= r.data.total, 'users.stats tổng/hồ sơ/khóa và người dùng vừa đăng nhập hoạt động hôm nay', JSON.stringify(r.data));
  ok(r.data.new30 >= 0 && r.data.new30 <= r.data.total, 'người dùng mới 30 ngày tính từ database: ' + r.data.new30);
  r = await admin('admin', 'foods.list', { pageSize: 100 }); ok(r.data.total === expected.foods && r.data.all === expected.foods, 'foods.list khớp số món trong database');
  ok(r.data.items[0].id === 'pho-bo-ha-noi' && !('passwordHash' in r.data.items[0]), 'thứ tự mặc định, phở bò đầu tiên');
  r = await admin('admin', 'foods.list', { status: 'visible', pageSize: 100 }); ok(r.data.total === expected.visible, 'số món hiển thị khớp database', r.data.total);
  r = await admin('admin', 'foods.list', { q: 'pho bo', pageSize: 100 }); ok(r.data.total >= 1 && r.data.items[0].name.includes('Phở'), 'tìm không dấu "pho bo"');
  r = await admin('admin', 'taxonomy.get'); ok(r.data.CATEGORIES[0].count === expected.firstCategoryCount && r.data.TASTES.find(t => t.slug === 'dam-da').count === expected.damDa, 'thống kê danh mục và khẩu vị khớp database');
  ok(r.data.TAGS.length > 50 && r.data.TAGS[0].count >= 1, 'thẻ lấy từ dữ liệu thật: ' + r.data.TAGS.length);
  r = await admin('admin', 'restaurants.stats'); ok(r.data.total === expected.restaurants && r.data.cities.length === expected.cities && r.data.foodsWithoutRestaurant === expected.withoutRestaurant, 'thống kê quán khớp database', JSON.stringify(r.data));
  r = await admin('admin', 'reviews.stats'); ok(r.data.total === expected.reviewCount && Math.abs(r.data.avg - expected.rating) < 0.001, 'thống kê đánh giá khớp database', JSON.stringify(r.data));
  r = await admin('admin', 'dashboard', { range: '30' }); ok(r.data.kpis.foods.value === expected.visible && r.data.kpis.spins.value === expected.spins && r.data.categories.length === expected.categories, 'dashboard khớp số liệu database', JSON.stringify(r.data.kpis));
  r = await admin('admin', 'stats', { range: '30' }); ok(r.data.byMeal.reduce((s, x) => s + x.value, 0) > 9000 && r.data.performance.length === 8, 'thống kê: theo bữa + 8 món hiệu suất');

  console.log('Món ăn: thêm / sửa / xác thực / xoá');
  r = await admin('admin', 'foods.save', { food: { name: '', description: 'x', price: 1000, category: 'com', region: 'Nam' } }); ok(r.status === 422, 'thiếu tên → 422');
  r = await admin('admin', 'foods.save', { food: { name: 'Món Test', description: 'x', price: 0, category: 'com', region: 'Nam' } }); ok(r.status === 422, 'giá 0 → 422');
  r = await admin('admin', 'foods.save', { food: { name: 'Món Test', description: 'x', price: 1000, category: 'khong-co', region: 'Nam' } }); ok(r.status === 422, 'danh mục không tồn tại → 422');
  r = await admin('admin', 'foods.save', { food: { name: 'Món Test Đặc Biệt', description: 'Mô tả', price: 45000, category: 'com', region: 'Nam', mealType: ['trua', 'bay'], tags: ['Thẻ Test'], ingredients: [{ name: 'Gạo', amount: '1 chén' }, { name: ' ', amount: '' }], instructions: ['Nấu', ''], status: 'visible' }, restaurants: [{ name: 'Quán Test', address: '1 Test', city: 'TP.HCM', priceText: '30.000đ - 50.000đ' }] });
  ok(r.status === 200 && r.data.id === 'mon-test-dac-biet' && r.data.no === expected.foods + 1, 'thêm món mới, id slug', JSON.stringify(r.data).slice(0, 120));
  ok(JSON.stringify(r.data.mealType) === '["trua"]' && r.data.ingredients.length === 1 && r.data.instructions.length === 1, 'lọc giá trị không hợp lệ (bữa lạ, nguyên liệu trống)');
  const id = r.data.id;
  r = await admin('admin', 'foods.get', { id }); ok(r.data.restaurants.length === 1 && r.data.restaurants[0].priceMin === 30000, 'quán gợi ý được lưu kèm món');
  r = await admin('admin', 'foods.save', { food: { ...r.data, name: 'Món Test Sửa', restaurants: undefined }, restaurants: [] }); ok(r.data.name === 'Món Test Sửa' && r.data.no === expected.foods + 1, 'sửa món giữ số thứ tự');
  r = await admin('admin', 'foods.get', { id }); ok(r.data.restaurants.length === 0, 'danh sách quán được thay bằng rỗng');
  r = await admin('admin', 'foods.bulk', { ids: [id], action: 'hide' }); ok(r.data.count === 1, 'ẩn hàng loạt');
  r = await admin('admin', 'foods.remove', { id: 'bun-bo-hue' }); ok(r.status === 409, 'món nhiều yêu thích không xoá được → 409', r.error);
  r = await admin('admin', 'foods.remove', { id }); ok(r.status === 200, 'xoá món test');
  r = await admin('admin', 'foods.get', { id }); ok(r.status === 404, 'món đã xoá → 404');

  console.log('Danh mục & thẻ');
  r = await admin('admin', 'taxonomy.save', { type: 'TAGS', item: { label: 'Thẻ Mới' } }); ok(r.status === 200, 'thêm thẻ');
  r = await admin('admin', 'taxonomy.save', { type: 'TAGS', item: { label: 'Thẻ Mới' } }); ok(r.status === 409, 'thẻ trùng → 409');
  r = await admin('admin', 'taxonomy.save', { type: 'TAGS', item: { label: 'Thẻ Đổi Tên' }, original: 'Thẻ Mới' }); ok(r.status === 200, 'đổi tên thẻ');
  r = await admin('admin', 'taxonomy.remove', { type: 'TAGS', slug: 'Thẻ Đổi Tên' }); ok(r.status === 200, 'xoá thẻ chưa dùng');
  r = await admin('admin', 'taxonomy.save', { type: 'CATEGORIES', item: { label: 'Danh Mục Test', tone: 'rose', icon: 'fire' } }); ok(r.status === 200, 'thêm danh mục');
  r = await admin('admin', 'taxonomy.remove', { type: 'CATEGORIES', slug: 'com' }); ok(r.status === 409, 'danh mục đang dùng không xoá được → 409', r.error);
  r = await admin('admin', 'taxonomy.remove', { type: 'CATEGORIES', slug: 'danh-muc-test' }); ok(r.status === 200, 'xoá danh mục mới');

  console.log('Quán ăn');
  r = await admin('admin', 'restaurants.save', { restaurant: { name: 'Quán A', foodId: 'khong-co', address: 'x', city: 'y' } }); ok(r.status === 422, 'món liên kết không tồn tại → 422');
  r = await admin('admin', 'restaurants.save', { restaurant: { name: 'Quán A', foodId: 'pho-bo-ha-noi', address: '1 A', city: 'Hà Nội / Huế', priceText: '10.000đ - 20.000đ' } }); ok(r.status === 200 && r.data.priceMax === 20000, 'thêm quán');
  const rid = r.data.id;
  r = await admin('admin', 'restaurants.list', { city: 'Huế', pageSize: 100 }); ok(r.data.items.some(x => x.id === rid), 'lọc thành phố tách "Hà Nội / Huế"');
  r = await admin('admin', 'restaurants.remove', { id: rid }); ok(r.status === 200, 'xoá quán');

  console.log('Người dùng, đánh giá, góp ý');
  r = await admin('admin', 'users.list', { q: 'nguyenvana' }); ok(r.data.total === 1 && !('passwordHash' in r.data.items[0]), 'không lộ mật khẩu băm');
  const uid = r.data.items[0].id;
  r = await admin('admin', 'users.setStatus', { id: uid, status: 'locked' }); ok(r.data.status === 'locked', 'khoá tài khoản');
  r = await client()('auth', 'login', { email: 'nguyenvana@gmail.com', password: '123456' }); ok(r.status === 403, 'tài khoản vừa khoá không đăng nhập được');
  r = await admin('admin', 'users.setStatus', { id: uid, status: 'active' }); ok(r.data.status === 'active', 'mở khoá');
  r = await admin('admin', 'users.setStatus', { id: uid, status: 'bay-bay' }); ok(r.status === 422, 'trạng thái lạ → 422');
  r = await admin('admin', 'reviews.list', { status: 'pending', pageSize: 100 }); ok(r.data.total === expected.pending, 'số đánh giá chờ duyệt khớp database');
  const rvId = r.data.items[0].id;
  r = await admin('admin', 'reviews.setStatus', { id: rvId, status: 'approved' }); ok(r.data.status === 'approved', 'duyệt đánh giá');
  r = await admin('admin', 'reviews.reply', { id: rvId, text: '   ' }); ok(r.status === 422, 'trả lời rỗng → 422');
  r = await admin('admin', 'reviews.reply', { id: rvId, text: 'Cảm ơn bạn' }); ok(r.data.reply === 'Cảm ơn bạn', 'trả lời đánh giá');
  r = await admin('admin', 'feedback.list', { pageSize: 100 }); const fb = r.data.items.find(x => x.status === 'new');
  r = await admin('admin', 'feedback.reply', { id: fb.id, text: 'Đã ghi nhận' }); ok(r.data.status === 'replied', 'phản hồi góp ý → replied');
  r = await admin('admin', 'counts'); ok(r.data.pending === expected.pending - 1 && r.data.feedbackNew === expected.feedbackNew - 1, 'số đếm cập nhật sau thao tác', JSON.stringify(r.data));

  console.log('Đăng ký & cài đặt & nhật ký');
  const em = `test${Date.now()}@example.com`;
  r = await client()('auth', 'register', { name: 'Người Test', email: em, password: '12345' }); ok(r.status === 422, 'mật khẩu ngắn → 422');
  r = await client()('auth', 'register', { name: 'Người Test', email: em, password: '123456' }); ok(r.status === 200 && r.data.role === 'user', 'đăng ký người mới');
  r = await client()('auth', 'register', { name: 'Người Test', email: em, password: '123456' }); ok(r.status === 409, 'email trùng → 409');
  r = await admin('admin', 'users.stats'); ok(r.data.total === expected.users + 1, 'tổng người dùng tăng một sau đăng ký');
  r = await admin('admin', 'settings.get'); ok(r.data.admins.length === expected.admins && !('passwordHash' in r.data.admins[0]), 'settings.get không lộ mật khẩu băm');
  const s = r.data;
  r = await admin('admin', 'settings.save', { settings: { ...s, general: { ...s.general, contactEmail: 'khong-hop-le' } } }); ok(r.status === 422, 'email liên hệ sai → 422');
  r = await admin('admin', 'settings.save', { settings: { ...s, admins: s.admins.map(a => ({ ...a, role: 'moderator' })) } }); ok(r.status === 422, 'không còn Super admin → 422');
  r = await admin('admin', 'settings.save', { settings: { ...s, notify: { ...s.notify, newUser: true }, admins: [...s.admins, { name: 'Admin Mới', email: 'moi@homnayangi.vn', role: 'moderator', password: 'test-admin-password' }] } }); ok(r.status === 200 && r.data.admins.length === expected.admins + 1 && r.data.notify.newUser === true, 'lưu cài đặt + mời admin mới');
  r = await client()('auth', 'login', { email: 'moi@homnayangi.vn', password: 'test-admin-password' }); ok(r.status === 200 && r.data.role === 'admin', 'admin mới đăng nhập được bằng mật khẩu đã nhập');
  r = await admin('admin', 'settings.backup'); ok(/^Hôm nay/.test(r.data.last), 'sao lưu dữ liệu');
  r = await admin('admin', 'audit.list', { days: 1, pageSize: 100 }); ok(r.data.total >= 15 && r.data.items[0].ts >= r.data.items[1].ts, 'nhật ký ghi lại thao tác, mới nhất trước: ' + r.data.total);
  ok(r.data.items.some(e => e.text.includes('Món Test')), 'nhật ký có thao tác thêm món test');
  r = await admin('admin', 'search', { q: 'pho' }); ok(r.data.foods.length > 0, 'tìm kiếm toàn cục');
  r = await admin('auth', 'logout'); r = await admin('admin', 'counts'); ok(r.status === 401, 'đăng xuất xong → 401');

  // ================= API công khai + dữ liệu người dùng =================
  const login2 = client();
  r = await login2('auth', 'login', { email: 'admin@homnayangi.vn', password: 'admin123' });
  const adm = login2;

  console.log('Món ăn công khai cho web người dùng');
  r = await fetch(`${BASE}/public/foods.php`); const js = await r.text();
  ok(r.status === 200 && /javascript/.test(r.headers.get('content-type')) && js.includes('const allFoods = ['), 'foods.php phát ra script allFoods');
  const catalog = new Function(js + '; return allFoods;')();
  ok(catalog.length === expected.visible && catalog[0].id === 'pho-bo-ha-noi', 'chỉ món hiển thị, đúng thứ tự database', catalog.length);
  ok(catalog[0].suggestedRestaurants.length === 3 && catalog[0].suggestedRestaurants[0].priceEstimate, 'kèm quán gợi ý dạng web dùng (priceEstimate)');
  ok(!('status' in catalog[0]) && !('stats' in catalog[0]) && !('createdBy' in catalog[0]), 'không lộ trường quản trị (status, stats, createdBy)');
  r = await anon('public', 'foods.list'); ok(r.data.length === expected.visible, 'foods.list JSON công khai');
  r = await adm('admin', 'foods.save', { food: { name: 'Món Công Khai Test', description: 'd', price: 10000, category: 'com', region: 'Nam', status: 'visible' } });
  const pubId = r.data.id;
  r = await anon('public', 'foods.list'); ok(r.data.length === expected.visible + 1 && r.data.some(f => f.id === pubId), 'admin thêm món → hiện ngay trên web người dùng');
  await adm('admin', 'foods.bulk', { ids: [pubId], action: 'hide' });
  r = await anon('public', 'foods.list'); ok(r.data.length === expected.visible, 'admin ẩn món → biến mất khỏi web người dùng');
  await adm('admin', 'foods.remove', { id: pubId });

  console.log('Dữ liệu riêng của người dùng (state)');
  const ua = client(), ub = client(), email1 = `state${Date.now()}@example.com`;
  r = await anon('user', 'state.get'); ok(r.status === 401, 'chưa đăng nhập không đọc được state → 401');
  await ua('auth', 'register', { name: 'State A', email: email1, password: '123456' });
  await ub('auth', 'login', { email: 'lan.vu@outlook.com', password: '123456' });
  r = await ua('user', 'state.get'); ok(r.status === 200 && Object.keys(r.data).length === 0, 'người mới chưa có gì');
  r = await ua('user', 'state.save', { key: 'favorites', value: ['pho-bo-ha-noi', 'bun-bo-hue'] }); ok(r.status === 200, 'lưu món yêu thích');
  r = await ua('user', 'state.save', { key: 'healthProfile', value: { heightCm: 170, weightKg: 60, goal: 'giu-can' } }); ok(r.status === 200, 'lưu hồ sơ sức khỏe');
  r = await ua('user', 'state.save', { key: 'healthLog', value: [{ date: '2026-09-26', weightKg: 60 }] }); ok(r.status === 200, 'lưu nhật ký cân nặng');
  r = await ua('user', 'state.save', { key: 'weeklyPlan', value: { meta: {}, days: [], savedAt: 1 } }); ok(r.status === 200, 'lưu thực đơn tuần');
  r = await ua('user', 'state.get'); ok(r.data.favorites.length === 2 && r.data.healthProfile.heightCm === 170 && r.data.healthLog.length === 1, 'đọc lại đúng dữ liệu đã lưu');
  r = await ub('user', 'state.get'); ok(!('favorites' in r.data), 'dữ liệu của người này không lộ sang người khác');
  r = await ua('user', 'state.save', { key: 'khong-co', value: [] }); ok(r.status === 422, 'khoá lạ → 422');
  r = await ua('user', 'state.save', { key: 'favorites', value: { a: 1 } }); ok(r.status === 422, 'sai dạng (đối tượng thay vì mảng) → 422');
  r = await ua('user', 'state.save', { key: 'favorites', value: [1, 2] }); ok(r.status === 422, 'yêu thích không phải chuỗi id → 422');
  r = await ua('user', 'state.save', { key: 'healthLog', value: Array(2500).fill('x') }); ok(r.status === 422, 'quá nhiều phần tử → 422');
  r = await adm('admin', 'users.list', { q: email1 }); ok(r.data.items[0].favorites === 2 && r.data.items[0].hasHealthProfile === true, 'admin thấy số yêu thích và hồ sơ sức khỏe THẬT của người dùng');
  r = await ua('user', 'state.save', { key: 'favorites', value: null }); r = await ua('user', 'state.get'); ok(r.data.favorites === null, 'xoá dữ liệu (null) được ghi nhận');

  console.log('Góp ý từ web');
  r = await anon('public', 'feedback.create', { email: 'khong-hop-le', subject: 'gop-y', message: 'Nội dung hợp lệ' }); ok(r.status === 422, 'email sai → 422');
  r = await anon('public', 'feedback.create', { email: 'a@b.com', subject: 'lung-tung', message: 'Nội dung hợp lệ' }); ok(r.status === 422, 'chủ đề lạ → 422');
  r = await anon('public', 'feedback.create', { email: 'a@b.com', subject: 'gop-y', message: 'ok' }); ok(r.status === 422, 'nội dung quá ngắn → 422');
  const before = (await adm('admin', 'reviews.stats')).data.feedbackNew;
  r = await anon('public', 'feedback.create', { name: 'Khách', email: 'khach@example.com', subject: 'de-xuat-mon', message: 'Món đề xuất: Bánh canh\nRất ngon' }); ok(r.status === 200 && r.data.id > 1042, 'gửi góp ý thành công, có mã mới');
  r = await adm('admin', 'reviews.stats'); ok(r.data.feedbackNew === before + 1, 'admin thấy thêm 1 góp ý chưa phản hồi');
  r = await adm('admin', 'feedback.list', { pageSize: 100 }); ok(r.data.items.some(f => f.email === 'khach@example.com' && f.subjectLabel === 'Đề xuất món mới'), 'góp ý hiện trong danh sách admin');
  for (let i = 0; i < 4; i++) await anon('public', 'feedback.create', { email: 'khach@example.com', subject: 'gop-y', message: 'Góp ý số ' + i });
  r = await anon('public', 'feedback.create', { email: 'khach@example.com', subject: 'gop-y', message: 'Quá số lần cho phép' }); ok(r.status === 429, 'gửi quá 5 lần/giờ → 429');

  console.log('Đánh giá từ web');
  r = await anon('user', 'reviews.create', { foodId: 'pho-bo-ha-noi', stars: 5, text: 'Rất ngon' }); ok(r.status === 401, 'chưa đăng nhập không đánh giá được → 401');
  r = await ua('user', 'reviews.create', { foodId: 'pho-bo-ha-noi', stars: 9, text: 'Rất ngon nhé' }); ok(r.status === 422, 'số sao sai → 422');
  r = await ua('user', 'reviews.create', { foodId: 'khong-co', stars: 5, text: 'Rất ngon nhé' }); ok(r.status === 404, 'món không tồn tại → 404');
  const foodBefore = (await adm('admin', 'foods.get', { id: 'pho-bo-ha-noi' })).data;
  const pendBefore = (await adm('admin', 'reviews.stats')).data.pending;
  r = await ua('user', 'reviews.create', { foodId: 'pho-bo-ha-noi', stars: 1, text: 'Tệ, mặn quá mức' }); ok(r.status === 200 && r.data.status === 'pending', 'gửi đánh giá → chờ duyệt');
  const rvid = r.data.id;
  r = await ua('user', 'reviews.create', { foodId: 'pho-bo-ha-noi', stars: 5, text: 'Đánh giá lần hai' }); ok(r.status === 409, 'đánh giá món 2 lần → 409');
  r = await anon('public', 'reviews.forFood', { foodId: 'pho-bo-ha-noi' }); ok(!r.data.some(x => x.text.includes('Tệ, mặn')), 'chưa duyệt thì chưa hiện công khai');
  ok((await adm('admin', 'reviews.stats')).data.pending === pendBefore + 1, 'admin thấy thêm 1 đánh giá chờ duyệt');
  await adm('admin', 'reviews.setStatus', { id: rvid, status: 'approved' });
  r = await anon('public', 'reviews.forFood', { foodId: 'pho-bo-ha-noi' }); ok(r.data.some(x => x.text.includes('Tệ, mặn') && x.stars === 1), 'duyệt xong → hiện công khai');
  const foodAfter = (await adm('admin', 'foods.get', { id: 'pho-bo-ha-noi' })).data;
  ok(foodAfter.reviewCount === foodBefore.reviewCount + 1 && foodAfter.rating < foodBefore.rating, `duyệt → điểm món cập nhật (${foodBefore.rating} → ${foodAfter.rating}, ${foodBefore.reviewCount} → ${foodAfter.reviewCount})`);
  await adm('admin', 'reviews.setStatus', { id: rvid, status: 'hidden' });
  const foodHidden = (await adm('admin', 'foods.get', { id: 'pho-bo-ha-noi' })).data;
  ok(foodHidden.reviewCount === foodBefore.reviewCount && Math.abs(foodHidden.rating - foodBefore.rating) < 0.011, 'ẩn lại → điểm món trở về như cũ');
  await adm('admin', 'reviews.setStatus', { id: rvid, status: 'approved' });
  ok((await adm('admin', 'foods.get', { id: 'pho-bo-ha-noi' })).data.reviewCount === foodBefore.reviewCount + 1, 'duyệt lại không tính trùng vào rồi đếm đúng 1 lần');

  console.log(`\n${pass} đạt, ${fail} lỗi`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
