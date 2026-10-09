/* pages/thong-ke.js — Thống kê & báo cáo: KPI so kỳ trước, biểu đồ đường, theo bữa/vùng, bảng hiệu suất; xuất CSV / PDF (in). */
(function () {
  'use strict';
  var D = window.Dom, F = window.Fmt, C = window.Charts;
  var TEXT = { '7': '7 ngày qua', '30': '30 ngày qua', quy: 'Quý này (90 ngày)' };
  var RANK = ['amber', 'blue', 'rose', 'orange', 'purple', 'green', 'sky', 'amber'];
  var state = { range: '30', days: null }, last = null;

  function delta(el, v, suffix) {
    if (v == null) { el.className = 'stat-note'; el.textContent = 'Chưa có dữ liệu theo kỳ'; return; }
    var up = v >= 0; el.className = 'stat-note ' + (up ? 'is-up' : 'is-down');
    el.innerHTML = D.icon(up ? 'up' : 'down') + (up ? '+' : '−') + F.dec(Math.abs(v), 1) + '%' + (suffix ? ' ' + suffix : '');
    var i = el.querySelector('.ic'); if (i) { i.style.width = '12px'; i.style.height = '12px'; }
  }

  function render(d) {
    last = d; var k = d.kpis;
    D.$('[data-stat=newUsers]').textContent = F.int(k.newUsers.value); delta(D.$('[data-note=newUsers]'), k.newUsers.delta, 'so với kỳ trước');
    D.$('[data-stat=spins]').textContent = F.int(k.spins.value); delta(D.$('[data-note=spins]'), k.spins.delta);
    D.$('[data-stat=favorites]').textContent = F.int(k.favorites.value); delta(D.$('[data-note=favorites]'), k.favorites.delta);
    D.$('[data-stat=decideRate]').textContent = (k.decideRate.value == null ? '—' : k.decideRate.value + '%'); delta(D.$('[data-note=decideRate]'), k.decideRate.delta, 'so với kỳ trước');
    C.lines(D.$('#lineChart'), d.series);
    var total = d.byMeal.reduce(function (s, x) { return s + x.value; }, 0);
    D.$('#mealSub').textContent = 'Phân bổ ' + F.int(total) + ' lượt lưu trong database theo bữa của món';
    C.hbars(D.$('#mealBars'), d.byMeal);
    var regions = d.byRegion.slice().sort(function (a, b) { return b.count - a.count; });
    D.$('#regionSub').textContent = regions.reduce(function (s, x) { return s + x.count; }, 0) + ' món · ' + regions.length + ' vùng miền';
    C.hbars(D.$('#regionBars'), regions.map(function (r) { return { label: r.label, value: r.count, tone: r.dot }; }), { unit: 'món' });
    D.$('#perfBody').innerHTML = d.performance.map(function (p, i) {
      return '<tr><td class="name"><div class="cell-main"><span class="thumb c-' + RANK[i % RANK.length] + '">' + D.initial(p.name) + '</span><a class="cell-title" href="mon-an-sua.html?id=' + encodeURIComponent(p.id) + '">' + D.esc(p.name) + '</a></div></td>' +
        '<td class="num muted-cell">' + F.int(p.views) + '</td><td class="num strong">' + F.int(p.spins) + '</td><td class="num muted-cell">' + F.int(p.favorites) + '</td>' +
        '<td class="num good">' + (p.decide == null ? '—' : p.decide + '%') + '</td><td class="num"><span class="rating">' + D.icon('star') + '<b>' + F.dec(p.rating, 1) + '</b></span></td></tr>';
    }).join('');
  }

  function load() {
    D.$('#rangeText').textContent = state.days ? state.days + ' ngày qua (tuỳ chọn)' : TEXT[state.range];
    return window.Api.call('stats', state).then(render);
  }

  function customRange() {
    var today = new Date().toISOString().slice(0, 10), from = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
    window.Modal.form({
      title: 'Chọn khoảng ngày', submitText: 'Áp dụng',
      html: '<div class="date-range"><div class="field"><label>Từ ngày</label><input class="input" type="date" name="from" value="' + from + '" max="' + today + '"></div>' +
        '<div class="field"><label>Đến ngày</label><input class="input" type="date" name="to" value="' + today + '" max="' + today + '"></div></div><span class="field-error" data-modal-err hidden></span>',
      onSubmit: function (f) {
        var a = new Date(f.from.value), b = new Date(f.to.value), e = f.querySelector('[data-modal-err]');
        if (isNaN(a) || isNaN(b) || a > b) { e.textContent = 'Khoảng ngày không hợp lệ.'; e.hidden = false; return false; }
        var days = Math.round((b - a) / 86400000) + 1;
        if (days < 2 || days > 365) { e.textContent = 'Chọn khoảng từ 2 đến 365 ngày.'; e.hidden = false; return false; }
        state.days = days; D.$$('#range button').forEach(function (x) { x.classList.remove('is-active'); }); return load();
      },
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    load();
    D.on(D.$('#range'), 'click', '[data-range]', function () {
      state.range = this.dataset.range; state.days = null;
      D.$$('#range button').forEach(function (b) { b.classList.toggle('is-active', b === this); }, this); load();
    });
    D.$('#customBtn').addEventListener('click', customRange);
    D.$('#pdfBtn').addEventListener('click', function () { window.print(); });
    D.$('#csvBtn').addEventListener('click', function () {
      if (!last) return;
      var rows = [['Chỉ số', 'Giá trị'], ['Người dùng mới', last.kpis.newUsers.value], ['Lượt quay & mở hộp', last.kpis.spins.value], ['Lượt yêu thích mới', last.kpis.favorites.value], ['Tỉ lệ chốt món (%)', last.kpis.decideRate.value], [], ['Món ăn', 'Lượt xem', 'Lượt quay', 'Yêu thích', 'Tỉ lệ chốt (%)', 'Đánh giá']];
      last.performance.forEach(function (p) { rows.push([p.name, p.views, p.spins, p.favorites, p.decide, p.rating]); });
      window.Download.csv('thong-ke-' + new Date().toISOString().slice(0, 10) + '.csv', rows);
      window.Toast.success('Đã xuất CSV', 'Báo cáo thống kê đã được tải xuống.');
    });
  });
})();
