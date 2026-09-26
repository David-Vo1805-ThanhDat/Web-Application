/* components/modal.js — Hộp thoại: Modal.confirm() xác nhận (xoá...), Modal.form() biểu mẫu, Modal.open() tuỳ ý. */
(function () {
  'use strict';
  var D = window.Dom;

  function create(inner, size) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = '<div class="modal' + (size ? ' modal-' + size : '') + '" role="dialog" aria-modal="true">' + inner + '</div>';
    document.body.appendChild(overlay);
    var prev = document.activeElement;
    function close(result) {
      document.removeEventListener('keydown', onKey);
      overlay.remove(); if (prev && prev.focus) prev.focus();
      if (overlay._resolve) overlay._resolve(result);
    }
    function onKey(e) { if (e.key === 'Escape') close(false); }
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) close(false); });
    overlay.close = close;
    return overlay;
  }

  // Modal.confirm({ title, text, confirmText, cancelText, danger, icon }) → Promise<boolean>
  function confirm(opts) {
    var danger = opts.danger !== false;
    return new Promise(function (resolve) {
      var o = create(
        '<span class="modal-icon' + (danger ? '' : ' is-orange') + '">' + D.icon(opts.icon || 'warn') + '</span>' +
        '<div class="modal-text"><h3 class="modal-title">' + D.esc(opts.title) + '</h3><p class="modal-desc">' + D.esc(opts.text || '') + '</p></div>' +
        '<div class="modal-actions"><button class="btn btn-ghost" type="button" data-cancel>' + D.esc(opts.cancelText || 'Huỷ') + '</button>' +
        '<button class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '" type="button" data-ok>' + (opts.confirmIcon === false ? '' : D.icon(opts.confirmIcon || (danger ? 'trash' : 'check'))) + D.esc(opts.confirmText || 'Xác nhận') + '</button></div>');
      o._resolve = resolve;
      o.querySelector('[data-cancel]').addEventListener('click', function () { o.close(false); });
      var ok = o.querySelector('[data-ok]'); ok.addEventListener('click', function () { o.close(true); }); ok.focus();
    });
  }

  // Modal.form({ title, html, size, submitText, onSubmit(form, close) }) — onSubmit trả Promise; lỗi thì giữ hộp thoại mở.
  function form(opts) {
    var o = create(
      '<div class="modal-head"><h3 class="modal-title">' + D.esc(opts.title) + '</h3><button class="modal-close" type="button" data-cancel aria-label="Đóng">' + D.icon('x') + '</button></div>' +
      '<form class="modal-body" novalidate>' + opts.html + '<div class="modal-actions"><button class="btn btn-ghost" type="button" data-cancel>Huỷ</button>' +
      '<button class="btn btn-primary" type="submit">' + D.esc(opts.submitText || 'Lưu') + '</button></div></form>', opts.size || 'md');
    var f = o.querySelector('form');
    D.$$('[data-cancel]', o).forEach(function (b) { b.addEventListener('click', function () { o.close(false); }); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = f.querySelector('[type=submit]'); btn.disabled = true;
      Promise.resolve(opts.onSubmit(f, o.close)).then(function (keepOpen) { if (keepOpen !== false) o.close(true); }).catch(function () {}).then(function () { btn.disabled = false; });
    });
    var first = f.querySelector('input, select, textarea'); if (first) first.focus();
    return o;
  }

  window.Modal = { confirm: confirm, form: form, open: create };
})();
