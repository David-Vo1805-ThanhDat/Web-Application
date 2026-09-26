/* components/table.js — Tiện ích cho bảng dữ liệu: chọn nhiều dòng bằng checkbox (tick tất cả, trạng thái lưng chừng). */
(function () {
  'use strict';
  var D = window.Dom;

  // Table.selection(tableEl, { onChange(ids) }) → { ids(), clear() }
  // Yêu cầu: <input class="check" data-check-all> ở tiêu đề, <input class="check" data-check-row value="<id>"> ở mỗi dòng.
  function selection(root, opts) {
    var selected = {};
    function rows() { return D.$$('[data-check-row]', root); }
    function sync() {
      var all = D.$('[data-check-all]', root), rs = rows(), n = rs.filter(function (r) { return r.checked; }).length;
      if (all) { all.checked = rs.length > 0 && n === rs.length; all.indeterminate = n > 0 && n < rs.length; }
      rs.forEach(function (r) { var tr = r.closest('tr'); if (tr) tr.classList.toggle('is-selected', r.checked); });
      selected = {}; rs.forEach(function (r) { if (r.checked) selected[r.value] = true; });
      if (opts.onChange) opts.onChange(Object.keys(selected));
    }
    root.addEventListener('change', function (e) {
      if (e.target.matches('[data-check-all]')) { rows().forEach(function (r) { r.checked = e.target.checked; }); sync(); }
      else if (e.target.matches('[data-check-row]')) sync();
    });
    return {
      ids: function () { return Object.keys(selected); },
      clear: function () { rows().forEach(function (r) { r.checked = false; }); var a = D.$('[data-check-all]', root); if (a) a.checked = false; sync(); },
      refresh: sync,
    };
  }

  window.Table = { selection: selection };
})();
