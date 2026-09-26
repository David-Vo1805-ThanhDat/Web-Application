/* pages/trang-chu.js — logic riêng của trang trang-chu.html (nạp sau js/core và js/widgets). */
document.addEventListener('DOMContentLoaded', function () {
  var MEAL_LABEL = { 'sang': 'bữa sáng', 'trua': 'bữa trưa', 'an-vat': 'giờ ăn vặt', 'toi': 'bữa tối' };
  var spinBtns = document.querySelectorAll('[data-spin]');
  var currentMealType = 'trua';

  // Cả hai nút quay (bên trái và trong thẻ) cùng đổi trạng thái khi vòng quay đang chạy
  function setSpinning(on) {
    spinBtns.forEach(function (b) {
      var label = b.querySelector('.spin-label');
      if (!b.dataset.label) b.dataset.label = label.textContent;
      b.disabled = on;
      label.textContent = on ? 'Đang quay...' : b.dataset.label;
    });
  }
  var heroWheel = null;

  function mealFoods(mealType) {
    var list = filterFoods(allFoods, { mealType: mealType, sortBy: 'recommended' });
    return list.length ? list : allFoods;
  }

  function setMeal(mealType) {
    var foods = mealFoods(mealType);
    var label = MEAL_LABEL[mealType];
    currentMealType = mealType;
    var grid = document.getElementById('mealFoodsGrid');
    document.getElementById('heroNote').textContent = foods.length > 8
      ? 'Có ' + foods.length + ' món hợp ' + label + '. Vòng quay hiện 8 món ngẫu nhiên trong số đó.'
      : 'Vòng quay có đủ ' + foods.length + ' món hợp ' + label + '.';

    document.querySelectorAll('#mealSwitch button').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.dataset.meal === mealType ? 'true' : 'false');
    });
    document.getElementById('mealTitle').textContent = 'Gợi ý cho ' + label;
    document.getElementById('mealSubtitle').textContent =
      'Món được nhiều người chọn xếp trước. Bấm vào món để xem công thức và quán bán.';
    grid.innerHTML = foods.slice(0, 4).map(renderFoodCard).join('');
    if (window.FX) FX.stagger(grid);           // các thẻ trượt vào lần lượt
    if (heroWheel) heroWheel.updateCandidates(foods, { exact: false });
  }

  function spinHero() {
    if (heroWheel.isSpinning()) return;
    heroWheel.spin();
  }

  var currentMeal = getCurrentMealInfo().mealType;
  heroWheel = createWheel(
    document.getElementById('heroWheelCanvas'),
    mealFoods(currentMeal),
    function (winner) {
      setSpinning(false);
      showResultModal(winner, spinHero);
    },
    function () {
      setSpinning(true);
    }
  );
  spinBtns.forEach(function (b) { b.addEventListener('click', spinHero); });

  document.querySelectorAll('#mealSwitch button').forEach(function (btn) {
    btn.addEventListener('click', function () { setMeal(btn.dataset.meal); });
  });
  setMeal(currentMeal);
  document.getElementById('statFoods').textContent = allFoods.length + '+';

  // Gợi ý nhanh: chọn ngay một món hợp bữa đang chọn, không cần chờ vòng quay
  document.getElementById('quickPickBtn').addEventListener('click', function () {
    if (heroWheel.isSpinning()) return;
    showResultModal(getRandomFood(mealFoods(currentMealType)), spinHero);
  });

  /* ---- dải món chạy ngang: 2 hàng, chiều ngược nhau ---- */
  function pill(food, hidden) {
    return '<a class="dish-pill" href="chi-tiet-mon-an.html?id=' + food.id + '"' + (hidden ? ' tabindex="-1"' : '') + '>' +
      '<img src="' + food.image + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' +
      '<span>' + food.name + '</span></a>';
  }
  function buildMarquee(el, foods, reverse) {
    var visible = foods.map(function (f) { return pill(f, false); }).join('');
    var copy = foods.map(function (f) { return pill(f, true); }).join('');
    el.innerHTML = '<div class="marquee-track' + (reverse ? ' is-reverse' : '') + '">' +
      '<div class="marquee-group">' + visible + '</div>' +
      '<div class="marquee-group" aria-hidden="true">' + copy + '</div></div>';
  }
  var half = Math.ceil(allFoods.length / 2);
  buildMarquee(document.getElementById('marqueeA'), allFoods.slice(0, half), false);
  buildMarquee(document.getElementById('marqueeB'), allFoods.slice(half).concat(allFoods.slice(0, 4)), true);

  /* ---- bento danh mục: ô lớn nhỏ xen kẽ, ảnh nền lấy từ món được đánh giá cao nhất ---- */
  // Danh mục lấy từ backend (xem js/core/categories.js); kiểu ô lớn/nhỏ xoay vòng a–g theo thứ tự
  var BENTO_CLASSES = ['bento-a', 'bento-b', 'bento-c', 'bento-d', 'bento-e', 'bento-f', 'bento-g'];
  var categories = getCategories().map(function (c, i) { return { key: c.slug, label: c.label, cls: BENTO_CLASSES[i % BENTO_CLASSES.length] }; });
  document.getElementById('bento').innerHTML = categories.map(function (c) {
    var n = allFoods.filter(function (f) { return f.category === c.key; }).length;
    return '<li class="bento-item ' + c.cls + '" data-reveal>' +
      '<a class="bento-tile" href="kham-pha.html?category=' + c.key + '">' +
      '<span class="bento-bg" data-cat="' + c.key + '"></span>' +
      '<span class="bento-info"><span class="bento-name">' + c.label + '</span>' +
      '<span class="bento-count">' + n + ' món</span></span>' +
      '<span class="bento-arrow" aria-hidden="true"><i class="bi bi-arrow-up-right"></i></span>' +
      '</a></li>';
  }).join('');
  if (window.FX) FX.stagger(document.getElementById('bento'));   // ô bento hiện lần lượt

  // thử lần lượt các món trong loại cho tới khi có ảnh tải được (một vài link ảnh trong dữ liệu đã hỏng)
  categories.forEach(function (c) {
    var bg = document.querySelector('.bento-bg[data-cat="' + c.key + '"]');
    var candidates = allFoods.filter(function (f) { return f.category === c.key; })
      .sort(function (a, b) { return b.rating - a.rating; });
    (function tryNext(i) {
      if (i >= candidates.length) return;
      var img = new Image();
      img.onload = function () {
        bg.style.backgroundImage = 'url("' + candidates[i].image + '")';
        bg.classList.add('is-ready');
      };
      img.onerror = function () { tryNext(i + 1); };
      img.src = candidates[i].image;
    })(0);
  });
});
