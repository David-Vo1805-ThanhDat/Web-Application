/* core/format.js — Định dạng số, tiền, ngày, "x phút trước" theo kiểu Việt Nam. */
(function () {
  'use strict';

  function int(n) { return new Intl.NumberFormat('vi-VN').format(Math.round(Number(n) || 0)); }
  function dec(n, digits) { return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(n) || 0); }
  function vnd(n) { return int(n) + 'đ'; }
  function pct(n, digits) { return dec(n, digits == null ? 1 : digits) + '%'; }

  function pad(n) { return String(n).padStart(2, '0'); }
  function dmy(d) { d = new Date(d); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function hm(d) { d = new Date(d); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  var DOW = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  function dowDmy(d) { d = new Date(d); return DOW[d.getDay()] + ', ' + dmy(d); }

  function ago(ts) {
    var min = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
    if (min < 1) return 'vừa xong';
    if (min < 60) return min + ' phút trước';
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + ' giờ trước';
    var day = Math.floor(hr / 24);
    if (day < 7) return day + ' ngày trước';
    return dmy(ts);
  }

  // Nhóm sự kiện theo ngày: "Hôm nay" / "Hôm qua" / dd/mm/yyyy
  function dayLabel(ts) {
    var d = new Date(ts); d.setHours(0, 0, 0, 0);
    var t = new Date(); t.setHours(0, 0, 0, 0);
    var diff = Math.round((t - d) / 86400000);
    return diff === 0 ? 'Hôm nay' : diff === 1 ? 'Hôm qua' : dmy(d);
  }

  window.Fmt = { int: int, dec: dec, vnd: vnd, pct: pct, dmy: dmy, hm: hm, dowDmy: dowDmy, ago: ago, dayLabel: dayLabel };
})();
