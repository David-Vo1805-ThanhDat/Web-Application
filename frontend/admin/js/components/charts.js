/* components/charts.js — Biểu đồ tự vẽ (HTML/SVG thuần, không thư viện): cột chồng, donut, thanh ngang, đường, cột mini. */
(function () {
  'use strict';
  var D = window.Dom, F = window.Fmt;

  var TONE = { orange: '#ea580c', blue: '#2563eb', purple: '#7c3aed', green: '#15a34a', amber: '#f59e0b', rose: '#e11d48', sky: '#0ea5e9', navy: '#1f2a44' };

  // Cột chồng: data = [{ label, values: [sáng, trưa, ăn vặt, tối] }], unit = số lượt ứng với 1px chiều cao.
  function stack(el, data, opts) {
    if (!data.length) { el.textContent = 'Chưa có dữ liệu sự kiện theo thời gian.'; return; }
    opts = opts || {};
    var tones = opts.tones || ['orange', 'blue', 'purple', 'green'], unit = opts.unit || 2.36;
    var max = Math.max.apply(null, data.map(function (d) { return d.values.reduce(function (a, b) { return a + b; }, 0); }));
    el.innerHTML = '<div class="stack-chart"><div class="stack-cols" style="height:' + (Math.ceil(max / unit) + 30) + 'px">' + data.map(function (d) {
      var total = d.values.reduce(function (a, b) { return a + b; }, 0);
      return '<div class="stack-col" title="' + D.esc(d.label + ': ' + F.int(total) + ' lượt') + '"><div class="stack-bar">' + d.values.map(function (v, i) {
        return '<div class="stack-seg" style="height:' + Math.max(0, v / unit) + 'px;background:' + TONE[tones[i]] + '"></div>';
      }).join('') + '</div><span class="stack-label">' + D.esc(d.label) + '</span></div>';
    }).join('') + '</div>' + (opts.legend ? '<div class="chart-legend">' + opts.legend.map(function (l, i) {
      return '<span class="legend-item"><span class="legend-dot dot-' + tones[i] + '"></span>' + D.esc(l) + '</span>';
    }).join('') + '</div>' : '') + '</div>';
  }

  // Donut: items = [{ count, tone }]
  function donut(el, items) {
    var total = items.reduce(function (s, x) { return s + x.count; }, 0) || 1, r = 52, C = 2 * Math.PI * r, acc = 0, gap = 2;
    var circles = items.filter(function (x) { return x.count > 0; }).map(function (x) {
      var len = Math.max(0, x.count / total * C - gap), off = acc; acc += x.count / total * C;
      return '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="' + TONE[x.tone] + '" stroke-width="24" stroke-dasharray="' + len + ' ' + (C - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 70 70)"/>';
    }).join('');
    el.innerHTML = '<svg class="donut" viewBox="0 0 140 140" role="img" aria-label="Biểu đồ tròn">' + circles + '</svg>';
  }

  // Thanh ngang xếp hạng: items = [{ label, value, tone }]
  function hbars(el, items, opts) {
    var max = (opts && opts.max) || Math.max.apply(null, items.map(function (i) { return i.value; })) || 1;
    el.innerHTML = '<div class="hbar-list">' + items.map(function (i) {
      return '<div class="hbar"><div class="hbar-top"><span>' + D.esc(i.label) + '</span><b>' + F.int(i.value) + (opts && opts.unit ? ' ' + opts.unit : '') + '</b></div>' +
        '<div class="hbar-track"><div class="hbar-fill" style="width:' + (i.value / max * 100) + '%;background:' + TONE[i.tone || 'orange'] + '"></div></div></div>';
    }).join('') + '</div>';
  }

  // Đường + vùng: series = [{ users, spins }]
  function lines(el, series) {
    if (series.length < 2) { el.textContent = 'Chưa có dữ liệu sự kiện theo thời gian.'; return; }
    var W = 1000, H = 220, pad = 10, n = series.length;
    var max = Math.max.apply(null, series.map(function (p) { return Math.max(p.users, p.spins); })) * 1.08;
    function x(i) { return pad + i * (W - pad * 2) / (n - 1); }
    function y(v) { return H - 20 - v / max * (H - 40); }
    function path(key) { return series.map(function (p, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p[key]).toFixed(1); }).join(' '); }
    var grid = [0, 1, 2, 3].map(function (i) { var yy = 20 + i * (H - 40) / 3; return '<line class="grid-line" x1="0" x2="' + W + '" y1="' + yy + '" y2="' + yy + '"/>'; }).join('');
    el.innerHTML = '<svg class="line-chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="Biểu đồ tăng trưởng">' + grid +
      '<path class="area" d="' + path('spins') + ' L' + x(n - 1) + ' ' + (H - 20) + ' L' + x(0) + ' ' + (H - 20) + ' Z"/>' +
      '<path class="line-b" d="' + path('spins') + '"/><path class="line-a" d="' + path('users') + '"/></svg>';
  }

  // Cột mini 7 ngày (bản di động): đỉnh cao nhất tô cam đậm
  function miniBars(el, data) {
    var max = Math.max.apply(null, data.map(function (d) { return d.total; }));
    el.innerHTML = '<div class="mini-bars">' + data.map(function (d) {
      return '<div class="mini-bar-col"><div class="mini-bar' + (d.total === max ? ' is-peak' : '') + '" style="height:' + Math.round(d.total / max * 68) + 'px"></div><span>' + D.esc(d.label) + '</span></div>';
    }).join('') + '</div>';
  }

  window.Charts = { TONE: TONE, stack: stack, donut: donut, hbars: hbars, lines: lines, miniBars: miniBars };
})();
