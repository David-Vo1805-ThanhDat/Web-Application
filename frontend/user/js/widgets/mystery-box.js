/* =========================================================
   mystery-box.js — trò "hộp quà bí ẩn" (túi mù)

   Có bao nhiêu món (candidates) thì có bấy nhiêu hộp — mỗi hộp gắn cố định
   với đúng 1 món ngay khi vẽ ra (không random lại lúc bấm). Bấm vào hộp nào
   thì một khung lớn ở giữa màn hình phóng to hộp đó lên (nền tối lại để lấy
   tiêu điểm), có khẩu súng đồ chơi bên cạnh rung lên đạn rồi BẮN 1 tia năng
   lượng bay sang — hộp NỔ TUNG làm đôi kèm ánh sáng bừng ra + sóng xung kích,
   sau đó thẻ món trúng hiện chồng ngay lên trên hộp vừa nổ (không đóng khung
   lại ngay — xem closeReveal()). Hộp đã mở thì thôi, không mở lại được — nhưng
   hộp khác vẫn mở tiếp được nếu nhóm chưa ưng.

   Hộp quà tự vẽ 100% bằng SVG (không dùng ảnh chụp/AI-gen) nên luôn sắc nét,
   không bao giờ bị lem viền hay mất chi tiết như ảnh cắt nền.

   Cách dùng trong HTML:
     <div id="boxGrid"></div>   (rỗng — JS tự vẽ hộp vào đây)
     <script>
       const box = createBoxGame(document.getElementById('boxGrid'), candidateFoods, function (winner) { ... });
       // box.openRandom()        mở giúp 1 hộp chưa mở bất kỳ (nút quay nhanh trên điện thoại)
       // box.updateCandidates(list)  đổi danh sách món — vẽ lại hộp theo đúng số món mới
       // box.setEnabled(bool)    khoá/mở tất cả hộp chưa mở
       // box.reset()             vẽ lại một bộ hộp mới toàn bộ (dùng khi cả nhóm chưa ưng món nào)
       // box.closeReveal()       đóng khung phóng to lại (gọi khi thẻ kết quả đã đóng xong)
     ========================================================= */

/* Hộp quà tự vẽ bằng SVG — thân hộp, nắp overhang, dải ruy băng chữ thập, nơ trên nắp.
   uid riêng cho id gradient để nhiều hộp trên cùng trang không bị đụng id.
   opened=true vẽ hộp đã mở: chỉ còn thân hộp với miệng tối, không có nắp/nơ. */
function boxSvg(opened, uid) {
  const g = 'bg' + uid;
  const defs =
    '<defs><linearGradient id="' + g + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%" stop-color="var(--brand-400, #FB923C)"/>' +
      '<stop offset="55%" stop-color="var(--brand-500, #F97316)"/>' +
      '<stop offset="100%" stop-color="var(--brand-600, #EA580C)"/>' +
    '</linearGradient></defs>';
  if (opened) {
    return (
      '<svg class="box-icon-svg" viewBox="0 0 100 100" aria-hidden="true">' + defs +
        '<ellipse cx="50" cy="90" rx="28" ry="4" fill="#00000022"/>' +
        '<rect x="16" y="40" width="68" height="46" rx="6" fill="url(#' + g + ')"/>' +
        '<rect x="42" y="40" width="16" height="46" fill="#FFE8CC" opacity=".85"/>' +
        '<rect x="16" y="38" width="68" height="10" rx="4" fill="#00000030"/>' +
      '</svg>'
    );
  }
  return (
    '<svg class="box-icon-svg" viewBox="0 0 100 100" aria-hidden="true">' + defs +
      '<ellipse cx="50" cy="93" rx="30" ry="4" fill="#00000022"/>' +
      '<rect x="16" y="40" width="68" height="46" rx="6" fill="url(#' + g + ')"/>' +
      '<rect x="42" y="40" width="16" height="46" fill="#FFE8CC"/>' +
      '<rect x="10" y="27" width="80" height="17" rx="5" fill="var(--brand-600, #EA580C)"/>' +
      '<rect x="42" y="27" width="16" height="17" fill="#FFE8CC"/>' +
      '<path d="M50,27 C38,15 27,18 33,29 C37,35 46,31 50,27 Z" fill="#FFE8CC"/>' +
      '<path d="M50,27 C62,15 73,18 67,29 C63,35 54,31 50,27 Z" fill="#FFE8CC"/>' +
      '<circle cx="50" cy="28" r="4.5" fill="#FFD79A"/>' +
    '</svg>'
  );
}

/* Chỉ riêng cái nắp (thân trên + ruy băng trên nắp + nơ) — dùng cho lớp bay tung
   ra khi mở hộp trong khung phóng to, tách khỏi phần thân hộp bên dưới. */
function boxLidSvg(uid) {
  const g = 'bl' + uid;
  return (
    '<svg class="box-icon-svg" viewBox="0 0 100 70" aria-hidden="true">' +
      '<defs><linearGradient id="' + g + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="var(--brand-500, #F97316)"/>' +
        '<stop offset="100%" stop-color="var(--brand-700, #C2410C)"/>' +
      '</linearGradient></defs>' +
      '<rect x="10" y="27" width="80" height="17" rx="5" fill="url(#' + g + ')"/>' +
      '<rect x="42" y="27" width="16" height="17" fill="#FFE8CC"/>' +
      '<path d="M50,27 C38,15 27,18 33,29 C37,35 46,31 50,27 Z" fill="#FFE8CC"/>' +
      '<path d="M50,27 C62,15 73,18 67,29 C63,35 54,31 50,27 Z" fill="#FFE8CC"/>' +
      '<circle cx="50" cy="28" r="4.5" fill="#FFD79A"/>' +
    '</svg>'
  );
}

/* Khẩu súng đồ chơi tự vẽ bằng SVG — nòng + báng + vây ngắm màu cam thương hiệu, đặt bên trái
   khung, chĩa mũi súng về phía hộp quà để "bắn nổ" hộp. */
function boxGunSvg(uid) {
  const g = 'gg' + uid;
  return (
    '<svg class="box-icon-svg" viewBox="0 0 120 80" aria-hidden="true">' +
      '<defs><linearGradient id="' + g + '" x1="0%" y1="0%" x2="0%" y2="100%">' +
        '<stop offset="0%" stop-color="#6B7685"/>' +
        '<stop offset="100%" stop-color="#3B4250"/>' +
      '</linearGradient></defs>' +
      '<path d="M20,48 L13,72 L44,72 L39,48 Z" fill="url(#' + g + ')"/>' +
      '<rect x="6" y="26" width="80" height="24" rx="10" fill="url(#' + g + ')"/>' +
      '<rect x="10" y="32" width="22" height="5" rx="2.5" fill="var(--brand-500, #F97316)"/>' +
      '<rect x="64" y="15" width="20" height="14" rx="4" fill="var(--brand-500, #F97316)"/>' +
      '<circle cx="92" cy="38" r="10" fill="#2B3038"/>' +
      '<circle cx="92" cy="38" r="5.5" fill="#12151A"/>' +
    '</svg>'
  );
}

/* Đạn/tia năng lượng bay từ nòng súng tới hộp — 1 quầng sáng tròn kèm vệt mờ phía sau. */
function boxBoltSvg() {
  return (
    '<svg class="box-icon-svg" viewBox="0 0 60 24" aria-hidden="true">' +
      '<ellipse cx="12" cy="12" rx="12" ry="6" fill="#FFE8CC" opacity=".55"/>' +
      '<ellipse cx="30" cy="12" rx="26" ry="4" fill="#FFD79A" opacity=".7"/>' +
      '<circle cx="50" cy="12" r="9" fill="#FFF7ED"/>' +
      '<circle cx="50" cy="12" r="5" fill="var(--brand-500, #F97316)"/>' +
    '</svg>'
  );
}

/* Âm thanh mở hộp tổng hợp bằng Web Audio API — không cần file âm thanh ngoài.
   Dùng chung 1 AudioContext cho cả trang, chỉ tạo khi thật sự cần. */
var boxAudioCtx = null;
function boxAudio() {
  if (!boxAudioCtx) {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    boxAudioCtx = new Ctx();
  }
  if (boxAudioCtx.state === 'suspended') boxAudioCtx.resume();
  return boxAudioCtx;
}
function boxNoiseBuffer(ctx, seconds) {
  const n = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const k = 1 - i / n;
    data[i] = (Math.random() * 2 - 1) * k * k;
  }
  return buf;
}
/* tiếng "bốp" nắp bật tung — 1 tiếng chirp cao vút lên rất nhanh, giống tiếng nút chai/bóng bay */
function playBoxPop() {
  try {
    const ctx = boxAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t0);
    osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.09);
    osc.frequency.exponentialRampToValueAtTime(500, t0 + 0.16);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.0001, t0);
    oscGain.gain.exponentialRampToValueAtTime(0.45, t0 + 0.03);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);
    osc.connect(oscGain).connect(ctx.destination);

    const noise = ctx.createBufferSource();
    noise.buffer = boxNoiseBuffer(ctx, 0.1);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1500;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.28, t0);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
    noise.connect(filter).connect(noiseGain).connect(ctx.destination);

    osc.start(t0); osc.stop(t0 + 0.2);
    noise.start(t0); noise.stop(t0 + 0.1);
  } catch (e) { /* trình duyệt chặn audio thì thôi, không chặn game */ }
}
/* tiếng "xoẹt" nhẹ háo hức ngay trước khi nắp bật, để tạo nhịp chờ */
function playBoxRustle() {
  try {
    const ctx = boxAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = boxNoiseBuffer(ctx, 0.18);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2200;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(t0); noise.stop(t0 + 0.18);
  } catch (e) { /* im lặng nếu bị chặn */ }
}
/* tiếng "pằng" súng bắn — chirp cao vút xuống rất nhanh kiểu súng đồ chơi/laze, kèm tiếng "tách" đanh */
function playGunShot() {
  try {
    const ctx = boxAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1100, t0);
    osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.09);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.22, t0);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
    osc.connect(oscGain).connect(ctx.destination);

    const noise = ctx.createBufferSource();
    noise.buffer = boxNoiseBuffer(ctx, 0.04);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, t0);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.04);
    noise.connect(filter).connect(noiseGain).connect(ctx.destination);

    osc.start(t0); osc.stop(t0 + 0.1);
    noise.start(t0); noise.stop(t0 + 0.04);
  } catch (e) { /* im lặng nếu bị chặn */ }
}
/* tiếng "ầm" hộp nổ tung — nhiễu dải rộng dày hơn tiếng "bốp" thường, kèm 1 tông trầm đổ nhanh */
function playBoxBoom() {
  try {
    const ctx = boxAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t0);
    osc.frequency.exponentialRampToValueAtTime(48, t0 + 0.22);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.5, t0);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28);
    osc.connect(oscGain).connect(ctx.destination);

    const noise = ctx.createBufferSource();
    noise.buffer = boxNoiseBuffer(ctx, 0.3);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3200;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t0);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
    noise.connect(filter).connect(noiseGain).connect(ctx.destination);

    osc.start(t0); osc.stop(t0 + 0.28);
    noise.start(t0); noise.stop(t0 + 0.3);
  } catch (e) { /* im lặng nếu bị chặn */ }
}

/* "Hâm nóng" AudioContext ngay khi script này load, không đợi tới lúc mở hộp mới tạo — tạo
   AudioContext lần đầu có thể hơi tốn thời gian ở một số máy, nếu để tới đúng lúc cần phát
   tiếng "pằng"/"ầm" thì sẽ làm khựng nhịp animation. AudioContext tạo trước sẽ ở trạng thái
   "suspended" cho tới lúc có tương tác (không phát ra tiếng, không có lỗi gì) — boxAudio() tự
   resume() nó khi thật sự cần phát âm thanh. */
boxAudio();

function createBoxGame(container, candidates, onFinish) {
  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let items = candidates || [];
  let boxes = [];
  let busy = false;
  let svgUid = 0;

  function sameItems(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i].id !== b[i].id || a[i].name !== b[i].name) return false;
    }
    return true;
  }

  function buildGrid() {
    container.innerHTML = '';
    boxes = items.map(function (food, i) {
      const box = document.createElement('button');
      box.type = 'button';
      box.className = 'box';
      box.dataset.idx = String(i);
      box.setAttribute('aria-label', 'Hộp quà bí ẩn ' + (i + 1));
      box.innerHTML = '<span class="box-icon">' + boxSvg(false, svgUid++) + '</span>';
      box.addEventListener('click', function () { open(box, food); });
      container.appendChild(box);
      return box;
    });
  }

  /* Khung phóng to ở giữa màn hình — dùng chung 1 phần tử, tự thêm vào <body> lần đầu cần tới.
     Có khẩu súng đồ chơi bên trái nhắm vào hộp: hộp hiện ra -> súng rung lên đạn -> bắn 1 tia
     năng lượng bay sang -> hộp NỔ TUNG làm đôi (2 nửa bay ngược hướng nhau) kèm nắp bay riêng,
     chớp sáng + sóng xung kích. Khung này KHÔNG tự đóng sau khi nổ — thẻ kết quả bên ngoài hiện
     chồng lên trên trong lúc hộp vẫn còn hiển thị phía sau; gọi box.closeReveal() để ẩn khung này đi. */
  function ensureOverlay() {
    let overlay = document.getElementById('boxOpenOverlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'boxOpenOverlay';
    overlay.className = 'box-open-overlay';
    overlay.innerHTML =
      '<div class="box-open-stage">' +
        '<div class="box-open-glow" aria-hidden="true"></div>' +
        '<div class="box-open-shock" aria-hidden="true"></div>' +
        '<span class="box-open-gun" aria-hidden="true">' + boxGunSvg(svgUid++) +
          '<span class="box-open-muzzle-flash" aria-hidden="true"></span></span>' +
        '<span class="box-open-bolt" aria-hidden="true">' + boxBoltSvg() + '</span>' +
        '<span class="box-open-body box-open-body-whole" aria-hidden="true">' + boxSvg(true, svgUid++) + '</span>' +
        '<span class="box-open-body box-open-frag box-open-frag-l" aria-hidden="true">' + boxSvg(true, svgUid++) + '</span>' +
        '<span class="box-open-body box-open-frag box-open-frag-r" aria-hidden="true">' + boxSvg(true, svgUid++) + '</span>' +
        '<span class="box-open-lid" aria-hidden="true">' + boxLidSvg(svgUid++) + '</span>' +
      '</div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function finish(box, food) {
    busy = false;
    if (typeof onFinish === 'function') onFinish(food);
  }

  function open(box, food) {
    if (busy || !food || box.disabled || box.classList.contains('is-opened')) return;
    busy = true;
    box.disabled = true;
    box.classList.add('is-opened'); // đánh dấu đã mở ngay trong lưới nhỏ, không đợi hết animation phóng to
    box.innerHTML = '<span class="box-icon">' + boxSvg(true, svgUid++) + '</span>';
    const overlay = ensureOverlay();

    if (reduceMotion) {
      playBoxPop();
      finish(box, food);
      return;
    }

    // bước 1: hộp + súng hiện to ở giữa màn hình, nền tối lại để lấy tiêu điểm
    overlay.className = 'box-open-overlay is-show';
    // bước 2: súng rung lên đạn, có tiếng xoẹt nhẹ chờ bắn
    setTimeout(function () {
      overlay.classList.add('is-aiming');
      playBoxRustle();
    }, 260);
    // bước 3: BẮN — nòng súng chớp sáng, tia năng lượng bay sang hộp, kèm tiếng "pằng"
    setTimeout(function () {
      overlay.classList.remove('is-aiming');
      overlay.classList.add('is-firing');
      playGunShot();
    }, 560);
    // bước 4: HỘP NỔ TUNG — vỡ làm đôi bay ngược hướng, nắp bay riêng, chớp sáng + sóng xung
    // kích lan ra, kèm tiếng "ầm"
    setTimeout(function () {
      overlay.classList.remove('is-firing');
      overlay.classList.add('is-open');
      playBoxBoom();
    }, 740);
    // báo món trúng ra ngoài để mở thẻ kết quả — hộp vẫn hiện phía sau, thẻ hiện chồng lên trên
    setTimeout(function () {
      finish(box, food);
    }, 1150);
  }

  /* Đóng khung phóng to lại — gọi từ bên ngoài khi thẻ/modal kết quả đã đóng xong. */
  function closeReveal() {
    const overlay = document.getElementById('boxOpenOverlay');
    if (overlay) overlay.classList.remove('is-show', 'is-aiming', 'is-firing', 'is-open');
  }

  function openRandom() {
    const available = boxes.filter(function (b) { return !b.disabled && !b.classList.contains('is-opened'); });
    if (available.length === 0) return;
    const box = available[Math.floor(Math.random() * available.length)];
    open(box, items[parseInt(box.dataset.idx, 10)]);
  }

  function updateCandidates(list) {
    list = list || [];
    if (sameItems(list, items)) { items = list; return; } // nội dung không đổi thì giữ nguyên bộ hộp đang có
    items = list;
    buildGrid();
  }

  function setEnabled(enabled) {
    boxes.forEach(function (box) {
      if (!box.classList.contains('is-opened')) box.disabled = !enabled;
    });
  }

  function reset() { buildGrid(); }

  buildGrid();

  return { openRandom, updateCandidates, setEnabled, reset, closeReveal };
}
