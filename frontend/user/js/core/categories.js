/* core/categories.js — Danh mục món ăn dùng chung cho mọi trang (thanh lọc "Khám phá", ô bento "Trang chủ", nhãn trên thẻ món).
   Nguồn chính: backend phát kèm `const allCategories = [{ slug, label }]` trong backend/api/public/foods.php — admin thêm/sửa/xoá
   danh mục ở trang "Danh mục & thẻ" thì web tự đổi theo. Nếu backend chưa phát allCategories thì dùng danh sách mặc định bên dưới.
   Chỉ hiện danh mục đang có ít nhất 1 món hiển thị. */
var DEFAULT_CATEGORIES = [
  { slug: 'mon-nuoc', label: 'Món nước' }, { slug: 'com', label: 'Cơm' }, { slug: 'cuon-tron', label: 'Cuốn và trộn' },
  { slug: 'an-vat', label: 'Ăn vặt' }, { slug: 'lau-nuong', label: 'Lẩu và nướng' }, { slug: 'chay', label: 'Đồ chay' },
  { slug: 'trang-mieng', label: 'Tráng miệng' },
];
var CATEGORY_EMOJI = { 'mon-nuoc': '🍜', com: '🍚', 'cuon-tron': '🥢', 'an-vat': '🥪', 'lau-nuong': '🍲', chay: '🥗', 'trang-mieng': '🧋' };

// Toàn bộ danh mục (theo backend nếu có), mỗi mục: { slug, label, emoji }
function getAllCategories() {
  var src = (typeof allCategories !== 'undefined' && Array.isArray(allCategories) && allCategories.length) ? allCategories : DEFAULT_CATEGORIES;
  return src.map(function (c) { return { slug: c.slug, label: c.label, emoji: CATEGORY_EMOJI[c.slug] || '🍴' }; });
}

// Danh mục đang có món hiển thị (dùng để vẽ bộ lọc / bento)
function getCategories() {
  var used = {};
  allFoods.forEach(function (f) { used[f.category] = true; });
  return getAllCategories().filter(function (c) { return used[c.slug]; });
}

function categoryLabel(slug) {
  var c = getAllCategories().filter(function (x) { return x.slug === slug; })[0];
  return c ? c.label : slug;
}
