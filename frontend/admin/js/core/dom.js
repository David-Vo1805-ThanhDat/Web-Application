/* core/dom.js — Tiện ích DOM dùng chung: chọn phần tử, thoát HTML, tạo icon, gọi hàm trễ, uỷ quyền sự kiện. */
(function () {
  'use strict';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Icon từ sprite (xem sprite() trong tools/build/admin/layout.py). size: tên lớp ic-14/ic-18...
  function icon(name, cls) {
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, wait || 200);
    };
  }

  // on(root, 'click', '.selector', handler) — uỷ quyền sự kiện cho phần tử sinh động.
  function on(root, type, sel, handler) {
    root.addEventListener(type, function (e) {
      var target = e.target.closest ? e.target.closest(sel) : null;
      if (target && root.contains(target)) handler.call(target, e, target);
    });
  }

  function html(el, str) { el.innerHTML = str; return el; }

  // Màu chữ cái đầu (thumb/avatar) ổn định theo chuỗi
  var PALETTE = ['c-amber', 'c-purple', 'c-rose', 'c-orange', 'c-blue', 'c-green', 'c-sky'];
  function colorClass(key) {
    var h = 0, s = String(key || '');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return PALETTE[h % PALETTE.length];
  }
  function initial(name) {
    var w = String(name || '?').trim().split(/\s+/);
    return (w[w.length - 1][0] || '?').toUpperCase();
  }

  window.$ = $; window.$$ = $$;
  window.Dom = { $: $, $$: $$, esc: esc, icon: icon, debounce: debounce, on: on, html: html, colorClass: colorClass, initial: initial };
})();
