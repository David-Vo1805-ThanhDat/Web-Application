/* pages/cong-thuc.js — Chất lượng công thức: danh sách món kèm phản hồi nấu thử, lọc, và hộp chi tiết từng nguyên liệu.
   API (hợp đồng ở backend/HANDOFF.md, mục P0): recipe.quality.list, recipe.quality.get. Backend chưa có → hiện thông báo "chưa hỗ trợ". */
(function () {
  'use strict';
  var D = window.Dom, F = window.Fmt;
  var STATUS = { ok: ['Ổn', 'b-green'], review: ['Cần xem lại', 'b-amber'], 'low-data': ['Chưa đủ dữ liệu', 'b-gray'] };
  var q = new URLSearchParams(location.search);
  var state = { q: '', status: STATUS[q.get('status')] ? q.get('status') : 'all', page: 1 };
  var THRESHOLD = 0.3, MIN = 5;

  function fitHtml(rate) {
    if (rate == null) return '<span class="muted-cell">—</span>';
    var cls = rate >= 75 ? '' : rate >= 60 ? ' is-mid' : ' is-low';
    return '<span class="fit' + cls + '"><b>' + rate + '%</b><span class="fit-bar"><i style="width:' + Math.max(0, Math.min(100, rate)) + '%"></i></span></span>';
  }

  function issueHtml(x) {
    if (!x.topIssue) return '<span class="muted-cell">—</span>';
    var less = x.topIssue.kind === 'less';
    return '<span class="issue-tag"><span class="badge ' + (less ? 'b-blue' : 'b-orange') + '">' + (less ? 'Nên giảm' : 'Nên tăng') + ' ' + x.topIssue.percent + '%</span>' + D.esc(x.topIssue.name) + '</span>';
  }

  function rowHtml(x) {
    var st = STATUS[x.status] || STATUS['low-data'];
    return '<tr data-id="' + D.esc(x.foodId) + '"><td><div class="cell-main"><span class="thumb ' + D.colorClass(x.foodId) + '">' + D.initial(x.foodName) + '</span>' +
      '<a class="cell-title" href="mon-an-sua.html?id=' + encodeURIComponent(x.foodId) + '">' + D.esc(x.foodName) + '</a></div></td>' +
      '<td class="num">' + F.int(x.cooks) + '</td><td>' + fitHtml(x.fitRate) + '</td><td class="issue">' + issueHtml(x) + '</td>' +
      '<td><span class="badge ' + st[1] + '">' + st[0] + '</span></td>' +
      '<td class="col-actions"><div class="row-actions"><button class="icon-action" type="button" data-view="' + D.esc(x.foodId) + '" aria-label="Xem chi tiết ' + D.esc(x.foodName) + '">' + D.icon('eye') + '</button></div></td></tr>';
  }

  function notReady() { D.$('#notReady').hidden = false; D.$('#recipesMain').hidden = true; document.body.classList.remove('is-loading'); }

  function load() {
    return window.Api.call('recipe.quality.list', { q: state.q, status: state.status, page: state.page, pageSize: 8 }).then(function (r) {
      var s = r.summary || {}, empty = r.total === 0;
      D.$('[data-stat=cooks]').textContent = F.int(s.totalCooks || 0); D.$('[data-note=cooks]').textContent = 'Từ người dùng đã nấu thử';
      D.$('[data-stat=fit]').textContent = s.fitRate == null ? '—' : s.fitRate + '%'; D.$('[data-note=fit]').textContent = 'Trung bình mọi công thức';
      D.$('[data-stat=review]').textContent = s.recipesToReview || 0; D.$('[data-note=review]').textContent = s.recipesToReview ? 'Nên kiểm tra định lượng' : 'Chưa có món nào lệch';
      D.$('#tableScroll').hidden = empty; D.$('#recipeEmpty').hidden = !empty;
      D.$('#recipeBody').innerHTML = r.items.map(rowHtml).join('');
      D.$('#footInfo').textContent = empty ? '' : 'Hiển thị ' + ((r.page - 1) * r.pageSize + 1) + '–' + Math.min(r.page * r.pageSize, r.total) + ' trong tổng số ' + r.total + ' món';
      window.Pagination.render(D.$('#pager'), { page: r.page, pages: r.pages, onChange: function (p) { state.page = p; load(); } });
      if (empty) D.$('#pager').innerHTML = '';
    }).catch(function (e) { if (e.missing) notReady(); else throw e; });
  }
  function reload(reset) { if (reset) state.page = 1; return load(); }

  /* ---------- Hộp chi tiết ---------- */
  function pct(n, t) { return t ? Math.round(n * 100 / t) : 0; }

  function ingredientRow(i) {
    var flag = i.total >= MIN && (i.less + i.more) / i.total >= THRESHOLD;
    var w = function (n) { return i.total ? (n * 100 / i.total).toFixed(1) + '%' : '0'; };
    return '<div class="ing-row' + (flag ? ' is-flag' : '') + '"><div class="ing-head"><b>' + D.esc(i.name) + '</b><span>' + D.esc(i.amount) + ' · ' + i.total + ' phản hồi</span></div>' +
      '<div class="ibar" role="img" aria-label="Vừa đủ ' + pct(i.ok, i.total) + '%, nên giảm ' + pct(i.less, i.total) + '%, nên tăng ' + pct(i.more, i.total) + '%">' +
      '<i class="s-ok" style="width:' + w(i.ok) + '"></i><i class="s-less" style="width:' + w(i.less) + '"></i><i class="s-more" style="width:' + w(i.more) + '"></i></div>' +
      '<div class="ing-legend"><span><i class="dot s-ok"></i>' + i.ok + ' vừa đủ (' + pct(i.ok, i.total) + '%)</span><span><i class="dot s-less"></i>' + i.less + ' nên giảm (' + pct(i.less, i.total) + '%)</span><span><i class="dot s-more"></i>' + i.more + ' nên tăng (' + pct(i.more, i.total) + '%)</span></div></div>';
  }

  function dist(title, obj, labels) {
    var keys = Object.keys(labels), t = keys.reduce(function (s, k) { return s + (obj && obj[k] || 0); }, 0);
    if (!t) return '';
    var mid = keys[Math.floor(keys.length / 2)];
    return '<div class="dist-item"><b>' + title + '</b><div class="ibar">' + keys.map(function (k) { return '<i class="' + (k === mid ? 'mid' : '') + '" style="width:' + (obj[k] * 100 / t).toFixed(1) + '%" title="' + labels[k] + ': ' + obj[k] + '"></i>'; }).join('') + '</div>' +
      '<small>' + keys.map(function (k) { return labels[k] + ' ' + pct(obj[k] || 0, t) + '%'; }).join(' · ') + '</small></div>';
  }

  function openDetail(id) {
    window.Api.call('recipe.quality.get', { foodId: id }).then(function (d) {
      var st = STATUS[d.status] || STATUS['low-data'];
      var html = '<div class="modal-head"><h3 class="modal-title">' + D.esc(d.food.name) + '</h3><button class="modal-close" type="button" data-x aria-label="Đóng">' + D.icon('x') + '</button></div>' +
        '<div class="modal-body recipe-detail"><div class="recipe-kpis"><span><b>' + F.int(d.cooks) + '</b> lượt nấu thử</span><span>Hợp khẩu vị <b>' + (d.fitRate == null ? '—' : d.fitRate + '%') + '</b></span><span class="badge ' + st[1] + '">' + st[0] + '</span></div>' +
        '<div><h4>Từng nguyên liệu (công thức cho 1 người)</h4><div class="ing-list">' + (d.ingredients.length ? d.ingredients.map(ingredientRow).join('') : '<span class="muted-cell">Chưa có phản hồi nguyên liệu nào.</span>') + '</div></div>' +
        '<div><h4>Vị, độ khó và thời gian</h4><div class="dist-grid">' +
          dist('Độ mặn', d.taste && d.taste.salty, { low: 'Nhạt', ok: 'Vừa', high: 'Mặn' }) + dist('Độ ngọt', d.taste && d.taste.sweet, { low: 'Nhạt', ok: 'Vừa', high: 'Ngọt' }) + dist('Độ cay', d.taste && d.taste.spicy, { low: 'Ít cay', ok: 'Vừa', high: 'Cay' }) +
          dist('Độ khó', d.difficulty, { easy: 'Dễ', medium: 'Vừa', hard: 'Khó' }) + dist('Thời gian thực tế', d.time, { faster: 'Nhanh hơn', same: 'Đúng', slower: 'Lâu hơn' }) + '</div></div>' +
        (d.notes && d.notes.length ? '<div><h4>Ghi chú của người nấu thử</h4><div class="note-list">' + d.notes.map(function (n) {
          return '<div class="note-item">' + D.esc(n.text) + '<small>' + D.esc(n.userName) + ' · nấu cho ' + n.portions + ' người · ' + (n.fit ? 'Hợp khẩu vị' : 'Chưa hợp') + ' · ' + F.ago(n.createdAt) + '</small></div>';
        }).join('') + '</div></div>' : '') +
        '<div class="recipe-actions"><button class="btn btn-ghost" type="button" data-x>Đóng</button><a class="btn btn-primary" href="mon-an-sua.html?id=' + encodeURIComponent(d.food.id) + '">' + D.icon('edit') + 'Sửa công thức</a></div></div>';
      var o = window.Modal.open(html, 'lg');
      D.$$('[data-x]', o).forEach(function (b) { b.addEventListener('click', function () { o.close(false); }); });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    D.$('#fStatus').value = state.status;
    load();
    D.$('#fQ').addEventListener('input', D.debounce(function () { state.q = this.value.trim(); reload(true); }, 220));
    D.$('#fStatus').addEventListener('change', function () { state.status = this.value; reload(true); });
    function clear() { state.q = ''; state.status = 'all'; D.$('#fQ').value = ''; D.$('#fStatus').value = 'all'; reload(true); }
    D.$('#clearFilters').addEventListener('click', clear); D.$('#emptyClear').addEventListener('click', clear);
    D.on(D.$('#recipeBody'), 'click', '[data-view]', function () { openDetail(this.getAttribute('data-view')); });
  });
})();
