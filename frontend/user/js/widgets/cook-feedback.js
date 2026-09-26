/* widgets/cook-feedback.js — Khu "Nấu thử món này" ở trang chi tiết món.
   Người dùng đã nấu thử cho biết từng nguyên liệu nên giữ / giảm / tăng, vị sau khi nấu, độ khó, thời gian và có hợp khẩu vị không.
   Mục đích: biết công thức và định lượng có chuẩn không. Số tổng hợp chỉ hiện khi đã có đủ lượt (server quyết định `enough`).
   API (hợp đồng ở backend/HANDOFF.md, mục P0): Backend.recipeStats / recipeMine / recipeSubmit.
   Backend chưa có hành động này (err.missing) thì cả khu tự ẩn. Cần: escHtml, getCurrentUser (core/auth.js), showToast (core/main.js). */
function mountCookFeedback(food) {
  var section = document.getElementById('cookSection');
  if (!section) return;
  var body = document.getElementById('cookBody'), summary = document.getElementById('cookSummary');
  section.classList.add('d-none');

  var TASTE = { salty: 'Độ mặn', sweet: 'Độ ngọt', spicy: 'Độ cay' };
  var TASTE_OPTS = { salty: [['low', 'Nhạt'], ['ok', 'Vừa'], ['high', 'Mặn']], sweet: [['low', 'Nhạt'], ['ok', 'Vừa'], ['high', 'Ngọt']], spicy: [['low', 'Ít cay'], ['ok', 'Vừa'], ['high', 'Cay']] };
  var THRESHOLD = 0.3;   // từ 30% số người cùng nhận xét thì hiện thành lời gợi ý
  var MIN_PER_INGREDIENT = 5;

  var st = { stats: null, mine: null, editing: false, draft: null, sending: false };
  var user = function () { var u = getCurrentUser(); return u && u.server ? u : null; };

  function pct(n, total) { return total ? Math.round(n * 100 / total) : 0; }

  /* ---------- Lời tổng hợp cho từng nguyên liệu / cả món ---------- */
  function ingredientNote(stat) {
    if (!st.stats || !st.stats.enough || !stat || stat.total < MIN_PER_INGREDIENT) return '';
    if (stat.less / stat.total >= THRESHOLD) return '<span class="cook-note is-less"><i class="bi bi-arrow-down-short"></i> Nhiều người giảm bớt</span>';
    if (stat.more / stat.total >= THRESHOLD) return '<span class="cook-note is-more"><i class="bi bi-arrow-up-short"></i> Nhiều người tăng thêm</span>';
    return '<span class="cook-note is-ok"><i class="bi bi-check2"></i> ' + pct(stat.ok, stat.total) + '% thấy vừa đủ</span>';
  }

  function communityChips() {
    var s = st.stats;
    if (!s || !s.enough) return '';
    var chips = [];
    Object.keys(TASTE).forEach(function (k) {
      var t = s.taste && s.taste[k]; if (!t) return;
      var total = (t.low || 0) + (t.ok || 0) + (t.high || 0); if (total < MIN_PER_INGREDIENT) return;
      var word = { salty: ['hơi nhạt', 'hơi mặn'], sweet: ['ít ngọt', 'khá ngọt'], spicy: ['ít cay', 'khá cay'] }[k];
      if (t.high / total >= THRESHOLD) chips.push('Nhiều người thấy ' + word[1]);
      else if (t.low / total >= THRESHOLD) chips.push('Nhiều người thấy ' + word[0]);
    });
    var d = s.difficulty || {}, dt = (d.easy || 0) + (d.medium || 0) + (d.hard || 0);
    if (dt >= MIN_PER_INGREDIENT) {
      if (d.easy / dt >= 0.5) chips.push('Đa số thấy dễ nấu'); else if (d.hard / dt >= THRESHOLD) chips.push('Khá nhiều người thấy hơi khó');
    }
    var tm = s.time || {}, tt = (tm.faster || 0) + (tm.same || 0) + (tm.slower || 0);
    if (tt >= MIN_PER_INGREDIENT && tm.slower / tt >= THRESHOLD) chips.push('Thường mất lâu hơn ' + food.cookTimeMinutes + ' phút');
    return chips.map(function (c) { return '<span class="badge bg-light text-dark border">' + escHtml(c) + '</span>'; }).join(' ');
  }

  function renderSummary() {
    var s = st.stats;
    if (!s || !s.cooks) summary.textContent = 'Chưa có ai nấu thử — hãy là người đầu tiên!';
    else if (!s.enough) summary.textContent = s.cooks + ' người đã nấu thử · cần thêm vài phản hồi nữa để hiện thống kê';
    else summary.textContent = 'Đã có ' + s.cooks + ' người nấu thử · ' + s.fitRate + '% hợp khẩu vị';
  }

  /* ---------- Vẽ ---------- */
  function seg(attr, current, options, extra) {
    return '<div class="cook-seg" role="radiogroup"' + (extra || '') + '>' + options.map(function (o) {
      return '<button type="button" role="radio" class="cook-choice' + (current === o[0] ? ' is-on' : '') + '" aria-checked="' + (current === o[0]) + '" ' + attr + '="' + o[0] + '">' + o[1] + '</button>';
    }).join('') + '</div>';
  }

  function ingredientRow(ing, i) {
    var stat = st.stats && st.stats.ingredients ? st.stats.ingredients.filter(function (x) { return x.index === i; })[0] : null;
    var d = st.editing ? st.draft.ingredients[i] : null, status = d ? d.status : null;
    var html = '<li class="cook-row"><div class="cook-ing"><span class="cook-ing-name">' + escHtml(ing.name) + '</span><span class="cook-ing-amount">' + escHtml(ing.amount) + '</span></div>';
    if (st.editing) {
      html += seg('data-ing-status="' + i + '" data-v', status, [['ok', 'Vừa đủ'], ['less', 'Nên giảm'], ['more', 'Nên tăng']], ' aria-label="' + escHtml(ing.name) + '"');
      if (status && status !== 'ok') html += '<input class="form-control form-control-sm cook-ing-note" maxlength="80" data-ing-note="' + i + '" placeholder="Ghi chú (vd: thay bằng…)" value="' + escHtml(d.note || '') + '">';
    }
    return html + '<span class="cook-community">' + ingredientNote(stat) + '</span></li>';
  }

  function formHtml() {
    var d = st.draft;
    var html = '<div class="cook-form">' +
      '<div class="cook-field"><span class="cook-label">Bạn nấu cho mấy người?</span>' + seg('data-portions', d.portions, [[1, '1'], [2, '2'], [3, '3'], [4, '4+']]) + '</div>';
    Object.keys(TASTE).forEach(function (k) {
      html += '<div class="cook-field"><span class="cook-label">' + TASTE[k] + ' sau khi nấu</span>' + seg('data-taste="' + k + '" data-v', d.taste[k], TASTE_OPTS[k]) + '</div>';
    });
    html += '<div class="cook-field"><span class="cook-label">Độ khó</span>' + seg('data-difficulty', d.difficulty, [['easy', 'Dễ'], ['medium', 'Vừa'], ['hard', 'Khó']]) + '</div>' +
      '<div class="cook-field"><span class="cook-label">Thời gian thực tế (ghi ' + food.cookTimeMinutes + ' phút)</span>' + seg('data-time', d.time, [['faster', 'Nhanh hơn'], ['same', 'Đúng'], ['slower', 'Lâu hơn']]) + '</div>' +
      '<div class="cook-field"><span class="cook-label">Hợp khẩu vị của bạn? <span class="text-danger">*</span></span>' +
      '<div class="cook-seg" role="radiogroup"><button type="button" role="radio" class="cook-choice cook-fit' + (d.fit === true ? ' is-on' : '') + '" aria-checked="' + (d.fit === true) + '" data-fit="1">👍 Hợp</button>' +
      '<button type="button" role="radio" class="cook-choice cook-fit' + (d.fit === false ? ' is-on' : '') + '" aria-checked="' + (d.fit === false) + '" data-fit="0">👎 Chưa hợp</button></div></div>' +
      '<div class="cook-field"><label class="cook-label" for="cookNote">Ghi chú thêm (tuỳ chọn, chỉ quản trị viên đọc)</label>' +
      '<textarea class="form-control" id="cookNote" rows="2" maxlength="300" placeholder="Bạn đã chỉnh gì để món ngon hơn?">' + escHtml(d.note) + '</textarea></div>' +
      '<div class="small text-danger d-none" id="cookError" role="alert"></div>' +
      '<div class="d-flex flex-wrap gap-2"><button type="button" class="btn btn-brand" data-cook-send' + (st.sending ? ' disabled' : '') + '><i class="bi bi-send"></i> ' + (st.sending ? 'Đang gửi…' : 'Gửi phản hồi nấu thử') + '</button>' +
      '<button type="button" class="btn btn-link text-muted" data-cook-cancel>Để sau</button></div></div>';
    return html;
  }

  function ctaHtml() {
    if (st.editing) return '';
    if (!user()) return '<a class="btn btn-brand" href="dang-nhap.html?next=' + encodeURIComponent('chi-tiet-mon-an.html?id=' + food.id) + '"><i class="bi bi-box-arrow-in-right"></i> Đăng nhập để nấu thử</a>';
    if (st.mine) return '<span class="small text-success me-2"><i class="bi bi-check-circle-fill"></i> Bạn đã gửi phản hồi cho món này</span><button type="button" class="btn btn-outline-brand btn-sm" data-cook-open>Sửa phản hồi</button>';
    return '<button type="button" class="btn btn-brand" data-cook-open><i class="bi bi-egg-fried"></i> Tôi đã nấu thử món này</button>';
  }

  function render() {
    renderSummary();
    body.innerHTML = '<div class="cook-card">' +
      '<p class="small text-muted mb-3">Công thức tính cho <strong>1 người ăn</strong>. ' + (st.editing ? 'Chọn giúp từng nguyên liệu nên giữ, giảm hay tăng — bỏ trống nguyên liệu nào bạn không để ý.' : 'Bạn nấu rồi? Cho biết định lượng có chuẩn không để công thức ngày càng chính xác.') + '</p>' +
      (communityChips() ? '<div class="d-flex flex-wrap gap-2 mb-3">' + communityChips() + '</div>' : '') +
      '<ul class="cook-list">' + food.ingredients.map(ingredientRow).join('') + '</ul>' +
      (st.editing ? formHtml() : '<div class="mt-3">' + ctaHtml() + '</div>') + '</div>';
  }

  /* ---------- Bản nháp <-> dữ liệu gửi lên ---------- */
  function newDraft(mine) {
    var d = { portions: 1, ingredients: {}, taste: { salty: null, sweet: null, spicy: null }, fit: null, difficulty: null, time: null, note: '' };
    if (mine) {
      d.portions = Math.min(4, mine.portions || 1); d.fit = mine.fit; d.difficulty = mine.difficulty || null; d.time = mine.time || null; d.note = mine.note || '';
      ['salty', 'sweet', 'spicy'].forEach(function (k) { d.taste[k] = mine.taste ? (mine.taste[k] || null) : null; });
      (mine.ingredients || []).forEach(function (x) { d.ingredients[x.index] = { status: x.status, note: x.note || '' }; });
    }
    return d;
  }

  function payload() {
    var d = st.draft, ings = [];
    Object.keys(d.ingredients).forEach(function (i) {
      var x = d.ingredients[i]; if (!x.status) return;
      var o = { index: +i, status: x.status }; if (x.status !== 'ok' && x.note.trim()) o.note = x.note.trim();
      ings.push(o);
    });
    return { foodId: food.id, portions: d.portions, ingredients: ings, taste: d.taste, fit: d.fit, difficulty: d.difficulty, time: d.time, note: d.note.trim() };
  }

  function toggle(obj, key, value) { obj[key] = obj[key] === value ? null : value; }

  /* ---------- Tương tác ---------- */
  body.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    var d = st.draft;
    if (t.hasAttribute('data-cook-open')) { st.editing = true; st.draft = newDraft(st.mine); return render(); }
    if (t.hasAttribute('data-cook-cancel')) { st.editing = false; return render(); }
    if (t.hasAttribute('data-ing-status')) {
      var i = t.getAttribute('data-ing-status'), cur = d.ingredients[i] || { status: null, note: '' };
      cur.status = cur.status === t.dataset.v ? null : t.dataset.v; d.ingredients[i] = cur; return render();
    }
    if (t.hasAttribute('data-portions')) { d.portions = +t.getAttribute('data-portions'); return render(); }
    if (t.hasAttribute('data-taste')) { toggle(d.taste, t.getAttribute('data-taste'), t.dataset.v); return render(); }
    if (t.hasAttribute('data-difficulty')) { toggle(d, 'difficulty', t.getAttribute('data-difficulty')); return render(); }
    if (t.hasAttribute('data-time')) { toggle(d, 'time', t.getAttribute('data-time')); return render(); }
    if (t.hasAttribute('data-fit')) { d.fit = t.getAttribute('data-fit') === '1'; return render(); }
    if (t.hasAttribute('data-cook-send')) return send();
  });
  body.addEventListener('input', function (e) {
    var t = e.target;   // gõ chữ thì chỉ cập nhật bản nháp, không vẽ lại (giữ con trỏ)
    if (t.id === 'cookNote') st.draft.note = t.value;
    else if (t.hasAttribute('data-ing-note')) st.draft.ingredients[t.getAttribute('data-ing-note')].note = t.value;
  });

  function send() {
    var err = document.getElementById('cookError');
    if (st.draft.fit === null) { err.textContent = 'Hãy cho biết món này có hợp khẩu vị của bạn không.'; err.classList.remove('d-none'); return; }
    st.sending = true; render();
    var data = payload();
    Backend.recipeSubmit(data).then(function () {
      st.mine = data; st.editing = false;
      showToast('success', 'Cảm ơn bạn! Phản hồi nấu thử đã được ghi nhận.');
      return Backend.recipeStats(food.id).then(function (s) { st.stats = s; }, function () { /* giữ số cũ */ });
    }).then(function () {
      st.sending = false; render();
    }, function (er) {
      st.sending = false; render();
      var box = document.getElementById('cookError'); box.textContent = er.message; box.classList.remove('d-none');
    });
  }

  /* ---------- Khởi động ---------- */
  function load() {
    body.innerHTML = '<div class="review-skel"></div><div class="review-skel mt-2"></div>';
    Promise.all([
      Backend.recipeStats(food.id),
      user() ? Backend.recipeMine(food.id).catch(function (er) { if (er.missing) throw er; return null; }) : Promise.resolve(null),
    ]).then(function (r) {
      st.stats = r[0]; st.mine = r[1]; section.classList.remove('d-none'); render();
    }).catch(function (er) {
      if (er.missing) return;   // backend chưa hỗ trợ: giữ khu này ẩn
      section.classList.remove('d-none'); summary.textContent = '';
      body.innerHTML = '<div class="cook-card text-center"><p class="mb-2 text-muted">Không tải được phần nấu thử.</p><button type="button" class="btn btn-sm btn-outline-secondary" id="cookRetry">Thử lại</button></div>';
      document.getElementById('cookRetry').addEventListener('click', load);
    });
  }

  Backend.available().then(function (online) { if (online) load(); });
}
