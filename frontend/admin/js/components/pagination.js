/* components/pagination.js — Phân trang: Pagination.render(container, { page, pages, onChange }). */
(function () {
  'use strict';
  var D = window.Dom;

  // Trả về danh sách số trang có dấu "…" như thiết kế: 1 2 3 … N
  function pageList(page, pages) {
    if (pages <= 5) return Array.from({ length: pages }, function (_, i) { return i + 1; });
    var set = { 1: 1, 2: 1, 3: 1 }; set[pages] = 1; set[page] = 1; if (page > 1) set[page - 1] = 1; if (page < pages) set[page + 1] = 1;
    var nums = Object.keys(set).map(Number).sort(function (a, b) { return a - b; }), out = [];
    nums.forEach(function (n, i) { if (i && n - nums[i - 1] > 1) out.push('gap'); out.push(n); });
    return out;
  }

  function render(container, opts) {
    var page = opts.page, pages = opts.pages;
    container.innerHTML = '<div class="pager">' +
      '<button type="button" class="pager-arrow" data-go="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + ' aria-label="Trang trước">' + D.icon('chevl') + '</button>' +
      pageList(page, pages).map(function (n) {
        return n === 'gap' ? '<span class="pager-gap">…</span>' : '<button type="button" data-go="' + n + '"' + (n === page ? ' class="is-active" aria-current="page"' : '') + '>' + n + '</button>';
      }).join('') +
      '<button type="button" class="pager-arrow" data-go="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + ' aria-label="Trang sau">' + D.icon('chevr') + '</button></div>';
    D.$$('button[data-go]', container).forEach(function (b) {
      b.addEventListener('click', function () { if (!b.disabled) opts.onChange(Number(b.getAttribute('data-go'))); });
    });
  }

  window.Pagination = { render: render };
})();
