/* pages/nhat-ky-suc-khoe.js — logic riêng của trang nhat-ky-suc-khoe.html (nạp sau js/core và js/widgets). */
document.addEventListener('DOMContentLoaded', function () {
  var profile = getHealthProfile();
  if (!profile) {
    document.getElementById('logEmptyState').classList.remove('d-none');
    document.getElementById('logMain').classList.add('d-none');
    return;
  }

  function timeAgo(ts) {
    var min = Math.floor((Date.now() - ts) / 60000);
    if (min < 1) return 'vừa xong';
    if (min < 60) return min + ' phút trước';
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + ' giờ trước';
    var day = Math.floor(hr / 24);
    if (day < 7) return day + ' ngày trước';
    return new Date(ts).toLocaleDateString('vi-VN');
  }
  function formatVNDate(dateStr) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function formatTrendLabel(key, period) {
    if (period === 'year') return key;
    if (period === 'month') {
      var parts = key.split('-');
      return 'Th.' + parseInt(parts[1], 10) + '/' + parts[0].slice(2);
    }
    var d = new Date(key + 'T00:00:00');
    return d.getDate() + '/' + (d.getMonth() + 1);
  }

  function paintSummary() {
    var log = getHealthLog();
    var latest = log[log.length - 1] || null;
    var weight = latest ? latest.weightKg : profile.weightKg;
    var bmi = calcBMI(weight, profile.heightCm);
    var cat = bmiCategory(bmi);
    document.getElementById('lsWeight').textContent = weight ? weight + ' kg' : '—';
    document.getElementById('lsBMI').textContent = bmi != null ? bmi : '—';
    document.getElementById('lsBMICat').textContent = cat.label;
    document.getElementById('lsBMICat').className = 'badge text-bg-' + cat.cls;

    var deltaEl = document.getElementById('lsDelta');
    if (log.length < 2) { deltaEl.textContent = '—'; deltaEl.className = 'fw-bold fs-5'; return; }
    var delta = Math.round((log[log.length - 1].weightKg - log[log.length - 2].weightKg) * 10) / 10;
    if (delta === 0) { deltaEl.textContent = 'Không đổi'; deltaEl.className = 'fw-bold fs-5 text-muted'; return; }
    deltaEl.textContent = (delta > 0 ? '▲ ' : '▼ ') + Math.abs(delta) + ' kg';
    deltaEl.className = 'fw-bold fs-5 ' + (delta > 0 ? 'text-danger' : 'text-success');
  }

  function renderTrend(period) {
    var groups = groupHealthLog(period);
    var chart = document.getElementById('trendChart');
    if (!groups.length) {
      chart.innerHTML = '<p class="text-muted small mb-0">Chưa có dữ liệu để vẽ xu hướng — ghi nhận vài mốc rồi quay lại xem nhé.</p>';
      return;
    }
    var weights = groups.map(function (g) { return g.avgWeight; });
    var min = Math.min.apply(null, weights);
    var max = Math.max.apply(null, weights);
    var range = max - min || 1;
    chart.innerHTML = groups.map(function (g) {
      var pct = 20 + ((g.avgWeight - min) / range) * 70;
      return '<div class="trend-bar-wrap"><div class="trend-bar" style="height:' + pct + '%">' +
        '<span class="trend-bar-value">' + g.avgWeight + '</span></div>' +
        '<span class="trend-bar-label">' + formatTrendLabel(g.key, period) + '</span></div>';
    }).join('');
  }

  function renderLogList() {
    var log = getHealthLog();
    var listEl = document.getElementById('logList');
    if (!log.length) {
      listEl.innerHTML = '<p class="text-muted small mb-0">Chưa có mốc nào. Ghi nhận cân nặng đầu tiên ở trên nhé!</p>';
      return;
    }
    var rows = [];
    for (var i = 0; i < log.length; i++) {
      var entry = log[i];
      var prev = i > 0 ? log[i - 1] : null;
      var delta = prev ? Math.round((entry.weightKg - prev.weightKg) * 10) / 10 : null;
      var cat = bmiCategory(entry.bmi);
      var deltaHtml = delta == null
        ? '<span class="text-muted small">Mốc đầu tiên</span>'
        : delta === 0
          ? '<span class="text-muted small">Không đổi</span>'
          : '<span class="small ' + (delta > 0 ? 'text-danger' : 'text-success') + '"><i class="bi bi-arrow-' + (delta > 0 ? 'up' : 'down') + '-short"></i> ' + Math.abs(delta) + ' kg</span>';
      rows.push(
        '<div class="log-row">' +
          '<div class="fw-semibold">' + formatVNDate(entry.date) + '</div>' +
          '<div>' + entry.weightKg + ' kg</div>' +
          '<div><span class="badge text-bg-' + cat.cls + '">' + entry.bmi + ' · ' + cat.label + '</span></div>' +
          '<div>' + deltaHtml + '</div>' +
        '</div>'
      );
    }
    listEl.innerHTML = rows.reverse().join('');
  }

  function renderFoodHistory() {
    var list = getFoodHistory().slice(0, 8);
    var wrap = document.getElementById('foodHistoryList');
    if (!list.length) {
      wrap.innerHTML = '<p class="text-muted small mb-0">Chưa có món nào — thử quay vòng quay hoặc mở hộp quà ở trang Gợi Ý Ngay xem sao!</p>';
      return;
    }
    wrap.innerHTML = list.map(function (item) {
      return '<a class="pick-item is-static" href="chi-tiet-mon-an.html?id=' + item.id + '">' +
        '<img src="' + item.image + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' +
        '<div class="pi-text"><span class="pi-name">' + item.name + '</span>' +
        '<span class="small text-muted">' + item.calories + ' kcal • ' + timeAgo(item.ts) + '</span></div>' +
        '</a>';
    }).join('');
  }

  var currentPeriod = 'week';
  paintSummary();
  renderTrend(currentPeriod);
  renderLogList();
  renderFoodHistory();

  document.getElementById('logDate').value = toLocalDateStr();
  document.getElementById('logDate').max = toLocalDateStr();

  document.getElementById('logForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var date = document.getElementById('logDate').value;
    var weight = parseFloat(document.getElementById('logWeight').value);
    if (!date || !weight) { showToast('error', 'Nhập đủ ngày và cân nặng giúp mình nhé'); return; }
    addHealthLogEntry(date, weight, profile.heightCm);
    profile = getHealthProfile(); // đồng bộ lại cân nặng mới nhất vừa được health.js cập nhật vào hồ sơ
    paintSummary();
    renderTrend(currentPeriod);
    renderLogList();
    document.getElementById('logForm').reset();
    document.getElementById('logDate').value = toLocalDateStr();
    document.getElementById('logDate').max = toLocalDateStr();
    showToast('success', 'Đã ghi nhận cân nặng 📈');
  });

  document.querySelectorAll('#trendSwitch button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentPeriod = btn.dataset.period;
      document.querySelectorAll('#trendSwitch button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      renderTrend(currentPeriod);
    });
  });
});
