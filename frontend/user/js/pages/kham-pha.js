/* pages/kham-pha.js — logic riêng của trang kham-pha.html (nạp sau js/core và js/widgets). */
document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var state = {
    tab: params.get('tab') === 'favorites' ? 'favorites' : 'all',
    searchQuery: '',
    category: params.get('category') || 'all',
    priceCategory: 'all',
    taste: 'all',
    dietary: 'all',
    region: 'all',
    sortBy: 'recommended',
  };

  document.getElementById('totalCount').textContent = allFoods.length;

  // Vẽ các nút danh mục từ backend (admin thêm/sửa danh mục thì web tự đổi theo); "Tất cả" đã có sẵn trong HTML
  var pillsBox = document.getElementById('categoryPills');
  getCategories().forEach(function (c) {
    var b = document.createElement('button');
    b.className = 'chip-filter'; b.dataset.value = c.slug; b.textContent = c.emoji + ' ' + c.label;
    pillsBox.appendChild(b);
  });
  // Đường dẫn ?category=<mã> của danh mục không còn tồn tại → quay về "Tất cả"
  if (state.category !== 'all' && !getCategories().some(function (c) { return c.slug === state.category; })) state.category = 'all';

  // Đặt trạng thái ban đầu của tab & pill danh mục theo URL
  if (state.tab === 'favorites') {
    document.getElementById('tabAll').classList.remove('active');
    document.getElementById('tabFavorites').classList.add('active');
  }
  document.querySelectorAll('#categoryPills .chip-filter').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.value === state.category);
  });

  function getFavIds() { return getFavoritesFromStorage(); }

  function updateFavTabBadge() {
    var count = getFavIds().length;
    var badge = document.getElementById('favTabCount');
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }

  function compute() {
    // state truyền thẳng làm options cho filterFoods() (js/data-utils.js) — các khoá phải khớp
    // TÊN đúng như filterFoods() mong đợi (category/priceCategory/taste/dietary/region/sortBy/
    // searchQuery). Trước đây state dùng tên "query" thay vì "searchQuery" nên filterFoods()
    // không nhận ra, khiến ô tìm kiếm không lọc được gì (luôn hiện đủ 31 món dù gõ gì đi nữa).
    var base = filterFoods(allFoods, state);
    if (state.tab === 'favorites') {
      var favIds = getFavIds();
      base = base.filter(function (f) { return favIds.indexOf(f.id) !== -1; });
    }
    return base;
  }

  function hasActiveFilters() {
    return state.searchQuery !== '' || state.category !== 'all' || state.priceCategory !== 'all' ||
      state.taste !== 'all' || state.dietary !== 'all' || state.region !== 'all';
  }

  function render() {
    var results = compute();
    var countText = 'Hiển thị ' + results.length + ' món ăn';
    if (state.searchQuery) countText += ' cho "' + state.searchQuery + '"';
    document.getElementById('resultsCountText').textContent = countText;
    document.getElementById('clearFiltersBtn').style.display = hasActiveFilters() ? 'inline-block' : 'none';

    var grid = document.getElementById('foodGrid');
    var empty = document.getElementById('emptyState');
    var backBtn = document.getElementById('emptyBackToAllBtn');

    if (results.length === 0) {
      grid.innerHTML = '';
      empty.classList.remove('d-none');
      if (state.tab === 'favorites') {
        document.getElementById('emptyTitle').textContent = 'Chưa có món ăn nào được lưu yêu thích!';
        document.getElementById('emptyDesc').textContent = 'Hãy nhấn biểu tượng ❤️ trên các thẻ món ăn để lưu những món bạn yêu thích.';
        backBtn.classList.remove('d-none');
      } else {
        document.getElementById('emptyTitle').textContent = 'Không tìm thấy món ăn phù hợp!';
        document.getElementById('emptyDesc').textContent = 'Thử điều chỉnh từ khóa tìm kiếm hoặc nới lỏng bộ lọc để có thêm lựa chọn.';
        backBtn.classList.add('d-none');
      }
    } else {
      empty.classList.add('d-none');
      grid.innerHTML = results.map(renderFoodCard).join('');
    }
  }

  document.getElementById('tabAll').addEventListener('click', function () {
    state.tab = 'all';
    this.classList.add('active');
    document.getElementById('tabFavorites').classList.remove('active');
    render();
  });
  document.getElementById('tabFavorites').addEventListener('click', function () {
    state.tab = 'favorites';
    this.classList.add('active');
    document.getElementById('tabAll').classList.remove('active');
    render();
  });
  document.getElementById('emptyBackToAllBtn').addEventListener('click', function () {
    document.getElementById('tabAll').click();
  });

  var searchTimer;
  document.getElementById('searchInput').addEventListener('input', function (e) {
    clearTimeout(searchTimer);
    var val = e.target.value;
    searchTimer = setTimeout(function () { state.searchQuery = val; render(); }, 200);
  });

  document.querySelectorAll('#categoryPills .chip-filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('#categoryPills .chip-filter').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.category = btn.dataset.value;
      render();
    });
  });

  document.querySelectorAll('#dietaryButtons .chip-filter').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('#dietaryButtons .chip-filter').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.dietary = btn.dataset.value;
      render();
    });
  });

  document.getElementById('filterPrice').addEventListener('change', function (e) { state.priceCategory = e.target.value; render(); });
  document.getElementById('filterTaste').addEventListener('change', function (e) { state.taste = e.target.value; render(); });
  document.getElementById('filterRegion').addEventListener('change', function (e) { state.region = e.target.value; render(); });
  document.getElementById('sortSelect').addEventListener('change', function (e) { state.sortBy = e.target.value; render(); });

  document.getElementById('clearFiltersBtn').addEventListener('click', function () {
    state.searchQuery = ''; state.category = 'all'; state.priceCategory = 'all';
    state.taste = 'all'; state.dietary = 'all'; state.region = 'all';
    document.getElementById('searchInput').value = '';
    document.getElementById('filterPrice').value = 'all';
    document.getElementById('filterTaste').value = 'all';
    document.getElementById('filterRegion').value = 'all';
    document.querySelectorAll('#categoryPills .chip-filter').forEach(function (b) { b.classList.toggle('active', b.dataset.value === 'all'); });
    document.querySelectorAll('#dietaryButtons .chip-filter').forEach(function (b) { b.classList.toggle('active', b.dataset.value === 'all'); });
    render();
  });

  window.addEventListener('favorites-updated', function () { updateFavTabBadge(); render(); });

  updateFavTabBadge();
  render();
});
