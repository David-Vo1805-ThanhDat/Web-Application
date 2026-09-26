# -*- coding: utf-8 -*-
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from generate import page, result_modal_block

BODY = """
<script>document.documentElement.classList.add('fx');</script>

<!-- 1. HERO: khung theo thiết kế gốc (nhãn, tiêu đề, hai nút, ba chỉ số | thẻ vòng quay) -->
<section class="hero">
  <div class="container">
    <div class="row align-items-center g-5">
      <div class="col-lg-6">
        <span class="hero-chip"><i class="bi bi-stars"></i> Giải cứu chiếc bụng đói chỉ trong 5 giây</span>
        <h1 class="hero-title">Hôm Nay Bạn<br><span class="text-grad">Muốn Ăn Gì?</span> <svg class="hero-bowl" viewBox="0 0 72 62" aria-hidden="true">
            <path d="M40 4 58 30M48 1 66 26" stroke="#D4A05A" stroke-width="4" stroke-linecap="round"/>
            <path d="M10 30c4-9 9-9 13 0s9 9 13 0 9-9 13 0 9 9 12 1" stroke="#FCD34D" stroke-width="5" stroke-linecap="round" fill="none"/>
            <path d="M4 32h64c0 15-13 26-32 26S4 47 4 32z" fill="#EF4444"/>
            <path d="M4 32h64" stroke="#B91C1C" stroke-width="5" stroke-linecap="round"/>
            <path d="M26 58h20" stroke="#B91C1C" stroke-width="5" stroke-linecap="round"/>
          </svg></h1>
        <p class="hero-lede">
          Đừng để câu hỏi "Trưa nay ăn gì?" hay "Tối nay đi đâu?" làm bạn mất thời gian quý giá.
          Quay vòng quay may mắn hoặc lọc theo ngân sách, khẩu vị để chốt món ngay!
        </p>

        <div class="hero-actions">
          <button type="button" class="btn btn-brand btn-lg" data-spin><i class="bi bi-stars"></i> <span class="spin-label">Quay Ngẫu Nhiên Ngay</span></button>
          <button type="button" class="btn btn-outline-brand btn-lg" id="quickPickBtn"><i class="bi bi-dice-5"></i> Gợi ý nhanh 1 món</button>
        </div>

        <div class="hero-stats">
          <div class="hero-stat"><b id="statFoods">31+</b><span>Món ngon đặc sắc</span></div>
          <div class="hero-stat"><b>5 Giây</b><span>Quyết định bữa ăn</span></div>
          <div class="hero-stat"><b>100%</b><span>Hài lòng no nê</span></div>
        </div>
      </div>

      <div class="col-lg-6">
        <div class="lucky-card">
          <span class="lucky-chip">Vòng quay may mắn</span>
          <h2 class="lucky-title">Thử vận may bữa hôm nay!</h2>
          <div class="meal-switch-group" id="mealSwitch" role="group" aria-label="Chọn bữa ăn">
            <button type="button" data-meal="sang" aria-pressed="false">Sáng</button>
            <button type="button" data-meal="trua" aria-pressed="false">Trưa</button>
            <button type="button" data-meal="an-vat" aria-pressed="false">Ăn vặt</button>
            <button type="button" data-meal="toi" aria-pressed="false">Tối</button>
          </div>
          <div class="wheel-stage">
            <div class="wheel-pointer" aria-hidden="true"></div>
            <canvas id="heroWheelCanvas" width="640" height="640" role="img" aria-label="Vòng quay chọn món ăn. Bấm để quay."></canvas>
          </div>
          <button type="button" class="btn btn-brand btn-lg" data-spin><i class="bi bi-stars"></i> <span class="spin-label">BẤM ĐỂ QUAY NGAY</span> 🎯</button>
          <p class="lucky-note" id="heroNote" aria-live="polite"></p>
          <p class="lucky-note">Đi ăn cùng nhóm? <a href="goi-y.html#nhom">Chọn cùng cả nhóm</a></p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 2. DẢI MÓN ĂN CHẠY NGANG -->
<div class="marquee-wrap" aria-label="Một vài món trong thực đơn">
  <div class="marquee" id="marqueeA"></div>
  <div class="marquee" id="marqueeB"></div>
</div>

<!-- 3. GỢI Ý THEO BỮA (đi theo nút chọn bữa ở hero) -->
<section class="section" aria-labelledby="mealTitle">
  <div class="container">
    <div class="section-head" data-reveal>
      <div>
        <h2 id="mealTitle"></h2>
        <p id="mealSubtitle"></p>
      </div>
      <a href="kham-pha.html" class="link-arrow">Xem cả thực đơn</a>
    </div>
    <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3 g-lg-4" id="mealFoodsGrid"></div>
  </div>
</section>

<!-- 4. THỰC ĐƠN THEO LOẠI: bento -->
<section class="section pt-0" aria-labelledby="catTitle">
  <div class="container">
    <div class="section-head" data-reveal>
      <div>
        <h2 id="catTitle">Đang thèm món gì?</h2>
        <p>Chọn một loại để xem hết các món trong đó, từ tô phở nóng đến ly chè mát.</p>
      </div>
      <a href="kham-pha.html" class="link-arrow">Xem tất cả</a>
    </div>
    <ul class="bento" id="bento"></ul>
  </div>
</section>

<!-- 5. CÁCH HOẠT ĐỘNG (đúng là một chuỗi 3 bước) -->
<section class="section pt-0" aria-labelledby="howTitle">
  <div class="container">
    <h2 id="howTitle" class="mb-4" data-reveal>Từ đói đến chốt món trong ba bước</h2>
    <ol class="steps">
      <li data-reveal>
        <div class="step-card">
          <span class="step-num">1</span>
          <h3>Chọn bữa và ngân sách</h3>
          <p>Sáng, trưa, tối hay ăn vặt. Muốn kỹ hơn thì lọc thêm theo giá, khẩu vị và chế độ ăn.</p>
        </div>
      </li>
      <li data-reveal>
        <div class="step-card">
          <span class="step-num">2</span>
          <h3>Quay để chốt</h3>
          <p>Vòng quay chọn ngẫu nhiên trong các món phù hợp. Chưa ưng thì quay lại.</p>
        </div>
      </li>
      <li data-reveal>
        <div class="step-card">
          <span class="step-num">3</span>
          <h3>Xem công thức và quán</h3>
          <p>Mỗi món có nguyên liệu, các bước nấu, dinh dưỡng và vài quán gợi ý để bạn đến thử.</p>
        </div>
      </li>
    </ol>
  </div>
</section>

<!-- 6. CTA -->
<section class="cta-band">
  <div class="container">
    <h2 class="display-font" data-reveal="left">Đói rồi thì quay thôi.</h2>
    <a href="goi-y.html" class="btn btn-light btn-lg" data-reveal>Quay chọn món</a>
  </div>
</section>
""" + result_modal_block()

EXTRA_SCRIPT = """<script src="js/wheel.js"></script>
<script src="js/effects.js"></script>
<script>
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
      '<img src="' + food.image + '" alt="" loading="lazy" onerror="this.style.visibility=\\'hidden\\'">' +
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
  var categories = [
    { key: 'mon-nuoc', label: 'Món nước', cls: 'bento-a' },
    { key: 'com', label: 'Cơm', cls: 'bento-b' },
    { key: 'cuon-tron', label: 'Cuốn và trộn', cls: 'bento-c' },
    { key: 'an-vat', label: 'Ăn vặt', cls: 'bento-d' },
    { key: 'lau-nuong', label: 'Lẩu và nướng', cls: 'bento-e' },
    { key: 'chay', label: 'Đồ chay', cls: 'bento-f' },
    { key: 'trang-mieng', label: 'Tráng miệng', cls: 'bento-g' },
  ];
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
</script>"""

if __name__ == "__main__":
    html = page(
        "Hôm Nay Ăn Gì? Quay một vòng, chốt món ngay",
        'Gợi ý món ăn ngẫu nhiên theo bữa ăn, ngân sách, khẩu vị và chế độ ăn. Món nào cũng có công thức và quán để đến thử.',
        BODY, EXTRA_SCRIPT
    )
    with open(os.path.join(HERE, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("index.html:", len(html), "ky tu")
