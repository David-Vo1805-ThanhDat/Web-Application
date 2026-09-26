/* pages/dashboard.js — Đổ số liệu vào Dashboard: KPI, biểu đồ cột chồng, donut danh mục, xếp hạng, hoạt động gần đây,
   và bản di động rút gọn. Đổi khoảng thời gian → gọi lại Api.call('dashboard', { range }). */
(function () {
  'use strict';
  var D = window.Dom, F = window.Fmt, C = window.Charts;

  var RANGE_TEXT = { today: 'trong hôm nay', '7': 'trong 7 ngày qua', '30': 'trong 30 ngày qua', '90': 'trong 90 ngày qua' };
  var RANK_TONES = ['amber', 'purple', 'rose', 'orange', 'blue'];
  var FAV_TONES = ['rose', 'orange', 'blue', 'purple', 'green'];
  var state = { range: '30', days: null };
  var last = null;

  function greeting() { var h = new Date().getHours(); return h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  // Câu ngắn gọn cho khung "Hoạt động gần đây" (nhật ký đầy đủ nằm ở trang Nhật ký hoạt động)
  function activityText(e) {
    if (e.type === 'user') return 'Người dùng mới: ' + e.text.split(': ').pop();
    return cap(e.text.replace('đã cập nhật món', 'đã sửa món'));
  }

  function renderKpis(k) {
    var vals = {
      foods: F.int(k.foods.value), users: F.int(k.users.value), spins: F.int(k.spins.value), favorites: F.int(k.favorites.value),
      rating: F.dec(k.rating.value, 2), health: F.int(k.health.value),
    };
    D.$$('[data-kpi]').forEach(function (card) {
      var key = card.getAttribute('data-kpi');
      D.$('[data-kpi-value]', card).textContent = vals[key];
      D.$('[data-kpi-note]', card).textContent = k[key].note;
    });
    D.$$('[data-mkpi]').forEach(function (card) { D.$('[data-kpi-value]', card).textContent = vals[card.getAttribute('data-mkpi')]; });
  }

  function render(d) {
    last = d;
    renderKpis(d.kpis);
    D.$('#greeting').textContent = greeting();
    D.$('#updatedAt').textContent = F.hm(new Date());

    C.stack(D.$('#spinsChart'), d.daily.map(function (x) { return { label: x.label, values: [x.sang, x.trua, x.anvat, x.toi] }; }),
      { unit: 2.36, legend: ['Sáng', 'Trưa', 'Ăn vặt', 'Tối'] });

    var total = d.categories.reduce(function (s, c) { return s + c.count; }, 0);
    D.$('#categorySub').textContent = total + ' món đang hoạt động';
    C.donut(D.$('#categoryDonut'), d.categories.map(function (c) { return { count: c.count, tone: c.tone }; }));
    D.$('#categoryLegend').innerHTML = d.categories.map(function (c) {
      return '<div class="legend-row"><span class="legend-name"><span class="legend-dot dot-' + c.tone + '"></span>' + D.esc(c.label) + '</span><b>' + c.count + ' món</b></div>';
    }).join('');

    D.$('#topSpun').innerHTML = d.topSpun.map(function (f, i) {
      return '<a class="rank-item" href="mon-an-sua.html?id=' + encodeURIComponent(f.id) + '"><span class="rank-no">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="thumb c-' + RANK_TONES[i] + '">' + D.initial(f.name) + '</span>' +
        '<span class="rank-info"><span class="rank-name">' + D.esc(f.name) + '</span><span class="rank-sub">' + F.int(f.reviewCount) + ' lượt đánh giá</span></span>' +
        '<span class="rank-score">' + D.icon('star') + F.dec(f.rating, 1) + '</span></a>';
    }).join('');

    D.$('#favSub').textContent = F.int(d.kpis.favorites.value) + ' lượt tim';
    C.hbars(D.$('#topFav'), d.topFav.map(function (f, i) { return { label: f.name, value: f.favorites, tone: FAV_TONES[i] }; }));

    var T = window.AuditTypes;
    D.$('#recentActivity').innerHTML = d.recent.map(function (e) {
      var t = T[e.type] || T.edit;
      return '<div class="activity-item"><span class="tint tint-' + t.tone + '">' + D.icon(t.icon) + '</span><div class="activity-text"><span class="activity-title">' +
        D.esc(activityText(e)) + '</span><span class="activity-sub">' + D.esc(e.actor) + ' · ' + F.ago(e.ts) + '</span></div></div>';
    }).join('');

    // Bản di động
    C.miniBars(D.$('#mSpinsChart'), d.daily.map(function (x) { return { label: x.label, total: x.sang + x.trua + x.anvat + x.toi }; }));
    D.$('#mTopSpun').innerHTML = d.topSpun.slice(0, 3).map(function (f, i) {
      return '<div class="m-rank"><span class="thumb c-' + RANK_TONES[i] + '">' + D.initial(f.name) + '</span><div><div class="m-rank-name">' + D.esc(f.name) + '</div>' +
        '<div class="m-rank-sub">' + f.reviewCount + ' · ' + F.dec(f.rating, 1) + '</div></div></div>';
    }).join('');
    // Cần xử lý: góp ý chưa phản hồi + (nếu backend đã có) công thức cần xem lại
    var a = d.attention, recipes = a.recipesToReview || 0, n = a.unansweredFeedback + recipes, box = D.$('#needAction');
    box.hidden = n === 0;
    D.$('#needCount').textContent = n + ' mục';
    D.$('#needText').textContent = a.unansweredFeedback + ' góp ý liên hệ chưa phản hồi' + (recipes ? ' và ' + recipes + ' công thức cần xem lại.' : '.');
  }

  function load() {
    var p = state.days ? { range: 'custom', days: state.days } : { range: state.range };
    return window.Api.call('dashboard', p).then(render);
  }

  function setRangeText(text) { D.$('#rangeText').textContent = text; }

  document.addEventListener('DOMContentLoaded', function () {
    D.on(D.$('#rangeSeg'), 'click', '[data-range]', function () {
      D.$$('#rangeSeg button').forEach(function (b) { b.classList.remove('is-active'); });
      this.classList.add('is-active');
      state.range = this.getAttribute('data-range'); state.days = null;
      setRangeText(RANGE_TEXT[state.range]); load();
    });

    D.$('#pickDateBtn').addEventListener('click', function () {
      var today = new Date(), from = new Date(today.getTime() - 29 * 86400000);
      function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
      window.Modal.form({
        title: 'Chọn khoảng ngày', size: 'md', submitText: 'Áp dụng',
        html: '<div class="field-row"><div class="field"><label for="dFrom">Từ ngày</label><input class="input" type="date" id="dFrom" value="' + iso(from) + '" max="' + iso(today) + '"></div>' +
          '<div class="field"><label for="dTo">Đến ngày</label><input class="input" type="date" id="dTo" value="' + iso(today) + '" max="' + iso(today) + '"></div></div>',
        onSubmit: function (f) {
          var a = new Date(f.querySelector('#dFrom').value), b = new Date(f.querySelector('#dTo').value);
          if (isNaN(a) || isNaN(b) || a > b) { window.Toast.error('Khoảng ngày chưa hợp lệ', 'Ngày bắt đầu phải trước ngày kết thúc.'); return false; }
          state.days = Math.max(1, Math.round((b - a) / 86400000) + 1);
          D.$$('#rangeSeg button').forEach(function (x) { x.classList.remove('is-active'); });
          setRangeText('từ ' + F.dmy(a) + ' đến ' + F.dmy(b)); load();
        },
      });
    });

    D.$('#exportBtn').addEventListener('click', function () {
      if (!last) return;
      var k = last.kpis, rows = [['Chỉ số', 'Giá trị'], ['Món ăn đang hiển thị', k.foods.value], ['Người dùng', k.users.value], ['Lượt quay & mở hộp', k.spins.value],
        ['Lượt yêu thích', k.favorites.value], ['Đánh giá trung bình', F.dec(k.rating.value, 2)], ['Hồ sơ sức khỏe', k.health.value], [], ['Món quay trúng nhiều nhất', 'Lượt đánh giá', 'Điểm']];
      last.topSpun.forEach(function (f) { rows.push([f.name, f.reviewCount, f.rating]); });
      window.Download.csv('bao-cao-dashboard-' + new Date().toISOString().slice(0, 10) + '.csv', rows);
      window.Toast.success('Đã xuất báo cáo', 'File CSV đã được tải xuống máy của bạn.');
    });

    load();
  });
})();
