/* =========================================================
   wheel.js — vòng quay chọn món (Canvas)

   Cách dùng:
     const wheel = createWheel(canvas, foods, onFinish, onStart, { exact: false });
       - foods:    mảng món ăn (hoặc mảng có thêm trường `nominatedBy` khi cả nhóm đề cử)
       - onFinish: gọi khi quay xong, nhận món trúng
       - onStart:  gọi khi bắt đầu quay (tuỳ chọn)
       - minItems: số món tối thiểu để được phép quay (mặc định 1)
       - exact:    true  -> vòng quay dùng đúng danh sách truyền vào (tối đa 12 ô,
                            món trùng nhau chiếm nhiều ô hơn nên dễ trúng hơn)
                   false -> nếu nhiều hơn 8 món thì chọn ngẫu nhiên 8 món
     wheel.spin()                          quay thật, bắt đầu từ góc đang xoay
     wheel.updateCandidates(list, {exact}) đổi danh sách món
     wheel.getItems()                      các món đang nằm trên vòng quay
     wheel.isSpinning(), wheel.itemCount(), wheel.getRotation()

   Khi không quay, vòng quay luôn xoay nhẹ. Tự dừng khi ra khỏi màn hình, khi tab bị ẩn,
   và không xoay nếu người dùng bật "giảm chuyển động" của hệ điều hành.
   ========================================================= */

/* Màu lát bánh: cam, kem vàng, xanh ngọc, hồng đỏ, navy, đào (lấy từ bảng màu gốc của dự án).
   Mỗi lát có màu chữ riêng để đủ tương phản. */
const WHEEL_SLICES = [
  { bg: '#E8541A', fg: '#FFFFFF' },
  { bg: '#F5D9A8', fg: '#1F2A44' },
  { bg: '#0B8F82', fg: '#FFFFFF' },
  { bg: '#E23F52', fg: '#FFFFFF' },
  { bg: '#3D405B', fg: '#FFFFFF' },
  { bg: '#F7C59F', fg: '#1F2A44' },
];
const WHEEL_EMPTY_SLICES = [
  { bg: '#F8ECDD', fg: '#B59B80' },
  { bg: '#FCF3E8', fg: '#B59B80' },
];
const PLACEHOLDER_ITEMS = [{ name: '?' }, { name: '?' }, { name: '?' }, { name: '?' }, { name: '?' }, { name: '?' }];
const WHEEL_RIM_FROM = '#F59E0B';   // viền cam gradient như thiết kế gốc
const WHEEL_RIM_TO = '#EA580C';
const WHEEL_HUB_RING = '#F97316';
const WHEEL_GAP = '#FFFFFF';        // đường ngăn giữa các lát
const WHEEL_FONT = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const WHEEL_MAX_ITEMS = 12;
const WHEEL_IDLE_SPEED = 0.14; // rad/giây, khoảng 8 độ/giây

function wheelSlice(i, n) {
  const count = WHEEL_SLICES.length;
  let k = i % count;
  if (i === n - 1 && n > 1 && k === 0) k = 2;
  return WHEEL_SLICES[k];
}

function createWheel(canvas, candidates, onFinish, onStart, options) {
  options = options || {};
  const ctx = canvas.getContext('2d');
  const TWO_PI = 2 * Math.PI;
  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  let exact = !!options.exact;
  const minItems = options.minItems || 1;   // số món tối thiểu để được phép quay
  let isSpinning = false;
  let items = [];
  let rotation = 0;
  let idleRaf = 0;
  let idleLast = 0;
  let onScreen = true;

  const mod = function (x, m) { return ((x % m) + m) % m; };

  function pickItems() {
    if (!candidates || candidates.length === 0) { items = []; return; }
    if (exact) { items = candidates.slice(0, WHEEL_MAX_ITEMS); return; }
    if (candidates.length <= 8) {
      let selected = [...candidates];
      while (selected.length < 6 && selected.length > 0) {
        selected = [...selected, ...candidates].slice(0, 8);
      }
      items = selected;
    } else {
      const shuffled = [...candidates].sort(() => 0.5 - Math.random());
      items = shuffled.slice(0, 8);
    }
  }

  function truncate(text, max) {
    return text.length > max ? text.substring(0, max - 1) + '…' : text;
  }

  // Ngắt tên món thành tối đa maxLines dòng vừa maxWidth (đo bằng font đang đặt trên ctx)
  function wrapText(text, maxWidth, maxLines) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    words.forEach(function (word) {
      const trial = current ? current + ' ' + word : word;
      if (!current || ctx.measureText(trial).width <= maxWidth) {
        current = trial;
      } else {
        lines.push(current);
        current = word;
      }
    });
    if (current) lines.push(current);
    if (lines.length > maxLines) {
      lines.length = maxLines;
      let last = lines[maxLines - 1];
      while (last.length > 1 && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
      lines[maxLines - 1] = last + '…';
    }
    return lines;
  }

  function drawWheel(angle) {
    const width = canvas.width;
    const height = canvas.height;
    const s = width / 380;               // hệ số tỉ lệ: thiết kế gốc là 380px
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 4 * s;
    // Chưa có món nào: vẫn vẽ vòng quay mờ dấu "?" để nó vẫn xoay nhẹ
    const placeholder = items.length === 0;
    const list = placeholder ? PLACEHOLDER_ITEMS : items;
    const numSlices = list.length;
    const sliceAngle = TWO_PI / numSlices;
    const rimWidth = 14 * s;
    const hubRadius = 38 * s;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    for (let i = 0; i < numSlices; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const slice = placeholder ? WHEEL_EMPTY_SLICES[i % 2] : wheelSlice(i, numSlices);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = slice.bg;
      ctx.fill();
      ctx.lineWidth = 3 * s;
      ctx.strokeStyle = WHEEL_GAP;
      ctx.stroke();

      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = slice.fg;
      const crowded = numSlices > 8;
      const size = (crowded ? 12.5 : 14) * s;
      const textRight = radius - rimWidth - 12 * s;
      const maxWidth = textRight - hubRadius - 12 * s;
      const item = list[i];

      // Tên món ngắt tối đa 3 dòng (2 dòng khi vòng quay đông ô); nếu có người đề cử thì thêm 1 dòng nhỏ
      ctx.font = '700 ' + Math.round(size) + 'px ' + WHEEL_FONT;
      const nameLines = wrapText(item.name, maxWidth, item.nominatedBy || crowded ? 2 : 3);
      const lineHeight = size * 1.2;
      const total = nameLines.length + (item.nominatedBy ? 1 : 0);
      let y = -((total - 1) * lineHeight) / 2;

      nameLines.forEach(function (line) {
        ctx.fillText(line, textRight, y, maxWidth);
        y += lineHeight;
      });
      if (item.nominatedBy) {
        ctx.globalAlpha = 0.85;
        ctx.font = '500 ' + Math.round(size * 0.85) + 'px ' + WHEEL_FONT;
        ctx.fillText(truncate(item.nominatedBy, 14), textRight, y, maxWidth);
      }
      ctx.restore();
    }

    ctx.restore();   // hết phần xoay của các lát

    // Viền cam gradient (đứng yên) + hàng chấm sáng (xoay theo vòng quay)
    ctx.save();
    ctx.translate(centerX, centerY);
    const rim = ctx.createLinearGradient(-radius, -radius, radius, radius);
    rim.addColorStop(0, WHEEL_RIM_FROM);
    rim.addColorStop(1, WHEEL_RIM_TO);
    ctx.beginPath();
    ctx.arc(0, 0, radius - rimWidth / 2, 0, TWO_PI);
    ctx.lineWidth = rimWidth;
    ctx.strokeStyle = rim;
    ctx.stroke();
    ctx.fillStyle = '#FFF4E5';
    for (let d = 0; d < 32; d++) {
      const a = angle + (d / 32) * TWO_PI;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (radius - rimWidth / 2), Math.sin(a) * (radius - rimWidth / 2), 2 * s, 0, TWO_PI);
      ctx.fill();
    }
    ctx.restore();

    // Nút giữa (không xoay theo vòng quay)
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius, 0, TWO_PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(120, 50, 10, 0.3)';
    ctx.shadowBlur = 12 * s;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 5 * s;
    ctx.strokeStyle = WHEEL_HUB_RING;
    ctx.stroke();
    ctx.fillStyle = '#EA580C';
    ctx.font = '800 ' + Math.round(14 * s) + 'px ' + WHEEL_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('QUAY', centerX, centerY + 1 * s);
    ctx.restore();
  }

  /* ---------- Xoay nhẹ liên tục khi chưa quay ---------- */
  function idleFrame(now) {
    idleRaf = 0;
    if (isSpinning || reduceMotion || !onScreen || document.hidden) return;
    if (idleLast) rotation = mod(rotation + WHEEL_IDLE_SPEED * Math.min((now - idleLast) / 1000, 0.1), TWO_PI);
    idleLast = now;
    drawWheel(rotation);
    idleRaf = requestAnimationFrame(idleFrame);
  }
  function startIdle() {
    if (idleRaf || reduceMotion || isSpinning || !onScreen || document.hidden) return;
    idleLast = 0;
    idleRaf = requestAnimationFrame(idleFrame);
  }
  function stopIdle() {
    if (idleRaf) cancelAnimationFrame(idleRaf);
    idleRaf = 0;
  }

  /* ---------- Quay thật ---------- */
  function spin() {
    if (isSpinning || items.length < minItems) return;
    isSpinning = true;
    stopIdle();
    if (typeof onStart === 'function') onStart();

    const targetIndex = Math.floor(Math.random() * items.length);
    const winningItem = items[targetIndex];
    new Image().src = winningItem.image; // tải trước ảnh món trúng để modal hiện ngay

    // Vòng quay dừng khi ô trúng nằm dưới mũi tên ở đỉnh (góc 3π/2).
    const sliceAngle = TWO_PI / items.length;
    const sliceOffset = (Math.random() * 0.6 + 0.2) * sliceAngle;
    const finalAngle = mod((3 * Math.PI) / 2 - (targetIndex * sliceAngle + sliceOffset), TWO_PI);
    const startAngle = rotation;
    const total = 6 * TWO_PI + mod(finalAngle - mod(startAngle, TWO_PI), TWO_PI);

    const startTime = performance.now();
    const duration = reduceMotion ? 900 : 4200;

    function animate(currentTime) {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      rotation = startAngle + total * easeOut;
      drawWheel(rotation);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        rotation = mod(rotation, TWO_PI);
        isSpinning = false;
        startIdle();
        if (typeof onFinish === 'function') onFinish(winningItem);
      }
    }
    requestAnimationFrame(animate);
  }

  function updateCandidates(newCandidates, opts) {
    candidates = newCandidates;
    if (opts && typeof opts.exact === 'boolean') exact = opts.exact;
    pickItems();
    if (!isSpinning) drawWheel(rotation);
  }

  pickItems();
  drawWheel(rotation);
  canvas.addEventListener('click', spin);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { if (!isSpinning) drawWheel(rotation); });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      if (onScreen) startIdle(); else stopIdle();
    }).observe(canvas);
  } else {
    startIdle();
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) startIdle(); });

  return {
    spin,
    updateCandidates,
    isSpinning: () => isSpinning,
    itemCount: () => items.length,
    getItems: () => items.slice(),
    getRotation: () => rotation,
  };
}
