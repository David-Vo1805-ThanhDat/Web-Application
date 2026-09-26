/* seed/seed-foods.js — Sinh dữ liệu khởi tạo cho Món ăn, Danh mục & thẻ, Quán ăn gợi ý (chạy bởi ../export_seed.js).
   Món ăn lấy TỪ CHÍNH dữ liệu web người dùng (js/data/foods.js → biến allFoods) để số liệu khớp thật
   (31 món, 65 quán, số khẩu vị...); chỉ thêm các trường dành cho admin (trạng thái, lượt xem/quay/tim). */
(function () {
  'use strict';

  var DAY = 86400000;

  var CATEGORIES = [
    { slug: 'mon-nuoc', label: 'Món nước', tone: 'orange', icon: 'bowl' },
    { slug: 'com', label: 'Cơm', tone: 'blue', icon: 'bowl' },
    { slug: 'an-vat', label: 'Ăn vặt', tone: 'purple', icon: 'tag' },
    { slug: 'cuon-tron', label: 'Cuốn/Trộn', tone: 'green', icon: 'leaf' },
    { slug: 'chay', label: 'Chay', tone: 'amber', icon: 'leaf' },
    { slug: 'lau-nuong', label: 'Lẩu/Nướng', tone: 'rose', icon: 'fire' },
    { slug: 'trang-mieng', label: 'Tráng miệng', tone: 'sky', icon: 'star' },
  ];
  var REGIONS = [
    { slug: 'Bắc', label: 'Bắc', dot: 'blue' }, { slug: 'Trung', label: 'Trung', dot: 'amber' },
    { slug: 'Nam', label: 'Nam', dot: 'orange' }, { slug: 'Quốc tế', label: 'Quốc tế', dot: 'purple' },
  ];
  var TASTES = [
    { slug: 'dam-da', label: 'Đậm đà' }, { slug: 'beo-ngay', label: 'Béo ngậy' }, { slug: 'chua-cay', label: 'Chua cay' },
    { slug: 'ngot', label: 'Ngọt' }, { slug: 'thanh-dam', label: 'Thanh đạm' }, { slug: 'cay', label: 'Cay' },
    { slug: 'man', label: 'Mặn' }, { slug: 'chua', label: 'Chua' },
  ];
  var DIETS = [
    { slug: 'normal', label: 'Thông thường' }, { slug: 'eat-clean', label: 'Eat clean' },
    { slug: 'vegetarian', label: 'Chay' }, { slug: 'low-carb', label: 'Low-carb' },
  ];
  var MEALS = [
    { slug: 'sang', label: 'Sáng' }, { slug: 'trua', label: 'Trưa' }, { slug: 'an-vat', label: 'Ăn vặt' }, { slug: 'toi', label: 'Tối' },
  ];
  // Thẻ hiển thị lấy từ chính dữ liệu món ăn (nhãn tự do), xếp theo số món dùng nhiều → ít
  var TAGS = (function () {
    var c = {}, order = [];
    allFoods.forEach(function (f) { (f.tags || []).forEach(function (t) { if (!(t in c)) { c[t] = 0; order.push(t); } c[t]++; }); });
    return order.sort(function (a, b) { return c[b] - c[a]; });
  })();

  // Số liệu cố định cho các món "nổi" (khớp Dashboard/Thống kê trong Figma); món khác được sinh ổn định theo id.
  var KNOWN = {
    'pho-bo-ha-noi': { views: 4920, spins: 1180, favorites: 298 },
    'bun-bo-hue': { views: 4310, spins: 760, favorites: 312 },
    'com-tam-suon-bi-cha': { views: 6980, spins: 1120, favorites: 270 },
    'tra-sua-tran-chau-duong-den': { views: 7240, spins: 1290, favorites: 255 },
    'banh-xeo-mien-tay': { views: 3100, spins: 410, favorites: 201 },
    'lau-thai-chua-cay': { views: 6510, spins: 980, favorites: 190 },
    'ca-phe-sua-da-sai-gon': { views: 8120, spins: 1480, favorites: 150 },
  };
  var TOTAL_SPINS = 9412, TOTAL_FAVS = 2036;

  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
  function rnd(seed, min, max) { return min + (hash(seed) % (max - min + 1)); }

  function buildFoods() {
    var list = allFoods.slice();
    var order = list.map(function (f) { return f.id; }); // thứ tự gốc của dự án (backend/data/foods/_order.json)
    var byId = {}; list.forEach(function (f) { byId[f.id] = f; });

    // Sinh lượt xem/quay/tim cho các món chưa có số cố định, rồi co giãn để tổng khớp 9.412 quay và 2.036 tim.
    var restSpins = 0, restFavs = 0, unknown = [];
    order.forEach(function (id) { if (!KNOWN[id]) unknown.push(id); });
    var knownSpins = 0, knownFavs = 0;
    Object.keys(KNOWN).forEach(function (k) { knownSpins += KNOWN[k].spins; knownFavs += KNOWN[k].favorites; });
    var rawS = unknown.map(function (id) { return rnd(id + 's', 60, 200); });
    var rawF = unknown.map(function (id) { return rnd(id + 'f', 10, 60); });
    var sumS = rawS.reduce(function (a, b) { return a + b; }, 0), sumF = rawF.reduce(function (a, b) { return a + b; }, 0);
    var stats = {};
    Object.keys(KNOWN).forEach(function (k) { stats[k] = KNOWN[k]; });
    unknown.forEach(function (id, i) {
      stats[id] = {
        spins: Math.round(rawS[i] * (TOTAL_SPINS - knownSpins) / sumS),
        favorites: Math.round(rawF[i] * (TOTAL_FAVS - knownFavs) / sumF),
        views: rnd(id + 'v', 900, 3600),
      };
    });

    return order.map(function (id, i) {
      var f = byId[id];
      var status = id === 'salad-uc-ga-eat-clean' ? 'hidden' : id === 'mi-cay-7-cap-do' ? 'pending' : 'visible';
      return {
        id: f.id, no: i + 1, name: f.name, englishName: f.englishName, description: f.description,
        category: f.category, region: f.region, cookTimeMinutes: f.cookTimeMinutes,
        mealType: f.mealType.slice(), taste: f.taste.slice(), dietary: f.dietary.slice(), tags: f.tags.slice(0, 4),
        price: f.price, priceRange: f.priceRange, calories: f.calories,
        nutrition: { protein: f.nutrition.protein, carbs: f.nutrition.carbs, fat: f.nutrition.fat },
        image: f.image,
        ingredients: f.ingredients.map(function (x) { return { name: x.name, amount: x.amount }; }),
        instructions: f.instructions.slice(),
        popular: !!f.popular, status: status,
        rating: f.rating, reviewCount: f.reviewCount,
        stats: stats[id],
        createdBy: 'Quản trị viên',
        createdAt: id === 'pho-bo-ha-noi' ? new Date('2026-08-12T09:00:00').getTime() : Date.now() - (30 + rnd(id + 'c', 0, 200)) * DAY,
        updatedAt: id === 'pho-bo-ha-noi' ? Date.now() - 3 * DAY : Date.now() - rnd(id + 'u', 1, 60) * DAY,
      };
    });
  }

  function buildRestaurants() {
    var out = [], id = 0;
    allFoods.forEach(function (f) {
      (f.suggestedRestaurants || []).forEach(function (r) {
        var nums = String(r.priceEstimate || '').match(/[\d.]+/g) || [];
        out.push({
          id: ++id, foodId: f.id, name: r.name, address: r.address, city: r.city,
          priceText: r.priceEstimate || '', priceMin: nums[0] ? parseInt(nums[0].replace(/\./g, ''), 10) : 0,
          priceMax: nums[1] ? parseInt(nums[1].replace(/\./g, ''), 10) : 0,
        });
      });
    });
    return out;
  }

  window.Seed = window.Seed || {};
  window.Seed.taxonomy = { CATEGORIES: CATEGORIES, REGIONS: REGIONS, TASTES: TASTES, DIETS: DIETS, MEALS: MEALS, TAGS: TAGS };
  window.Seed.foods = buildFoods;
  window.Seed.restaurants = buildRestaurants;
  window.Seed.hash = hash;
  window.Seed.rnd = rnd;
  window.Seed.TOTAL_SPINS = TOTAL_SPINS;
})();
