/* pages/index.js — logic riêng của trang index.html (nạp sau js/core và js/widgets). */
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('statFoods').textContent = allFoods.length + '+';

  /* Nếu đã đăng nhập sẵn (ví dụ bấm logo quay lại trang này) thì nút đăng ký
     (navbar, hero, băng CTA) đổi thành "Vào Trang Chủ"; các đường dẫn/nút
     đăng nhập kèm theo (navbar, "Đã có tài khoản?...") ẩn đi vì thừa. */
  if (typeof getCurrentUser === 'function' && getCurrentUser()) {
    document.querySelectorAll('a[href="dang-ky.html"]').forEach(function (a) {
      a.href = 'trang-chu.html';
      a.innerHTML = '<i class="bi bi-egg-fried"></i> Vào Trang Chủ';
    });
    document.querySelectorAll('a[href="dang-nhap.html"]').forEach(function (a) {
      var wrap = a.closest('.hero-signin, .cta-signin');
      if (wrap) wrap.style.display = 'none'; else a.style.display = 'none';
    });
  }

  /* ---- Form Liên Hệ (gộp từ trang lien-he.html cũ) ---- */
  if (typeof getCurrentUser === 'function') {
    var cfUser = getCurrentUser();
    if (cfUser) {
      document.getElementById('cfName').value = cfUser.name;
      document.getElementById('cfEmail').value = cfUser.email;
    }
  }
  var subjectSelect = document.getElementById('cfSubject');
  var dishGroup = document.getElementById('dishNameGroup');
  subjectSelect.addEventListener('change', function () {
    dishGroup.classList.toggle('d-none', subjectSelect.value !== 'de-xuat-mon');
  });
  var contactForm = document.getElementById('contactForm');
  var cfSubmitBtn = document.getElementById('cfSubmitBtn');
  var cfSubmitLabel = document.getElementById('cfSubmitLabel');
  var cfError = document.getElementById('cfError');
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var message = document.getElementById('cfMessage').value.trim();
    var dishName = document.getElementById('cfDishName').value.trim();
    var email = document.getElementById('cfEmail').value.trim();
    var isDishSubject = subjectSelect.value === 'de-xuat-mon';
    if (!message || !email || (isDishSubject && !dishName)) {
      cfError.classList.remove('d-none');
      return;
    }
    cfError.classList.add('d-none');
    cfSubmitBtn.disabled = true;
    cfSubmitLabel.textContent = 'Đang gửi...';
    function finish() { cfSubmitBtn.disabled = false; cfSubmitLabel.textContent = 'Gửi Lời Nhắn'; }
    // Có backend PHP → góp ý được lưu để quản trị viên xem ở trang "Đánh giá & góp ý"; không kết nối được backend thì báo lỗi (không giả lập gửi thành công)
    Backend.available().then(function (online) {
      if (!online) throw new Error(Backend.OFFLINE_MESSAGE);
      return Backend.sendFeedback({
        name: document.getElementById('cfName').value.trim(), email: email, subject: subjectSelect.value,
        message: (isDishSubject ? 'Món đề xuất: ' + dishName + '\n' : '') + message,
      });
    }).then(function () {
      finish();
      contactForm.reset();
      dishGroup.classList.add('d-none');
      showToast('success', '🎉 Cảm ơn bạn đã liên hệ! Đội ngũ sẽ xem xét và phản hồi sớm nhất.');
    }).catch(function (err) {
      finish();
      showToast('error', err.message);
    });
  });

  /* ---- LƯỚT THẺ MÓN kiểu Tinder ở hero: vuốt (chuột/tay đều được) hoặc bấm nút
     ❤️/✕. Không cần đăng nhập để lướt, nhưng "gợi ý đầy đủ theo gu" thì khoá
     lại sau khi lướt hết để mời đăng ký. ---- */
  var swipeStage = document.getElementById('swipeStage');
  if (swipeStage) {
    var swipeDeck = document.getElementById('swipeDeck');
    var swipeControls = document.getElementById('swipeControls');
    var swipeCounter = document.getElementById('swipeCounter');
    var swipeResult = document.getElementById('swipeResult');
    var swipeLikeCount = document.getElementById('swipeLikeCount');
    var swipeResultChips = document.getElementById('swipeResultChips');
    var hintLike = swipeStage.querySelector('.swipe-hint-like');
    var hintNope = swipeStage.querySelector('.swipe-hint-nope');
    var DECK_SIZE = 6;
    var THROW_DISTANCE = 90; // px kéo tối thiểu để tính là vuốt thật

    var cards = [];    // [{ food, el }], phần tử 0 là thẻ trên cùng hiện tại
    var current = 0;
    var liked = [];

    function layoutDeck() {
      cards.forEach(function (c, i) {
        var rel = i - current;
        if (rel < 0) { c.el.style.display = 'none'; return; }
        c.el.style.display = '';
        c.el.style.zIndex = String(50 - rel);
        if (rel === 0) {
          c.el.style.transition = 'none';
          c.el.style.opacity = '1';
          c.el.style.transform = 'translate(0, 0) rotate(0deg)';
        } else {
          c.el.style.transition = 'transform .25s ease, opacity .25s ease';
          c.el.style.opacity = rel > 2 ? '0' : '1';
          c.el.style.transform = 'translateY(' + rel * 10 + 'px) scale(' + Math.max(1 - rel * 0.045, 0.85) + ')';
        }
      });
      swipeCounter.textContent = Math.min(current + 1, cards.length) + '/' + cards.length;
    }

    function buildCardEl(food) {
      var el = document.createElement('div');
      el.className = 'swipe-card-item';
      el.innerHTML =
        '<img src="' + food.image + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' +
        '<span class="swipe-card-overlay" aria-hidden="true"></span>' +
        '<span class="swipe-card-tag">' + food.region + '</span>' +
        '<div class="swipe-card-info"><h3>' + food.name + '</h3>' +
        '<p><i class="bi bi-star-fill"></i> ' + food.rating + ' &middot; <i class="bi bi-clock"></i> ' + food.cookTimeMinutes + ' phút</p></div>';
      return el;
    }

    function showResult() {
      swipeStage.classList.add('d-none');
      swipeControls.classList.add('d-none');
      swipeLikeCount.textContent = liked.length;
      swipeResultChips.innerHTML = liked.length
        ? liked.map(function (f) { return '<span class="swipe-chip">' + f.name + '</span>'; }).join('')
        : '<span class="swipe-chip swipe-chip-muted">Chưa thích món nào cả, lướt lại xem sao!</span>';
      swipeResult.classList.remove('d-none');
    }

    function decide(dir) {
      var card = cards[current];
      if (!card) return;
      if (dir === 'like') liked.push(card.food);
      card.el.style.transition = 'transform .35s ease, opacity .35s ease';
      card.el.style.transform = 'translate(' + (dir === 'like' ? '160%' : '-160%') + ', -6%) rotate(' + (dir === 'like' ? 20 : -20) + 'deg)';
      card.el.style.opacity = '0';
      current++;
      if (current >= cards.length) { setTimeout(showResult, 220); } else { layoutDeck(); }
    }

    function bindDrag(card) {
      var el = card.el;
      var startX = 0, startY = 0, dx = 0, dragging = false;
      el.addEventListener('pointerdown', function (e) {
        if (cards[current] !== card) return;
        dragging = true; dx = 0;
        startX = e.clientX; startY = e.clientY;
        el.style.transition = 'none';
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
      });
      el.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        dx = e.clientX - startX;
        var dy = (e.clientY - startY) * 0.15;
        el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (dx / 14) + 'deg)';
        hintLike.style.opacity = dx > 24 ? String(Math.min(dx / 100, 1)) : '0';
        hintNope.style.opacity = dx < -24 ? String(Math.min(-dx / 100, 1)) : '0';
      });
      function endDrag() {
        if (!dragging) return;
        dragging = false;
        hintLike.style.opacity = '0';
        hintNope.style.opacity = '0';
        if (dx > THROW_DISTANCE) { decide('like'); }
        else if (dx < -THROW_DISTANCE) { decide('nope'); }
        else { el.style.transition = 'transform .3s ease'; el.style.transform = 'translate(0,0) rotate(0deg)'; }
      }
      el.addEventListener('pointerup', endDrag);
      el.addEventListener('pointercancel', endDrag);
    }

    function buildDeck() {
      swipeDeck.innerHTML = '';
      cards = [];
      current = 0;
      liked = [];
      swipeResult.classList.add('d-none');
      swipeStage.classList.remove('d-none');
      swipeControls.classList.remove('d-none');
      var foods = allFoods.slice().sort(function () { return 0.5 - Math.random(); }).slice(0, DECK_SIZE);
      foods.forEach(function (food) {
        var el = buildCardEl(food);
        swipeDeck.appendChild(el);
        var card = { food: food, el: el };
        cards.push(card);
        bindDrag(card);
      });
      layoutDeck();
    }

    document.getElementById('swipeLikeBtn').addEventListener('click', function () { decide('like'); });
    document.getElementById('swipeNopeBtn').addEventListener('click', function () { decide('nope'); });
    document.getElementById('swipeReplayBtn').addEventListener('click', buildDeck);

    buildDeck();
  }

  /* ---- chip đầu trang đổi chữ cho vui, không cần hiệu ứng chuột ---- */
  var chipEl = document.getElementById('chipText');
  if (chipEl) {
    var chipPhrases = ['🌅 Sáng ăn gì ta?', '🍜 Trưa nay thèm gì?', '🌙 Tối nay ăn chi đây?', '🎯 Để tụi mình lo hết!'];
    var chipReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var chipI = 0;
    setInterval(function () {
      chipI = (chipI + 1) % chipPhrases.length;
      if (chipReduce) { chipEl.textContent = chipPhrases[chipI]; return; }
      chipEl.style.opacity = '0';
      setTimeout(function () { chipEl.textContent = chipPhrases[chipI]; chipEl.style.opacity = '1'; }, 220);
    }, 2600);
  }

  /* ---- poster món ăn chạy ngang: 2 hàng, chiều ngược nhau ---- */
  function poster(food, hidden) {
    return '<a class="poster-card" href="dang-ky.html"' + (hidden ? ' tabindex="-1"' : '') + '>' +
      '<img src="' + food.image + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' +
      '<span class="poster-overlay"></span>' +
      '<span class="poster-tag" data-region="' + (REGION_KEY_LANDING[food.region] || 'bac') + '">' + food.region + '</span>' +
      '<span class="poster-info"><span class="poster-name">' + food.name + '</span>' +
      '<span class="poster-meta"><i class="bi bi-star-fill"></i> ' + food.rating + '</span></span>' +
      '</a>';
  }
  var REGION_KEY_LANDING = { 'Bắc': 'bac', 'Trung': 'trung', 'Nam': 'nam', 'Quốc tế': 'quocte' };
  function buildPosterStrip(el, foods, reverse) {
    var visible = foods.map(function (f) { return poster(f, false); }).join('');
    var copy = foods.map(function (f) { return poster(f, true); }).join('');
    el.innerHTML = '<div class="poster-track' + (reverse ? ' is-reverse' : '') + '">' +
      '<div class="poster-group">' + visible + '</div>' +
      '<div class="poster-group" aria-hidden="true">' + copy + '</div></div>';
  }
  var shuffled = allFoods.slice().sort(function (a, b) { return b.rating - a.rating; });
  var half = Math.ceil(shuffled.length / 2);
  buildPosterStrip(document.getElementById('posterA'), shuffled.slice(0, half), false);
  buildPosterStrip(document.getElementById('posterB'), shuffled.slice(half).concat(shuffled.slice(0, 3)), true);
});
