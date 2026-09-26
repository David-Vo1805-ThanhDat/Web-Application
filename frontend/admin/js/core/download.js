/* core/download.js — Tải file xuống từ trình duyệt: CSV (có BOM để Excel đọc đúng tiếng Việt) và JSON. */
(function () {
  'use strict';

  function save(name, content, mime) {
    var blob = new Blob([content], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // rows: mảng các dòng, mỗi dòng là mảng ô
  function csv(name, rows) {
    var body = rows.map(function (r) {
      return r.map(function (c) { c = String(c == null ? '' : c); return /[",\n;]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(',');
    }).join('\r\n');
    save(name, '﻿' + body, 'text/csv;charset=utf-8');
  }
  function json(name, data) { save(name, JSON.stringify(data, null, 2), 'application/json'); }

  window.Download = { csv: csv, json: json };
})();
