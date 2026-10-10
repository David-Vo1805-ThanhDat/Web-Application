/* Categories come exclusively from the database catalog endpoint. */
var CATEGORY_EMOJI = { 'mon-nuoc': '🍜', com: '🍚', 'cuon-tron': '🥢', 'an-vat': '🥪', 'lau-nuong': '🍲', chay: '🥗', 'trang-mieng': '🧋' };
// Danh mục có hình riêng (thay emoji ở thẻ lọc trang Khám phá). Thêm hình: bỏ file vào frontend/image/kham-pha/ rồi khai báo ở đây.
var CATEGORY_IMAGE = {
  'mon-nuoc': '../image/kham-pha/mon-nuoc-192.png',
  com: '../image/kham-pha/com-tam-192.png',
  'an-vat': '../image/kham-pha/an-vat-192.png',
  'trang-mieng': '../image/kham-pha/tra-sua-192.png',
  chay: '../image/kham-pha/salad-192.png',
  'cuon-tron': '../image/kham-pha/banh-cuon-192.png',
  'lau-nuong': '../image/kham-pha/lau-192.png',
};

// Toàn bộ danh mục (theo backend nếu có), mỗi mục: { slug, label, emoji, image }
function getAllCategories() {
  var src = (typeof allCategories !== 'undefined' && Array.isArray(allCategories)) ? allCategories : [];
  return src.map(function (c) {
    return { slug: c.slug, label: c.label, emoji: CATEGORY_EMOJI[c.slug] || '🍴', image: CATEGORY_IMAGE[c.slug] || '' };
  });
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
