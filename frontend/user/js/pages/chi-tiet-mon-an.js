/* pages/chi-tiet-mon-an.js — logic riêng của trang chi-tiet-mon-an.html (nạp sau js/core và js/widgets). */
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
      '<h3 class="h6 fw-bold mb-0">' + escHtml(r.name) + '</h3>' +
      '<span class="badge bg-brand-100-custom text-brand rounded-circle" style="width:24px;height:24px;">#' + (i + 1) + '</span></div>' +
      '<p class="small text-muted mb-2"><i class="bi bi-geo-alt"></i> ' + escHtml(r.address) + '</p>' +
      '<div class="d-flex align-items-center justify-content-between gap-2 flex-wrap">' +
      '<span class="badge bg-light text-dark border small"><i class="bi bi-globe"></i> ' + escHtml(r.city) + '</span>' +
      '<a class="small fw-semibold text-decoration-none" target="_blank" rel="noopener noreferrer" href="' + googleMapsUrl(r.name + ' ' + r.address) + '"><i class="bi bi-signpost-2"></i> Chỉ đường</a>' +
      '</div></div></div>';
  }).join('');
  // Tìm thêm quán bán món này quanh người dùng (Google Maps tự điền tên món vào ô tìm kiếm)
  var mapsAll = document.getElementById('detailMapsLink');
  mapsAll.href = googleMapsUrl(food.name);
  mapsAll.querySelector('.maps-food').textContent = food.name;
  document.getElementById('detailMapsNear').addEventListener('click', function () { openMapsNearMe(food.name); });

  // Related foods
  var related = getRelatedFoods(food, 3);
  if (related.length > 0) {
    document.getElementById('relatedSection').classList.remove('d-none');
    document.getElementById('relatedGrid').innerHTML = related.map(renderFoodCard).join('');
  }

  /* ---- Nấu thử món này: phản hồi từng nguyên liệu (cần backend; chưa có thì khu này tự ẩn) ---- */
  mountCookFeedback(food);
});
