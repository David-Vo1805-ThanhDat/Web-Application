/* =========================================================
   main.js — các hàm dùng chung cho MỌI trang
   (chuyển từ Navbar.tsx, Footer.tsx, FoodCard.tsx, ResultModal.tsx, Toast.tsx)
   Yêu cầu thứ tự nhúng script trong HTML:
     1. Bootstrap JS bundle
     2. AOS JS
     3. confetti (canvas-confetti CDN)
     4. data/data.js
     5. js/data-utils.js
     6. js/main.js (file này)
     7. js/wheel.js / js/dice.js (nếu trang có dùng)
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

function updateFavoriteBadge() {
  const badges = document.querySelectorAll('.favorite-count-badge');
  const count = getFavoritesFromStorage().length;
  badges.forEach((b) => {
    b.textContent = count;
    b.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

/* ---------- FoodCard: thẻ món ăn kiểu menu quán (thay FoodCard.tsx) ---------- */
const CATEGORY_LABEL = {
  'mon-nuoc': 'Món nước', 'com': 'Cơm', 'cuon-tron': 'Cuốn và trộn', 'an-vat': 'Ăn vặt',
  'lau-nuong': 'Lẩu và nướng', 'chay': 'Đồ chay', 'trang-mieng': 'Tráng miệng',
};
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

/* ---------- Result Modal (thay ResultModal.tsx) ----------
   Yêu cầu HTML trang phải có sẵn 1 khối modal Bootstrap với id="resultModal"
   và các phần tử con id: resultImage, resultRegionCat, resultName, resultEnglishName,
   resultTime, resultCalories, resultDescription, resultTags,
   resultDetailLink, resultFavoriteBtn, resultSpinAgainBtn                         */
let currentResultFood = null;

function showResultModal(food, onSpinAgain) {
  currentResultFood = food;
  const resultImg = document.getElementById('resultImage');
  resultImg.style.visibility = '';
  resultImg.onerror = function () { resultImg.style.visibility = 'hidden'; };
  resultImg.src = food.image;
  document.getElementById('resultRegionCat').textContent = food.region + ' • ' + (CATEGORY_LABEL[food.category] || food.category);
  document.getElementById('resultName').textContent = food.name;
  document.getElementById('resultEnglishName').textContent = food.englishName;
  document.getElementById('resultTime').textContent = food.cookTimeMinutes + ' phút';
  document.getElementById('resultCalories').textContent = food.calories + ' kcal';
  document.getElementById('resultDescription').textContent = food.description;
  document.getElementById('resultDetailLink').href = 'chi-tiet-mon-an.html?id=' + food.id;

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
    showResultModal(food, onSpinAgain); // vẽ lại để cập nhật trạng thái nút
  };

  const spinAgainBtn = document.getElementById('resultSpinAgainBtn');
  spinAgainBtn.onclick = function () {
    const modalEl = document.getElementById('resultModal');
    bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    if (typeof onSpinAgain === 'function') onSpinAgain();
  };

  const modalEl = document.getElementById('resultModal');
  bootstrap.Modal.getOrCreateInstance(modalEl).show();

  // Hiệu ứng confetti (giữ nguyên thư viện canvas-confetti bản CDN)
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F97316', '#F59E0B', '#EF4444', '#22A559', '#FFFFFF'],
    });
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
