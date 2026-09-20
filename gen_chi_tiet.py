# -*- coding: utf-8 -*-
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from generate import page

BODY = """
<div id="notFoundBox" class="container py-5 text-center d-none">
  <div style="font-size:4rem;">🔍</div>
  <h1 class="fw-bold">Không Tìm Thấy Món Ăn</h1>
  <p class="text-muted">Món ăn bạn tìm không tồn tại hoặc đã bị xoá khỏi thực đơn.</p>
  <a href="kham-pha.html" class="btn btn-brand rounded-3">Về Trang Khám Phá</a>
</div>

<div id="detailBox" class="d-none pb-5">
  <!-- Hero Banner -->
  <section class="position-relative" style="height:22rem;overflow:hidden;">
    <img id="heroImage" src="" alt="" class="w-100 h-100" style="object-fit:cover;">
    <div class="position-absolute top-0 start-0 end-0 bottom-0" style="background:linear-gradient(to top, rgba(2,6,23,.92), rgba(2,6,23,.35) 55%, transparent);"></div>
    <div class="position-absolute top-0 start-0 m-3 m-sm-4">
      <a href="kham-pha.html" class="btn btn-sm btn-dark bg-opacity-50 rounded-3 d-inline-flex align-items-center gap-2" style="backdrop-filter:blur(6px);">
        <i class="bi bi-chevron-left"></i> Quay Lại
      </a>
    </div>
    <div class="position-absolute bottom-0 start-0 end-0 p-3 p-sm-4 p-lg-5">
      <div style="max-width:56rem;">
        <div class="d-flex flex-wrap align-items-center gap-2 mb-2" id="heroTags"></div>
        <h1 class="fw-black text-white display-6" id="heroName"></h1>
        <p class="small text-white-50 fst-italic mb-0" id="heroEnglishName"></p>
      </div>
    </div>
  </section>

  <!-- Quick stats bar -->
  <div class="bg-white border-bottom shadow-sm sticky-top" style="top:0;z-index:20;">
    <div class="container d-flex align-items-center justify-content-between gap-3 py-2 overflow-auto">
      <div class="d-flex align-items-center gap-4 flex-shrink-0">
        <div class="text-center">
          <div class="fw-bold"><i class="bi bi-clock text-muted"></i> <span id="statTime"></span></div>
          <div class="text-muted" style="font-size:.65rem;">Thời gian</div>
        </div>
        <div class="text-center border-start ps-4">
          <div class="fw-bold text-danger"><i class="bi bi-fire"></i> <span id="statCalories"></span></div>
          <div class="text-muted" style="font-size:.65rem;">Calo</div>
        </div>
        <div class="text-center border-start ps-4">
          <div class="fw-bold text-warning"><i class="bi bi-star-fill"></i> <span id="statRating"></span></div>
          <div class="text-muted" style="font-size:.65rem;" id="statReviewCount"></div>
        </div>
      </div>
      <button class="btn btn-outline-secondary rounded-3 flex-shrink-0" id="detailFavoriteBtn">
        <i class="bi bi-heart"></i>
      </button>
    </div>
  </div>

  <div class="container py-4 py-sm-5" style="max-width:56rem;">
    <!-- Description -->
    <section class="mb-4">
      <p class="text-secondary" id="detailDescription"></p>
      <div class="d-flex flex-wrap gap-2 mt-2" id="detailTags"></div>
    </section>

    <!-- Nutrition -->
    <section class="rounded-3xl-custom p-4 p-sm-4 mb-4" style="background:var(--surface); border:1px solid var(--line);">
      <h2 class="h5 fw-bold mb-3"><i class="bi bi-fire text-danger"></i> Thông Tin Dinh Dưỡng (trên 1 phần ăn)</h2>
      <div class="row row-cols-2 row-cols-sm-4 g-3 text-center" id="nutritionGrid"></div>
    </section>

    <div class="row g-4">
      <!-- Ingredient checklist -->
      <div class="col-lg-6">
        <h2 class="h5 fw-bold mb-1"><i class="bi bi-basket text-brand"></i> Nguyên Liệu Cần Chuẩn Bị
          <span class="small fw-normal text-muted">(<span id="ingredientProgress">0/0</span> đã chuẩn bị)</span>
        </h2>
        <div class="progress rounded-pill mb-3" style="height:8px;">
          <div class="progress-bar bg-gradient-brand" id="ingredientProgressBar" style="width:0%;"></div>
        </div>
        <ul class="list-unstyled d-flex flex-column gap-2" id="ingredientList"></ul>
        <div class="alert alert-success small fw-bold text-center d-none mt-2" id="ingredientDoneMsg">
          🎉 Bạn đã chuẩn bị đủ nguyên liệu! Bắt đầu nào!
        </div>
      </div>

      <!-- Cooking steps -->
      <div class="col-lg-6">
        <h2 class="h5 fw-bold mb-3"><i class="bi bi-egg-fried text-brand"></i> Các Bước Thực Hiện</h2>
        <ol class="list-unstyled d-flex flex-column gap-2" id="stepsList"></ol>
      </div>
    </div>

    <!-- Suggested restaurants -->
    <section class="mt-5">
      <h2 class="h5 fw-bold mb-3"><i class="bi bi-geo-alt text-brand"></i> Quán Ăn Ngon Không Cần Nấu 📍</h2>
      <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3" id="restaurantGrid"></div>
    </section>

    <!-- Related foods -->
    <section class="mt-5 pt-4 border-top d-none" id="relatedSection">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="h5 fw-bold mb-0">Món Ăn Tương Tự Bạn Có Thể Thích 🍽️</h2>
        <a href="kham-pha.html" class="small fw-semibold text-decoration-none">Xem Tất Cả →</a>
      </div>
      <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4" id="relatedGrid"></div>
    </section>
  </div>
</div>
"""

EXTRA_SCRIPT = """<script>
document.addEventListener('DOMContentLoaded', function () {
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');
  var food = id ? getFoodById(id) : null;

  if (!food) {
    document.getElementById('notFoundBox').classList.remove('d-none');
    return;
  }
  document.getElementById('detailBox').classList.remove('d-none');
  document.title = food.name + ' | Hôm Nay Bạn Muốn Ăn Gì?';

  var regionGradient = {
    'Bắc': 'linear-gradient(to right,#2563eb,#1e40af)',
    'Trung': 'linear-gradient(to right,#d97706,#c2410c)',
    'Nam': 'linear-gradient(to right,#059669,#0f766e)',
  }[food.region] || 'linear-gradient(to right,#7c3aed,#4338ca)';

  document.getElementById('heroImage').src = food.image;
  document.getElementById('heroImage').alt = food.name;
  document.getElementById('heroName').textContent = food.name;
  document.getElementById('heroEnglishName').textContent = food.englishName;

  var tagsHtml = '<span class="badge rounded-pill text-white fw-bold px-3 py-2" style="background:' + regionGradient + ';">' + food.region + '</span>';
  if (food.popular) tagsHtml += ' <span class="badge rounded-pill bg-danger px-3 py-2">🔥 Hot &amp; Trending</span>';
  if (food.dietary.includes('eat-clean')) tagsHtml += ' <span class="badge rounded-pill bg-success px-3 py-2">🥗 Eat Clean</span>';
  if (food.dietary.includes('vegetarian')) tagsHtml += ' <span class="badge rounded-pill bg-success px-3 py-2">🌱 Ăn Chay</span>';
  document.getElementById('heroTags').innerHTML = tagsHtml;

  document.getElementById('statTime').textContent = food.cookTimeMinutes + ' phút';
  document.getElementById('statCalories').textContent = food.calories + ' kcal';
  document.getElementById('statRating').textContent = food.rating;
  document.getElementById('statReviewCount').textContent = food.reviewCount + ' đánh giá';

  document.getElementById('detailDescription').textContent = food.description;
  document.getElementById('detailTags').innerHTML = food.tags.map(function (t) {
    return '<span class="badge bg-light text-dark border">#' + t + '</span>';
  }).join(' ');

  document.getElementById('nutritionGrid').innerHTML = [
    { label: 'Calo (kcal)', value: food.calories, color: '#ea580c' },
    { label: 'Protein', value: food.nutrition.protein + 'g', color: '#2563eb' },
    { label: 'Carbs', value: food.nutrition.carbs + 'g', color: '#d97706' },
    { label: 'Chất béo', value: food.nutrition.fat + 'g', color: '#e11d48' },
  ].map(function (n) {
    return '<div class="col"><div class="bg-white rounded-3 p-3 border shadow-sm h-100">' +
      '<div class="fw-black fs-5" style="color:' + n.color + ';">' + n.value + '</div>' +
      '<div class="small text-muted">' + n.label + '</div></div></div>';
  }).join('');

  // Favorite button
  var favBtn = document.getElementById('detailFavoriteBtn');
  function renderFavBtn() {
    var isFav = getFavoritesFromStorage().includes(food.id);
    favBtn.classList.toggle('text-danger', isFav);
    favBtn.classList.toggle('border-danger', isFav);
    favBtn.innerHTML = '<i class="bi ' + (isFav ? 'bi-heart-fill' : 'bi-heart') + '"></i>';
  }
  favBtn.addEventListener('click', function () {
    var nowFav = toggleFavoriteInStorage(food.id);
    renderFavBtn();
    showToast(nowFav ? 'success' : 'info', nowFav
      ? 'Đã lưu "' + food.name + '" vào danh sách yêu thích! ❤️'
      : 'Đã bỏ lưu "' + food.name + '" khỏi yêu thích.');
  });
  renderFavBtn();

  // Ingredient checklist
  var checked = new Set();
  function renderIngredients() {
    document.getElementById('ingredientProgress').textContent = checked.size + '/' + food.ingredients.length;
    var pct = food.ingredients.length ? (checked.size / food.ingredients.length) * 100 : 0;
    document.getElementById('ingredientProgressBar').style.width = pct + '%';
    document.getElementById('ingredientList').innerHTML = food.ingredients.map(function (ing, i) {
      var isChecked = checked.has(i);
      return '<li><button type="button" class="btn w-100 d-flex align-items-center gap-2 text-start ingredient-btn ' +
        (isChecked ? 'ingredient-checked' : '') + '" data-idx="' + i + '">' +
        '<i class="bi ' + (isChecked ? 'bi-check-square-fill text-success' : 'bi-square text-secondary') + '"></i>' +
        '<span class="flex-grow-1 ' + (isChecked ? 'text-decoration-line-through text-success' : '') + '">' + ing.name + '</span>' +
        '<span class="small text-muted">' + ing.amount + '</span></button></li>';
    }).join('');
    document.getElementById('ingredientDoneMsg').classList.toggle('d-none', checked.size !== food.ingredients.length);
    document.querySelectorAll('.ingredient-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.dataset.idx, 10);
        if (checked.has(idx)) checked.delete(idx); else checked.add(idx);
        renderIngredients();
      });
    });
  }
  renderIngredients();

  // Cooking steps
  var activeStep = null;
  function renderSteps() {
    document.getElementById('stepsList').innerHTML = food.instructions.map(function (step, i) {
      var isActive = activeStep === i;
      return '<li><button type="button" class="btn w-100 d-flex align-items-start gap-3 text-start step-btn ' +
        (isActive ? 'step-active' : '') + '" data-idx="' + i + '">' +
        '<span class="step-num ' + (isActive ? 'step-num-active' : '') + '">' + (i + 1) + '</span>' +
        '<span class="small">' + step + '</span></button></li>';
    }).join('');
    document.querySelectorAll('.step-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.dataset.idx, 10);
        activeStep = activeStep === idx ? null : idx;
        renderSteps();
      });
    });
  }
  renderSteps();

  // Restaurants
  document.getElementById('restaurantGrid').innerHTML = food.suggestedRestaurants.map(function (r, i) {
    return '<div class="col"><div class="bg-white rounded-3xl-custom border p-3 h-100 restaurant-card">' +
      '<div class="d-flex justify-content-between gap-2 mb-1">' +
      '<h3 class="h6 fw-bold mb-0">' + r.name + '</h3>' +
      '<span class="badge bg-brand-100-custom text-brand rounded-circle" style="width:24px;height:24px;">#' + (i + 1) + '</span></div>' +
      '<p class="small text-muted mb-2"><i class="bi bi-geo-alt"></i> ' + r.address + '</p>' +
      '<div class="d-flex align-items-center">' +
      '<span class="badge bg-light text-dark border small"><i class="bi bi-globe"></i> ' + r.city + '</span>' +
      '</div></div></div>';
  }).join('');

  // Related foods
  var related = getRelatedFoods(food, 3);
  if (related.length > 0) {
    document.getElementById('relatedSection').classList.remove('d-none');
    document.getElementById('relatedGrid').innerHTML = related.map(renderFoodCard).join('');
  }
});
</script>
<style>
.step-num{flex-shrink:0;width:1.75rem;height:1.75rem;border-radius:50%;background:var(--surface-2);color:var(--text-2);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:800;}
.step-num-active{background:var(--brand-500);color:#fff;}
.step-btn{border:1px solid var(--line);border-radius:.75rem;background:var(--surface);color:var(--text);padding:.85rem;}
.step-active{background:var(--brand-50);border-color:var(--brand-200,#fed7aa);}
.ingredient-btn{border:1px solid var(--line);border-radius:.75rem;background:var(--surface);color:var(--text);padding:.7rem .9rem;}
.ingredient-checked{background:#ECFDF5;border-color:#A7F3D0;}
.restaurant-card{transition:.2s;}
.restaurant-card:hover{border-color:var(--brand-300,#fdba74) !important;box-shadow:0 6px 18px rgba(234,88,12,.15);}
.bg-brand-100-custom{background:var(--brand-100,#ffedd5);}
.text-brand{color:var(--brand-600);}
</style>"""

if __name__ == "__main__":
    html = page(
        "Chi Tiết Món Ăn | Hôm Nay Bạn Muốn Ăn Gì?",
        "Xem chi tiết nguyên liệu, cách chế biến, thông tin dinh dưỡng và quán ăn gợi ý cho món ăn bạn đã chọn.",
        BODY, EXTRA_SCRIPT
    )
    with open(os.path.join(HERE, "chi-tiet-mon-an.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("chi-tiet-mon-an.html:", len(html), "ky tu")
