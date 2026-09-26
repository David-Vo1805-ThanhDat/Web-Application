/* components/dropdown.js — Menu thả: Dropdown.bind(nút, menu) bật/tắt, đóng khi bấm ra ngoài hoặc nhấn Esc. */
(function () {
  'use strict';

  var open = [];
  function closeAll(except) {
    open = open.filter(function (d) {
      if (d.menu === except) return true;
      d.menu.hidden = true; d.btn.setAttribute('aria-expanded', 'false'); return false;
    });
  }
  document.addEventListener('click', function (e) {
    var keep = open.filter(function (d) { return d.menu.contains(e.target) || d.btn.contains(e.target); })[0];
    closeAll(keep ? keep.menu : null);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });

  function bind(btn, menu, onOpen) {
    btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = menu.hidden;
      closeAll(willOpen ? null : undefined);
      if (willOpen) { if (onOpen) onOpen(); menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); open.push({ btn: btn, menu: menu }); }
    });
  }

  window.Dropdown = { bind: bind, closeAll: closeAll };
})();
