/* pages/nhat-ky.js — Nhật ký hoạt động: lọc theo loại/người/khoảng ngày, nhóm theo ngày, phân trang, xuất CSV. */
(function () {
  'use strict';
  var D = window.Dom, F = window.Fmt, T = window.AuditTypes;
  var state = { q: '', type: 'all', actor: 'all', days: 7, page: 1 };
  var actorsFilled = false;

  function row(e) {
    var t = T[e.type] || T.edit;
    return '<div class="log-row"><span class="tint tint-' + t.tone + '">' + D.icon(t.icon) + '</span><div class="log-text"><div class="log-line"><b>' + D.esc(e.actor) + '</b> ' + D.esc(e.text) + '</div><span class="log-ip">IP: ' + D.esc(e.ip) + '</span></div><span class="log-time">' + F.hm(e.ts) + '</span></div>';
  }

  function load() {
    return window.Api.call('audit.list', Object.assign({}, state, { pageSize: 8 })).then(function (r) {
      if (!actorsFilled) {
        actorsFilled = true;
        D.$('#fActor').innerHTML = '<option value="all">Người thực hiện: Tất cả</option>' + r.actors.map(function (a) { return '<option value="' + D.esc(a) + '">' + D.esc(a) + '</option>'; }).join('');
      }
      var empty = r.total === 0; D.$('#logEmpty').hidden = !empty;
      var groups = [], byKey = {};
      r.items.forEach(function (e) { var k = F.dayLabel(e.ts); if (!byKey[k]) { byKey[k] = { label: k, items: [] }; groups.push(byKey[k]); } byKey[k].items.push(e); });
      D.$('#logList').innerHTML = groups.map(function (g) { return '<div class="log-group"><div class="log-group-title">' + D.esc(g.label) + '</div>' + g.items.map(row).join('') + '</div>'; }).join('');
      D.$('#footInfo').textContent = empty ? '' : 'Hiển thị ' + r.items.length + ' trong tổng số ' + F.int(r.total) + ' sự kiện';
      window.Pagination.render(D.$('#pager'), { page: r.page, pages: r.pages, onChange: function (p) { state.page = p; load(); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
      if (empty) D.$('#pager').innerHTML = '';
    });
  }
  function reload() { state.page = 1; return load(); }

  document.addEventListener('DOMContentLoaded', function () {
    D.$('#fType').innerHTML = '<option value="all">Loại: Tất cả</option>' + Object.keys(T).map(function (k) { return '<option value="' + k + '">' + D.esc(T[k].label) + '</option>'; }).join('');
    load();
    D.$('#fQ').addEventListener('input', D.debounce(function () { state.q = this.value.trim(); reload(); }, 220));
    D.$('#fType').addEventListener('change', function () { state.type = this.value; reload(); });
    D.$('#fActor').addEventListener('change', function () { state.actor = this.value; reload(); });
    D.$('#fDays').addEventListener('change', function () { state.days = +this.value; reload(); });
    D.$('#clearFilters').addEventListener('click', function () {
      state = { q: '', type: 'all', actor: 'all', days: 7, page: 1 }; D.$('#fQ').value = ''; D.$('#fType').value = 'all'; D.$('#fActor').value = 'all'; D.$('#fDays').value = '7'; load();
    });
    D.$('#exportBtn').addEventListener('click', function () {
      window.Api.call('audit.list', Object.assign({}, state, { page: 1, pageSize: 5000 })).then(function (r) {
        var rows = [['Thời gian', 'Loại', 'Người thực hiện', 'Hành động', 'IP']];
        r.items.forEach(function (e) { rows.push([F.dmy(e.ts) + ' ' + F.hm(e.ts), (T[e.type] || {}).label || e.type, e.actor, e.text, e.ip]); });
        window.Download.csv('nhat-ky-' + new Date().toISOString().slice(0, 10) + '.csv', rows);
        window.Toast.success('Đã xuất nhật ký', F.int(r.total) + ' sự kiện đã được tải xuống.');
      });
    });
  });
})();
