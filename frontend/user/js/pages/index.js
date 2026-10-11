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

  /* ---- VIDEO GIỚI THIỆU: bấm nút tròn mới tải + phát (preload="none" cho trang nhẹ). Khi video phát thì
     tạm dừng nhạc nền (BgMusic.hold trong js/widgets/bg-music.js), dừng/hết video thì nhạc phát lại. ---- */
  var demoVideo = document.getElementById('demoVideo');
  if (demoVideo) {
    var demoPlay = document.getElementById('demoPlay');
    var demoWrap = demoVideo.closest('.demo-video');
    var holdMusic = function (on) { if (window.BgMusic) window.BgMusic.hold(on); };
    demoPlay.addEventListener('click', function () {
      demoVideo.controls = true;
      demoVideo.play();
    });
    // Danh sách chương bên trái: bấm → tua tới đoạn đó và phát; chương đang xem được tô sáng
    var chapters = Array.prototype.slice.call(document.querySelectorAll('#demoChapters button'));
    chapters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var at = parseFloat(btn.dataset.t);
        demoVideo.controls = true;
        if (demoVideo.readyState >= 1) demoVideo.currentTime = at;
        else demoVideo.addEventListener('loadedmetadata', function () { demoVideo.currentTime = at; }, { once: true });
        demoVideo.play();
      });
    });
    demoVideo.addEventListener('timeupdate', function () {
      var t = demoVideo.currentTime, cur = null;
      chapters.forEach(function (btn) { if (t >= parseFloat(btn.dataset.t) - 0.1) cur = btn; });
      chapters.forEach(function (btn) { btn.classList.toggle('is-current', btn === cur && !demoVideo.paused); });
    });
    demoVideo.addEventListener('play', function () { demoWrap.classList.add('is-playing'); holdMusic(true); });
    demoVideo.addEventListener('pause', function () { holdMusic(false); });
    demoVideo.addEventListener('ended', function () {
      demoWrap.classList.remove('is-playing');
      demoVideo.controls = false;
      demoVideo.load(); // về lại ảnh bìa, bấm nút tròn để xem lại
    });
  }

  /* Form Liên Hệ cũ đã chuyển thành hộp thoại "Góp ý & liên hệ" dùng chung (js/widgets/feedback.js). */

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

    /* ---- FoodBot bình luận theo từng lần lướt (câu viết sẵn, không gọi AI) ---- */
    var botText = document.getElementById('swipeBotText');
    var BOT_HELLO = 'Kéo thẻ sang phải nếu thích, sang trái nếu không nha. Lướt hết ' + DECK_SIZE + ' món là mình đoán ra gu bạn liền!';
    var LIKE_BY_CATEGORY = {
      'mon-nuoc': ['Ồ, team nước lèo hả? Húp một tô là hết buồn 😋', 'Món nước nè, chuẩn gu người Việt luôn 🍜'],
      'com': ['Cơm là chân ái, ăn hoài không chán 🍚', 'Hội cơm tấm cơm niêu điểm danh! 🙋'],
      'an-vat': ['Mê ăn vặt nè! Mình cũng ghiền mấy món này 🍢', 'Ăn vặt là phải có, buồn miệng xíu là thèm 😆'],
      'cuon-tron': ['Cuốn cuốn chấm chấm, thanh mát ghê 🥢', 'Đồ cuốn đồ trộn, nhẹ bụng mà vẫn đã 😌'],
      'lau-nuong': ['Lẩu nướng là phải rủ cả đám đi liền 🔥', 'Nghe mùi khói nướng là thấy vui rồi 🍖'],
      'chay': ['Ăn xanh sống lành, bạn healthy quá trời 🥗', 'Món chay mà ngon thì ai cũng mê 🌱'],
      'trang-mieng': ['Hệ ngọt ngào đây rồi 🧋', 'Ăn xong phải có chút ngọt mới trọn bữa 🍮'],
    };
    var LIKE_SPICY = ['Chịu cay giỏi ha! Mình phục 🌶️', 'Cay xè mà vẫn thích, đúng dân sành ăn 🔥'];
    var NOPE_SPICY = ['Né cay hả, để mình ghi nhớ nha 🌶️❌', 'Sợ cay thì mình tránh món cay cho bạn 😉'];
    var NOPE_PRICEY = ['Món này hơi chát ví ha, hiểu mà 💸'];
    var NOPE_ANY = ['Không hợp gu à, qua món khác nè 👉', 'Ok bỏ qua, mình còn nhiều món lắm!', 'Hmm, khó tính ghê ta 😆', 'Chưa ưng à? Món sau chắc chắn hợp hơn 🤞'];
    var LAST_CARD = ['Còn 1 món nữa thôi, mình sắp đoán ra gu bạn rồi 👀'];

    function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
    function isSpicy(food) { return (food.taste || []).some(function (t) { return t === 'cay' || t === 'chua-cay'; }); }
    function botSay(text) {
      if (!botText) return;
      botText.classList.remove('is-new'); void botText.offsetWidth;   // chạy lại hiệu ứng "nảy" mỗi câu mới
      botText.textContent = text;
      botText.classList.add('is-new');
    }
    function reactTo(food, dir) {
      if (dir === 'like') {
        if (isSpicy(food) && Math.random() < 0.6) return pick(LIKE_SPICY);
        return pick(LIKE_BY_CATEGORY[food.category] || ['Ngon đó nha, mình ghi nhận rồi 😋']);
      }
      if (isSpicy(food)) return pick(NOPE_SPICY);
      if (food.price >= 120000 && Math.random() < 0.7) return pick(NOPE_PRICEY);
      return pick(NOPE_ANY);
    }

    /* ---- "Gu ăn của bạn" sau khi lướt hết: danh mục được thả tim nhiều nhất → danh hiệu ---- */
    var GU_BY_CATEGORY = {
      'mon-nuoc': ['nuoc-leo', 'Team Nước Lèo Chính Hiệu', 'Sáng phở, trưa bún, tối hủ tiếu, miễn có nước lèo nóng hổi là bạn vui.'],
      'com': ['com', 'Hội Cơm Là Chân Ái', 'Phải có hột cơm mới gọi là ăn. Bạn chuộng bữa chắc bụng, đậm đà.'],
      'an-vat': ['an-vat', 'Thánh Ăn Vặt', 'Ăn chơi ăn thiệt, bạn là người mở đầu mọi cuộc "đi ăn gì đó đi".'],
      'cuon-tron': ['do-cuon', 'Fan Cứng Đồ Cuốn', 'Thanh mát, nhiều rau, chấm chấm cuốn cuốn. Gu nhẹ nhàng mà tinh tế.'],
      'lau-nuong': ['lau-nuong', 'Chiến Thần Lẩu Nướng', 'Đi ăn là phải đông vui, có nồi lẩu sôi hoặc bếp nướng xèo xèo.'],
      'chay': ['an-xanh', 'Người Ăn Xanh Sống Lành', 'Bạn thích món nhẹ, nhiều rau, ăn ngon mà người vẫn khỏe re.'],
      'trang-mieng': ['ngot-ngao', 'Hệ Ngọt Ngào', 'Trà sữa, chè, bánh ngọt, bữa nào cũng phải có "món tráng miệng" mới chịu.'],
    };
    var GU_NONE = ['ken-an', 'Người Kén Ăn Bí Ẩn', 'Chưa món nào lọt mắt xanh của bạn! Đăng ký để mình tìm đúng món bạn thèm.'];
    var GU_MIXED = ['da-he', 'Người Ăn Đa Hệ', 'Món gì cũng thử, vùng nào cũng chơi. Bạn đúng là "ăn được hết".'];
    // Ảnh thật từ Wikimedia Commons (frontend/image/icon-ngoai/, nguồn đầy đủ ở NGUON-ANH.md) — CC BY phải ghi tác giả
    var GU_PHOTO_CREDIT = {
      'nuoc-leo': 'Kham Tran · CC BY 3.0', 'com': 'Anna Frodesiak · CC0', 'an-vat': 'PattayaPatrol · CC BY-SA 4.0',
      'do-cuon': 'T.Tseng · CC BY 2.0', 'lau-nuong': 'Akira CA · CC0', 'an-xanh': 'Suyash Dwivedi · CC BY-SA 4.0',
      'ngot-ngao': 'Oqmilteashop · CC BY-SA 3.0', 'da-he': 'Hongkongfoodlover123 · CC BY-SA 4.0', 'ken-an': 'SWT666 · CC BY 4.0',
    };

    function guFor(foods) {
      if (!foods.length) return GU_NONE;
      var count = {};
      foods.forEach(function (f) { count[f.category] = (count[f.category] || 0) + 1; });
      var best = Object.keys(count).sort(function (a, b) { return count[b] - count[a]; });
      // thả tim nhiều món mà không danh mục nào trội hẳn → "đa hệ"
      if (foods.length >= 4 && count[best[0]] === 1) return GU_MIXED;
      return GU_BY_CATEGORY[best[0]] || GU_MIXED;
    }
    // Huy hiệu: [ảnh icon, chữ] — ảnh trong frontend/image/ (icon-ngoai/hh-*.png lấy từ Wikimedia Commons)
    function guBadges(foods) {
      var out = [];
      if (foods.filter(isSpicy).length >= 2) out.push(['icon-ngoai/hh-ot-64.png', 'Chịu cay giỏi']);
      if (foods.filter(function (f) { return (f.dietary || []).indexOf('vegetarian') !== -1; }).length >= 2) out.push(['icon-ngoai/hh-mam-cay-64.png', 'Thích món chay']);
      if (foods.length && foods.every(function (f) { return f.price <= 50000; })) out.push(['icon-ngoai/hh-dong-xu-64.png', 'Ăn ngon giá hạt dẻ']);
      if (foods.length >= DECK_SIZE - 1) out.push(['trai-tim-96.png', 'Dễ tính, món nào cũng mê']);
      return out;
    }

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
        ? liked.map(function (f) { return '<span class="swipe-chip">' + escHtml(f.name) + '</span>'; }).join('')
        : '<span class="swipe-chip swipe-chip-muted">Chưa thích món nào cả, lướt lại xem sao!</span>';
      var gu = guFor(liked);
      document.getElementById('guEmoji').innerHTML = '<img src="../image/icon-ngoai/' + gu[0] + '.jpg" alt="" width="96" height="96">';
      document.getElementById('guCredit').textContent = 'Ảnh: ' + GU_PHOTO_CREDIT[gu[0]] + ' (Wikimedia Commons)';
      document.getElementById('guTitle').textContent = gu[1];
      document.getElementById('guDesc').textContent = gu[2];
      document.getElementById('guBadges').innerHTML = guBadges(liked)
        .map(function (b) { return '<span class="gu-badge"><img src="../image/' + b[0] + '" alt="" width="18" height="18">' + escHtml(b[1]) + '</span>'; }).join('');
      botSay(liked.length ? 'Tèn ten! Mình đoán ra gu của bạn rồi nè 🎉' : 'Khó tính quá nha 😆 Đăng ký đi, mình tìm món hợp gu cho!');
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
      botSay(current === cards.length - 1 && Math.random() < 0.5 ? pick(LAST_CARD) : reactTo(card.food, dir));
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
      botSay(BOT_HELLO);
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
