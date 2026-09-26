/* components/toast.js — Thông báo nổi: Toast.success/error/info(tiêu đề, nội dung). Tự đóng sau 4 giây. */
(function () {
  'use strict';
  var D = window.Dom;

  function show(kind, iconName, title, msg) {
    var stack = document.getElementById('toastStack'); if (!stack) return;
    var el = document.createElement('div');
    el.className = 'toast toast-' + kind; el.setAttribute('role', 'status');
    el.innerHTML = '<span class="toast-icon">' + D.icon(iconName) + '</span>' +
      '<div class="toast-body"><span class="toast-title">' + D.esc(title) + '</span>' + (msg ? '<span class="toast-msg">' + D.esc(msg) + '</span>' : '') + '</div>' +
      '<button class="toast-close" type="button" aria-label="Đóng">' + D.icon('x') + '</button>';
    function close() { el.classList.add('is-leaving'); setTimeout(function () { el.remove(); }, 220); }
    el.querySelector('.toast-close').addEventListener('click', close);
    stack.appendChild(el);
    setTimeout(close, 4200);
  }

  window.Toast = {
    success: function (t, m) { show('success', 'check', t, m); },
    error: function (t, m) { show('error', 'x', t, m); },
    info: function (t, m) { show('info', 'bell', t, m); },
  };
})();
