/* pages/nguoi-dung.js — Quản lý người dùng: thống kê, tìm/lọc/sắp xếp, xem hồ sơ, khoá/mở khoá, xuất CSV, phân trang. */
(function () {
  'use strict';
  var D = window.Dom, F = window.Fmt;
  var STATUS = { active: ['Đang hoạt động', 'b-green'], unverified: ['Chưa xác thực', 'b-amber'], locked: ['Tạm khoá', 'b-rose'] };
  var ROLE = { member: 'Thành viên', moderator: 'Điều hành viên' };
  var state = { q: '', status: 'all', role: 'all', sort: 'new', page: 1 };

  function avatar(u, cls) { return '<span class="avatar ' + D.colorClass(u.email) + (cls ? ' ' + cls : '') + '">' + D.initial(u.name) + '</span>'; }

  function rowHtml(u) {
    var st = STATUS[u.status], locked = u.status === 'locked';
    return '<tr data-id="' + u.id + '"><td class="col-check"><input class="check" type="checkbox" data-check-row aria-label="Chọn ' + D.esc(u.name) + '"></td>' +
      '<td><div class="cell-main">' + avatar(u) + '<div class="cell-text"><span class="cell-title">' + D.esc(u.name) + '</span><span class="cell-sub">' + D.esc(u.email) + '</span></div></div></td>' +
      '<td>' + F.dmy(u.joinedAt) + '</td><td><span class="fav">' + D.icon('heart') + u.favorites + '</span></td>' +
      '<td><span class="badge ' + (u.hasHealthProfile ? 'b-blue' : 'b-gray') + '">' + (u.hasHealthProfile ? 'Đã tạo' : 'Chưa tạo') + '</span></td>' +
      '<td>' + ROLE[u.role] + '</td><td><span class="badge ' + st[1] + '">' + st[0] + '</span></td>' +
      '<td class="col-actions"><div class="row-actions"><button class="icon-action" type="button" data-view="' + u.id + '" aria-label="Xem ' + D.esc(u.name) + '">' + D.icon('eye') + '</button>' +
      '<button class="icon-action ' + (locked ? 'is-ok' : 'is-danger') + '" type="button" data-lock="' + u.id + '" aria-label="' + (locked ? 'Mở khoá ' : 'Khoá ') + D.esc(u.name) + '">' + D.icon(locked ? 'unlock' : 'lock') + '</button></div></td></tr>';
  }

  function loadStats() {
    return window.Api.call('users.stats').then(function (s) {
      D.$('[data-stat=total]').textContent = F.int(s.total); D.$('[data-note=total]').textContent = '+' + s.new30 + ' trong 30 ngày';
      D.$('[data-stat=active]').textContent = F.int(s.activeToday); D.$('[data-note=active]').textContent = Math.round(s.activeToday / s.total * 100) + '% tổng số';
      D.$('[data-stat=health]').textContent = F.int(s.hasHealth); D.$('[data-note=health]').textContent = Math.round(s.hasHealth / s.total * 100) + '% người dùng';
      D.$('[data-stat=locked]').textContent = F.int(s.locked); D.$('[data-note=locked]').textContent = F.dec(s.locked / s.total * 100, 1) + '% người dùng';
      D.$('#usersSub').textContent = F.int(s.total) + ' người dùng đã đăng ký trên nền tảng';
    });
  }

  function load() {
    return window.Api.call('users.list', Object.assign({}, state, { pageSize: 7 })).then(function (r) {
      var empty = r.total === 0; D.$('#tableScroll').hidden = empty; D.$('#usersEmpty').hidden = !empty;
      D.$('#usersBody').innerHTML = r.items.map(rowHtml).join('');
      D.$('#footInfo').textContent = empty ? '' : 'Hiển thị ' + ((r.page - 1) * r.pageSize + 1) + '–' + Math.min(r.page * r.pageSize, r.total) + ' trong tổng số ' + F.int(r.total) + ' người dùng';
      window.Pagination.render(D.$('#pager'), { page: r.page, pages: r.pages, onChange: function (p) { state.page = p; load(); } });
      if (empty) D.$('#pager').innerHTML = '';
      return r;
    });
  }
  function reload(reset) { if (reset) state.page = 1; return load(); }

  function toggleLock(id) {
    window.Api.call('users.get', { id: id }).then(function (u) {
      var lock = u.status !== 'locked';
      var go = function () {
        window.Api.call('users.setStatus', { id: id, status: lock ? 'locked' : 'active' }).then(function () {
          window.Toast.success(lock ? 'Đã tạm khoá tài khoản' : 'Đã mở khoá tài khoản', u.email); loadStats(); load();
        });
      };
      if (!lock) return go();
      window.Modal.confirm({ title: 'Tạm khoá tài khoản?', text: 'Người dùng ' + u.name + ' (' + u.email + ') sẽ không thể đăng nhập cho tới khi được mở khoá.', confirmText: 'Tạm khoá', confirmIcon: 'lock' }).then(function (ok) { if (ok) go(); });
    });
  }

  function view(id) {
    window.Api.call('users.get', { id: id }).then(function (u) {
      var st = STATUS[u.status];
      var o = window.Modal.open('<div class="modal-head"><h3 class="modal-title">Hồ sơ người dùng</h3><button class="modal-close" type="button" data-x aria-label="Đóng">' + D.icon('x') + '</button></div>' +
        '<div class="modal-body profile-grid"><div class="profile-head">' + avatar(u) + '<div><b>' + D.esc(u.name) + '</b><small>' + D.esc(u.email) + '</small></div></div>' +
        '<div class="kv-list"><div class="kv-row"><span>Ngày tham gia</span><b>' + F.dmy(u.joinedAt) + '</b></div><div class="kv-row"><span>Món yêu thích</span><b>' + u.favorites + '</b></div>' +
        '<div class="kv-row"><span>Hồ sơ sức khỏe</span><b>' + (u.hasHealthProfile ? 'Đã tạo' : 'Chưa tạo') + '</b></div><div class="kv-row"><span>Vai trò</span><b>' + ROLE[u.role] + '</b></div>' +
        '<div class="kv-row"><span>Trạng thái</span><span class="badge ' + st[1] + '">' + st[0] + '</span></div></div></div>', 'md');
      o.querySelector('[data-x]').addEventListener('click', function () { o.close(false); });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    window.Table.selection(D.$('#usersTable'), { onChange: function () {} });
    loadStats(); load();
    D.$('#fQ').addEventListener('input', D.debounce(function () { state.q = this.value.trim(); reload(true); }, 220));
    [['#fStatus', 'status'], ['#fRole', 'role'], ['#fSort', 'sort']].forEach(function (p) { D.$(p[0]).addEventListener('change', function () { state[p[1]] = this.value; reload(true); }); });
    D.$('#clearFilters').addEventListener('click', function () {
      state = { q: '', status: 'all', role: 'all', sort: 'new', page: 1 }; D.$('#fQ').value = '';
      D.$('#fStatus').value = 'all'; D.$('#fRole').value = 'all'; D.$('#fSort').value = 'new'; load();
    });
    D.on(D.$('#usersBody'), 'click', '[data-view]', function () { view(+this.dataset.view); });
    D.on(D.$('#usersBody'), 'click', '[data-lock]', function () { toggleLock(+this.dataset.lock); });
    D.$('#exportBtn').addEventListener('click', function () {
      window.Api.call('users.list', Object.assign({}, state, { page: 1, pageSize: 5000 })).then(function (r) {
        var rows = [['ID', 'Họ tên', 'Email', 'Ngày tham gia', 'Yêu thích', 'Hồ sơ sức khỏe', 'Vai trò', 'Trạng thái']];
        r.items.forEach(function (u) { rows.push([u.id, u.name, u.email, F.dmy(u.joinedAt), u.favorites, u.hasHealthProfile ? 'Đã tạo' : 'Chưa tạo', ROLE[u.role], STATUS[u.status][0]]); });
        window.Download.csv('nguoi-dung-' + new Date().toISOString().slice(0, 10) + '.csv', rows);
        window.Toast.success('Đã xuất danh sách', F.int(r.total) + ' người dùng đã được tải xuống.');
      });
    });
  });
})();
