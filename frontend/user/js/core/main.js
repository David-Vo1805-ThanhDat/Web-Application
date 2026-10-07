/* =========================================================
   main.js — các hàm dùng chung cho MỌI trang
   (chuyển từ Navbar.tsx, Footer.tsx, FoodCard.tsx, ResultModal.tsx, Toast.tsx)
   Yêu cầu thứ tự nhúng script trong HTML:
     1. Bootstrap JS bundle
     2. AOS JS
     3. confetti (canvas-confetti CDN)
     4. backend/api/public/foods.php (MySQL catalog)
     5. js/core/sync.js, rồi js/core/data-utils.js
     6. js/core/health.js (hồ sơ sức khỏe, nhật ký, lịch sử món ăn — showResultModal gọi logFoodHistory)
     7. js/core/main.js (file này)
     8. js/core/auth.js
     9. js/widgets/*.js (wheel, mystery-box, effects — nếu trang có dùng), rồi js/pages/<trang>.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  initAOS();
  initNavbar();
  updateFavoriteBadge();
});

/* ---------- AOS ---------- */
function initAOS() {
  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 700, once: true, offset: 60 });
  }
}

/* ---------- Navbar: active link + đổi nền khi cuộn + mobile menu ---------- */
function initNavbar() {
  const navbar = document.querySelector('.site-navbar');
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.site-navbar .nav-link[data-page]').forEach((link) => {
    if (link.getAttribute('data-page') === currentPath) {
      link.classList.add('active');
    }
  });

  initAnchorNavSpy();

  if (navbar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 40) {
        navbar.classList.add('shadow-sm');
      } else {
        navbar.classList.remove('shadow-sm');
      }
    });
  }

  window.addEventListener('favorites-updated', updateFavoriteBadge);
  window.addEventListener('storage', updateFavoriteBadge);
}

/* ---------- Menu neo cuộn của trang chủ ngoài (index.html): Trang Chủ / Giới Thiệu / Liên Hệ
   không phải 3 trang riêng nữa mà là 3 đoạn trong cùng 1 trang — ô tô sáng (active) phải tắt
   ở mục cũ và bật ở mục đang xem, dù bấm menu hay tự cuộn tay. Trên các trang khác (navbar
   "app") không có link #gioi-thieu/#lien-he nên hàm này tự bỏ qua, không làm gì cả.

   Dùng vị trí cuộn thật (getBoundingClientRect) thay vì IntersectionObserver: web này có
   "scroll-behavior: smooth" toàn trang, nghĩa là bấm 1 link là cuộn LƯỚT QUA các đoạn ở giữa
   (vd. bấm "Giới Thiệu" thì lướt ngang qua đoạn "Liên Hệ" trước khi tới nơi) — IntersectionObserver
   bắn sự kiện theo ngưỡng giao nhau nên dễ bắt trúng đúng lúc đang lướt ngang giữa chừng rồi
   dừng cập nhật, kẹt lại sai đoạn. Tính lại theo vị trí thật mỗi lần cuộn thì luôn ra đúng kết
   quả cuối cùng khi cuộn dừng hẳn, dù đang lướt qua đoạn nào ở giữa. ---------- */
function initAnchorNavSpy() {
  const homeLink = document.querySelector('.site-navbar .nav-link[data-page="index.html"]');
  const gioiThieuLink = document.querySelector('.site-navbar .nav-link[href*="#gioi-thieu"]');
  const lienHeLink = document.querySelector('.site-navbar .nav-link[href*="#lien-he"]');
  const sections = [
    { link: homeLink, el: null }, // đầu trang = Trang Chủ, không có mốc riêng
    { link: lienHeLink, el: document.getElementById('lien-he') },
    { link: gioiThieuLink, el: document.getElementById('gioi-thieu') },
  ].filter((s) => s.link);
  if (sections.length < 2) return; // trang không dùng menu neo (vd. các trang app khác)

  function setActive(link) {
    sections.forEach((s) => s.link.classList.remove('active'));
    if (link) link.classList.add('active');
  }

  const navEl = document.querySelector('.site-navbar');
  function navOffset() {
    // Lấy chiều cao NAV THẬT SỰ lúc này thay vì số cố định — thanh nav di động khi xổ ra (menu
    // mở) cao hơn hẳn lúc thu gọn, số cố định sẽ tính sai đoạn nào đang "vừa lộ ra khỏi nav".
    return (navEl ? navEl.getBoundingClientRect().height : 72) + 20;
  }
  function updateActive() {
    // Đoạn cuối cùng (Giới Thiệu, nằm trong footer) có thể NGẮN HƠN chiều cao khung nhìn, nên
    // dù cuộn hết cỡ vẫn không kéo được mép trên của nó lên tới navOffset() — phải bắt riêng
    // trường hợp "đã cuộn chạm đáy trang" và luôn tính là đang xem đoạn cuối cùng.
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    if (atBottom) { setActive(sections[sections.length - 1].link); return; }
    const offset = navOffset();
    let current = sections[0].link;
    sections.forEach((s) => {
      if (s.el && s.el.getBoundingClientRect().top <= offset) current = s.link;
    });
    setActive(current);
  }

  let ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { updateActive(); ticking = false; });
  }, { passive: true });

  // Mở/đóng menu di động (navbar-toggler) đẩy nội dung bên dưới dịch xuống/lên mà KHÔNG bắn
  // sự kiện scroll — nếu đang đứng ở cuối trang lúc mở menu, cần tính lại thì mới không bị kẹt
  // sáng nhầm mục cũ.
  const navMenu = document.getElementById('navMenu');
  if (navMenu) {
    navMenu.addEventListener('shown.bs.collapse', updateActive);
    navMenu.addEventListener('hidden.bs.collapse', updateActive);
  }

  // Bấm là tô sáng ngay lập tức, không cần đợi cuộn xong (phản hồi tức thì); sự kiện scroll ở
  // trên vẫn tiếp tục chạy suốt lúc cuộn và tự chỉnh lại đúng nếu cần.
  sections.forEach((s) => s.link.addEventListener('click', function () { setActive(s.link); }));

  updateActive(); // trạng thái ban đầu (vd. tải thẳng vào index.html#lien-he từ trang khác)
}

function updateFavoriteBadge() {
  const badges = document.querySelectorAll('.favorite-count-badge');
  const count = getFavoritesFromStorage().length;
  badges.forEach((b) => {
    b.textContent = count;
    b.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

/* ---------- FoodCard: thẻ món ăn kiểu menu quán (thay FoodCard.tsx) ---------- */
const REGION_KEY = { 'Bắc': 'bac', 'Trung': 'trung', 'Nam': 'nam', 'Quốc tế': 'quocte' };

function renderFoodCard(food) {
  const isFav = getFavoritesFromStorage().includes(food.id);
  const detailUrl = 'chi-tiet-mon-an.html?id=' + food.id;

  return `
  <div class="col">
    <article class="food-card">
      <div class="food-card-media">
        <img src="${food.image}" alt="" loading="lazy" onerror="this.style.display='none'">
        <span class="food-tag" data-region="${REGION_KEY[food.region] || 'bac'}">${food.region}</span>
        ${food.popular ? '<span class="food-hot">Được chọn nhiều</span>' : ''}
        <button type="button" class="food-fav ${isFav ? 'is-fav' : ''}" aria-pressed="${isFav}"
                aria-label="${isFav ? 'Bỏ' : 'Lưu'} ${food.name} ${isFav ? 'khỏi' : 'vào'} món yêu thích"
                onclick="event.preventDefault(); handleFavoriteClick('${food.id}', this)">
          <i class="bi ${isFav ? 'bi-heart-fill' : 'bi-heart'}"></i>
        </button>
      </div>
      <div class="food-card-body">
        <h3 class="food-card-title"><a href="${detailUrl}" class="stretched-link">${food.name}</a></h3>
        <p class="food-card-en">${food.englishName}</p>
        <ul class="food-card-meta">
          <li><i class="bi bi-star-fill"></i> ${food.rating} (${food.reviewCount})</li>
          <li><i class="bi bi-clock"></i> ${food.cookTimeMinutes} phút</li>
          <li><i class="bi bi-fire"></i> ${food.calories} kcal</li>
        </ul>
      </div>
    </article>
  </div>`;
}

function handleFavoriteClick(id, btnEl) {
  const nowFav = toggleFavoriteInStorage(id);
  const icon = btnEl.querySelector('i');
  btnEl.classList.toggle('is-fav', nowFav);
  btnEl.setAttribute('aria-pressed', String(nowFav));
  icon.classList.toggle('bi-heart-fill', nowFav);
  icon.classList.toggle('bi-heart', !nowFav);
  showToast(nowFav ? 'success' : 'info', nowFav ? 'Đã lưu vào món yêu thích' : 'Đã bỏ khỏi món yêu thích');
}

/* ---------- Tiếng pháo giấy (confetti) tổng hợp bằng Web Audio API ----------
   Không cần file âm thanh ngoài: 1 tiếng "bụp" bật ra (nhiễu tần cao đổ nhanh) kèm vài tiếng
   lấp lánh cao vút so le nhau, mô phỏng cảm giác pháo giấy bung ra + giấy màu bay lất phất.
   Dùng chung 1 AudioContext, hâm nóng sẵn để không làm khựng nhịp hiệu ứng confetti. */
let confettiAudioCtx = null;
function confettiAudio() {
  if (!confettiAudioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    confettiAudioCtx = new Ctx();
  }
  if (confettiAudioCtx.state === 'suspended') confettiAudioCtx.resume();
  return confettiAudioCtx;
}
confettiAudio(); // hâm nóng ngay khi trang tải xong
function playConfettiSound() {
  if (typeof WheelSound !== 'undefined' && !WheelSound.isEnabled()) return; // người dùng đã tắt loa (nút cạnh vòng quay)
  try {
    const ctx = confettiAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime;

    // tiếng "bụp" bật ra
    const n = Math.floor(ctx.sampleRate * 0.12);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) { const k = 1 - i / n; data[i] = (Math.random() * 2 - 1) * k * k; }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t0);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
    noise.connect(filter).connect(noiseGain).connect(ctx.destination);
    noise.start(t0); noise.stop(t0 + 0.12);

    // vài tiếng lấp lánh cao vút, so le nhau như giấy màu bay
    [1400, 1760, 2093, 2637].forEach(function (freq, i) {
      const start = t0 + 0.03 + i * 0.045;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.16, start + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      osc.connect(g).connect(ctx.destination);
      osc.start(start); osc.stop(start + 0.24);
    });
  } catch (e) { /* trình duyệt chặn audio thì thôi, không chặn hiệu ứng */ }
}

/* ---------- Google Maps ----------
   Liên kết tìm kiếm của Google Maps: mở thẳng ô tìm kiếm với đúng từ khoá (tên món / tên quán). Google Maps tự dùng vị trí của
   người dùng để xếp quán gần họ (app điện thoại dùng GPS; máy tính hỏi quyền hoặc dùng vị trí ước lượng) — nên KHÔNG cần xin quyền
   vị trí trước ở web mình. Riêng nút "gần vị trí của tôi" mới xin quyền (chỉ khi người dùng chủ động bấm) để đặt tâm bản đồ tại đó. */
function googleMapsUrl(query, coords) {
  if (coords) return 'https://www.google.com/maps/search/' + encodeURIComponent(query) + '/@' + coords.lat.toFixed(6) + ',' + coords.lng.toFixed(6) + ',15z';
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
}

function openMapsNearMe(query) {
  // Mở tab trắng NGAY trong cú bấm (không thì trình duyệt chặn cửa sổ mở sau khi chờ xin quyền vị trí), rồi điền địa chỉ sau
  const tab = window.open('', '_blank');
  if (tab) tab.opener = null;
  const go = function (url) { if (tab) tab.location.href = url; else window.location.href = url; };
  if (!navigator.geolocation) { go(googleMapsUrl(query)); return; }
  navigator.geolocation.getCurrentPosition(
    function (pos) { go(googleMapsUrl(query, { lat: pos.coords.latitude, lng: pos.coords.longitude })); },
    function () {
      showToast('info', 'Không lấy được vị trí của bạn, mở Google Maps bình thường nhé');   // từ chối / hết giờ / bị chặn
      go(googleMapsUrl(query));
    },
    { timeout: 8000, maximumAge: 300000 }
  );
}

/* ---------- Result Modal (thay ResultModal.tsx) ----------
   Yêu cầu HTML trang phải có sẵn 1 khối modal Bootstrap với id="resultModal"
   và các phần tử con id: resultImage, resultRegionCat, resultName, resultEnglishName,
   resultTime, resultCalories, resultDescription, resultTags,
   resultDetailLink, resultFavoriteBtn, resultSpinAgainBtn                         */
let currentResultFood = null;

function showResultModal(food, onSpinAgain, opts) {
  opts = opts || {};
  currentResultFood = food;
  const resultImg = document.getElementById('resultImage');
  resultImg.style.visibility = '';
  resultImg.onerror = function () { resultImg.style.visibility = 'hidden'; };
  resultImg.src = food.image;
  document.getElementById('resultRegionCat').textContent = food.region + ' • ' + categoryLabel(food.category);
  document.getElementById('resultName').textContent = food.name;
  document.getElementById('resultEnglishName').textContent = food.englishName;
  document.getElementById('resultTime').textContent = food.cookTimeMinutes + ' phút';
  document.getElementById('resultCalories').textContent = food.calories + ' kcal';
  document.getElementById('resultDescription').textContent = food.description;
  document.getElementById('resultDetailLink').href = 'chi-tiet-mon-an.html?id=' + food.id;
  const mapsLink = document.getElementById('resultMapsLink');
  if (mapsLink) {
    mapsLink.href = googleMapsUrl(food.name);                       // ô tìm kiếm của Google Maps tự điền đúng tên món
    mapsLink.title = 'Mở Google Maps, tìm: ' + food.name;
  }
  const mapsNear = document.getElementById('resultMapsNear');
  if (mapsNear) mapsNear.onclick = function () { openMapsNearMe(food.name); };

  const nominator = document.getElementById('resultNominator');
  if (nominator) {
    nominator.textContent = food.nominatedBy ? food.nominatedBy + ' đề cử món này' : '';
    nominator.classList.toggle('d-none', !food.nominatedBy);
  }
  const shareBtn = document.getElementById('resultShareBtn');
  if (shareBtn) {
    shareBtn.onclick = function () {
      const url = new URL('chi-tiet-mon-an.html?id=' + food.id, window.location.href).href;
      const text = 'Hôm nay ăn: ' + food.name +
        (food.nominatedBy ? ', ' + food.nominatedBy + ' đề cử' : '') + '.\nXem quán và công thức: ' + url;
      copyText(text).then(
        function () { showToast('success', 'Đã sao chép, dán vào nhóm chat là xong'); },
        function () { showToast('error', 'Không sao chép được, bạn hãy chép tay nhé'); }
      );
    };
  }

  const tagsWrap = document.getElementById('resultTags');
  tagsWrap.innerHTML = food.tags.map((t) => `<span class="badge bg-light text-dark border">#${t}</span>`).join(' ');

  const favBtn = document.getElementById('resultFavoriteBtn');
  const isFav = getFavoritesFromStorage().includes(food.id);
  favBtn.innerHTML = isFav
    ? '<i class="bi bi-heart-fill text-danger"></i> Đã lưu'
    : '<i class="bi bi-heart"></i> Lưu món';
  favBtn.onclick = function () {
    toggleFavoriteInStorage(food.id);
    showResultModal(food, onSpinAgain, opts); // vẽ lại để cập nhật trạng thái nút, giữ nguyên opts (vd: không bắn lại pháo giấy)
  };

  const spinAgainBtn = document.getElementById('resultSpinAgainBtn');
  spinAgainBtn.onclick = function () {
    const modalEl = document.getElementById('resultModal');
    bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    if (typeof onSpinAgain === 'function') onSpinAgain();
  };

  const modalEl = document.getElementById('resultModal');
  bootstrap.Modal.getOrCreateInstance(modalEl).show();

  // Ghi lại vào Lịch Sử Món Đã Chọn (xem js/core/health.js) để Nhật Ký Sức Khỏe đối chiếu được
  if (typeof logFoodHistory === 'function') logFoodHistory(food);

  // Hiệu ứng confetti (giữ nguyên thư viện canvas-confetti bản CDN) — bỏ qua khi opts.confetti === false
  // (ví dụ: kết quả từ trò hộp quà bí ẩn đã có hiệu ứng mở hộp riêng, không cần pháo giấy thêm nữa).
  if (opts.confetti !== false && typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F97316', '#F59E0B', '#EF4444', '#22A559', '#FFFFFF'],
    });
    playConfettiSound();
  }
}

/* ---------- Sao chép văn bản (dùng cho nút gửi cả nhóm) ---------- */
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  return new Promise(function (resolve, reject) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    ok ? resolve() : reject();
  });
}

/* ---------- Toast (thay Toast.tsx bằng Bootstrap Toast) ----------
   Yêu cầu HTML trang phải có sẵn khối:
   <div class="toast-container position-fixed bottom-0 end-0 p-3">
     <div id="appToast" class="toast" role="alert"><div class="toast-body" id="appToastBody"></div></div>
   </div>                                                                          */
function showToast(type, message) {
  const toastEl = document.getElementById('appToast');
  if (!toastEl) { console.log(message); return; }
  const body = document.getElementById('appToastBody');
  const icons = { success: '✅', error: '⚠️', info: 'ℹ️' };
  body.innerHTML = (icons[type] || '') + ' ' + message;
  bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3000 }).show();
}
