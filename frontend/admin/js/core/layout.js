/* core/layout.js — Hành vi chung của khung admin: ngày, hồ sơ admin, đăng xuất, ngăn kéo mobile,
   số đếm trên menu, chuông thông báo, tìm kiếm toàn cục (Ctrl K). Chạy trên mọi trang admin. */
(function () {
  'use strict';
  var D = window.Dom, F = window.Fmt;

  document.addEventListener('DOMContentLoaded', function () {
    var dateEl = D.$('#topbarDate'); if (dateEl) dateEl.textContent = F.dowDmy(new Date());

    // ----- Hồ sơ admin + đăng xuất -----
    window.Api.call('me').then(function (me) {
      D.$$('[data-admin-name]').forEach(function (e) { e.textContent = me.name; });
      var ini = me.name.trim().split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
      D.$$('[data-admin-initials]').forEach(function (e) { e.textContent = ini; });
    });
    var logout = D.$('#logoutBtn');
    if (logout) logout.addEventListener('click', function () {
      window.Modal.confirm({ title: 'Đăng xuất?', text: 'Bạn sẽ thoát khỏi bảng quản trị trên trình duyệt này.', confirmText: 'Đăng xuất', danger: false, confirmIcon: 'logout' }).then(function (ok) {
        if (!ok) return;
        window.Api.logout().then(function () { location.href = '../user/index.html'; });
      });
    });

    // ----- Ngăn kéo menu trên di động -----
    var sidebar = D.$('#sidebar'), backdrop = D.$('.sidebar-backdrop');
    function drawer(open) { sidebar.classList.toggle('is-open', open); backdrop.classList.toggle('is-open', open); }
    D.$$('[data-open-drawer]').forEach(function (b) { b.addEventListener('click', function () { drawer(true); }); });
    D.$$('[data-close-drawer]').forEach(function (b) { b.addEventListener('click', function () { drawer(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') drawer(false); });

    // ----- Số đếm trên menu + chuông -----
    window.Api.call('counts').then(function (c) {
      D.$$('[data-count]').forEach(function (b) { var v = c[b.getAttribute('data-count')]; if (v != null) { b.textContent = v; b.hidden = false; } });
      var menu = D.$('#notifMenu'), btn = D.$('#notifBtn');
      if (!menu || !btn) return;
      var items = [];
      if (c.recipesToReview) items.push('<a class="dropdown-item" href="cong-thuc.html?status=review"><span class="tint tint-amber">' + D.icon('pulse') + '</span><span><b>' + c.recipesToReview + ' công thức cần xem lại</b><small>Người nấu thử phản hồi nguyên liệu lệch</small></span></a>');
      if (c.feedbackNew) items.push('<a class="dropdown-item" href="danh-gia.html"><span class="tint tint-purple">' + D.icon('mail') + '</span><span><b>' + c.feedbackNew + ' góp ý chưa phản hồi</b><small>Từ form liên hệ</small></span></a>');
      menu.innerHTML = '<div class="dropdown-head">Thông báo</div>' + (items.join('') || '<div class="dropdown-empty">Không có thông báo mới</div>');
      window.Dropdown.bind(btn, menu);
      var mob = D.$('#notifBtnMobile'); if (mob) mob.addEventListener('click', function () { location.href = c.recipesToReview && !c.feedbackNew ? 'cong-thuc.html?status=review' : 'danh-gia.html'; });
      if (!items.length) btn.classList.remove('has-dot');
    });

    // ----- Tìm kiếm toàn cục -----
    var input = D.$('#globalSearchInput'), box = D.$('#globalSearchResults');
    if (!input) return;
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.focus(); input.select(); }
      if (e.key === 'Escape' && document.activeElement === input) { input.blur(); box.hidden = true; }
    });
    document.addEventListener('click', function (e) { if (!D.$('#globalSearch').contains(e.target)) box.hidden = true; });
    function group(title, arr, render) { return arr.length ? '<div class="result-group-title">' + title + '</div>' + arr.map(render).join('') : ''; }
    input.addEventListener('input', D.debounce(function () {
      var q = input.value.trim(); if (q.length < 2) { box.hidden = true; return; }
      window.Api.call('search', { q: q }).then(function (r) {
        var html = group('Món ăn', r.foods, function (f) { return '<a class="dropdown-item" href="mon-an-sua.html?id=' + encodeURIComponent(f.id) + '"><span class="tint tint-orange">' + D.icon('bowl') + '</span><span><b>' + D.esc(f.name) + '</b><small>' + D.esc(f.englishName) + '</small></span></a>'; }) +
          group('Người dùng', r.users, function (u) { return '<a class="dropdown-item" href="nguoi-dung.html?q=' + encodeURIComponent(u.email) + '"><span class="tint tint-blue">' + D.icon('users') + '</span><span><b>' + D.esc(u.name) + '</b><small>' + D.esc(u.email) + '</small></span></a>'; }) +
          group('Quán ăn', r.restaurants, function (x) { return '<a class="dropdown-item" href="quan-an.html?q=' + encodeURIComponent(x.name) + '"><span class="tint tint-green">' + D.icon('store') + '</span><span><b>' + D.esc(x.name) + '</b><small>' + D.esc(x.address) + '</small></span></a>'; });
        box.innerHTML = html || '<div class="dropdown-empty">Không tìm thấy kết quả cho “' + D.esc(q) + '”</div>';
        box.hidden = false;
      });
    }, 220));
    input.addEventListener('focus', function () { if (box.innerHTML && input.value.trim().length >= 2) box.hidden = false; });
  });
})();
