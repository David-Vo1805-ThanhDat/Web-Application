/* Categories come exclusively from the database catalog endpoint. */
var CATEGORY_EMOJI = { 'mon-nuoc': '🍜', com: '🍚', 'cuon-tron': '🥢', 'an-vat': '🥪', 'lau-nuong': '🍲', chay: '🥗', 'trang-mieng': '🧋' };

// Toàn bộ danh mục (theo backend nếu có), mỗi mục: { slug, label, emoji }
function getAllCategories() {
  var src = (typeof allCategories !== 'undefined' && Array.isArray(allCategories)) ? allCategories : [];
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
