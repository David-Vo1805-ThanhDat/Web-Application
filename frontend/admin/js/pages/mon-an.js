/* pages/mon-an.js — Danh sách món ăn: tìm/lọc/sắp xếp, chọn nhiều để ẩn/xoá hàng loạt, xoá từng món, xuất CSV, phân trang. */
(function () {
  'use strict';
  var D = window.Dom, F = window.Fmt;

  var CAT_BADGE = { orange: 'b-orange', blue: 'b-blue', purple: 'b-purple', green: 'b-green', amber: 'b-amber', rose: 'b-rose', sky: 'b-sky' };
  var STATUS = { visible: ['Đang hiển thị', 'b-green'], hidden: ['Đang ẩn', 'b-dark'], pending: ['Chờ duyệt', 'b-amber'] };
  var state = { q: '', category: 'all', meal: 'all', region: 'all', status: 'all', sort: 'no', page: 1 };
  var options = null, selection = null, lastList = null;

  function catInfo(slug) { return options.categories.filter(function (c) { return c.slug === slug; })[0] || { label: slug, tone: 'orange' }; }

  function fillFilters(o) {
    function fill(id, label, arr, val) {
      D.$(id).innerHTML = '<option value="all">' + label + ': Tất cả</option>' + arr.map(function (x) { return '<option value="' + D.esc(x.slug) + '">' + D.esc(x.label) + '</option>'; }).join('');
    }
    fill('#fCategory', 'Danh mục', o.categories); fill('#fMeal', 'Bữa ăn', o.meals); fill('#fRegion', 'Vùng miền', o.regions);
  }

  function rowHtml(f) {
    var c = catInfo(f.category), st = STATUS[f.status];
    return '<tr data-id="' + D.esc(f.id) + '"><td class="col-check"><input class="check" type="checkbox" data-check-row value="' + D.esc(f.id) + '" aria-label="Chọn ' + D.esc(f.name) + '"></td>' +
      '<td class="col-index">' + String(f.no).padStart(2, '0') + '</td>' +
      '<td><div class="cell-main"><span class="thumb thumb-lg ' + D.colorClass(f.id) + '">' + D.initial(f.name) + '</span><div class="cell-text">' +
      '<a class="cell-title" href="mon-an-sua.html?id=' + encodeURIComponent(f.id) + '">' + D.esc(f.name) + '</a><span class="cell-sub">' + D.esc(f.englishName) + '</span></div></div></td>' +
      '<td class="col-cat"><span class="badge ' + CAT_BADGE[c.tone] + '">' + D.esc(c.label) + '</span></td>' +
      '<td class="num money">' + F.vnd(f.price) + '</td><td class="num muted-cell">' + F.int(f.calories) + ' kcal</td>' +
      '<td><span class="rating">' + D.icon('star') + '<b>' + F.dec(f.rating, 1) + '</b><span>(' + f.reviewCount + ')</span></span></td>' +
      '<td><span class="badge ' + st[1] + '">' + st[0] + '</span></td>' +
      '<td class="col-actions"><div class="row-actions"><a class="icon-action" href="mon-an-sua.html?id=' + encodeURIComponent(f.id) + '" aria-label="Sửa ' + D.esc(f.name) + '">' + D.icon('edit') + '</a>' +
      '<button class="icon-action is-danger" type="button" data-delete="' + D.esc(f.id) + '" aria-label="Xoá ' + D.esc(f.name) + '">' + D.icon('trash') + '</button></div></td></tr>';
  }

  function updateSub(all, visible) {
    D.$('#foodsSub').textContent = visible + ' món đang hiển thị trong ứng dụng dành cho người dùng' + (all > visible ? ' · ' + (all - visible) + ' món ẩn hoặc chờ duyệt' : '');
  }

  function load() {
    return window.Api.call('foods.list', Object.assign({}, state, { pageSize: 8 })).then(function (r) {
      lastList = r;
      var empty = r.total === 0;
      D.$('#tableScroll').hidden = empty; D.$('#foodsEmpty').hidden = !empty;
      D.$('#foodsBody').innerHTML = r.items.map(rowHtml).join('');
      D.$('#footInfo').textContent = empty ? '' : 'Hiển thị ' + ((r.page - 1) * r.pageSize + 1) + '–' + Math.min(r.page * r.pageSize, r.total) + ' trong tổng số ' + r.total + ' món';
      window.Pagination.render(D.$('#pager'), { page: r.page, pages: r.pages, onChange: function (p) { state.page = p; load(); D.$('#tableCard').scrollIntoView({ block: 'nearest' }); } });
      if (empty) D.$('#pager').innerHTML = '';
      selection.refresh();
      window.Api.call('foods.list', { pageSize: 1000, status: 'visible' }).then(function (v) { updateSub(r.all, v.total); });
    });
  }

  function reload(resetPage) { if (resetPage) state.page = 1; return load(); }

  function bulkBar(ids) {
    var n = ids.length; D.$('#bulkBar').hidden = n === 0;
    D.$('#bulkText').textContent = 'Đã chọn ' + n + ' món';
    var m = D.$('#bulkMaster'); m.checked = false; m.indeterminate = n > 0;
  }

  function confirmDelete(id) {
    var f = lastList.items.filter(function (x) { return x.id === id; })[0]; if (!f) return;
    window.Modal.confirm({ title: 'Xoá món ăn này?', text: 'Bạn sắp xoá “' + f.name + '” khỏi hệ thống. Món sẽ biến mất khỏi ứng dụng người dùng và không thể khôi phục.', confirmText: 'Xoá món ăn' }).then(function (ok) {
      if (!ok) return;
      window.Api.call('foods.remove', { id: id }).then(function () { window.Toast.success('Đã xoá món ăn', '“' + f.name + '” đã bị xoá khỏi hệ thống.'); reload(); });
    });
  }

  function exportCsv() {
    window.Api.call('foods.list', Object.assign({}, state, { page: 1, pageSize: 1000 })).then(function (r) {
      var rows = [['#', 'ID', 'Tên món', 'Tên tiếng Anh', 'Danh mục', 'Vùng', 'Giá (đ)', 'Calo (kcal)', 'Đánh giá', 'Số đánh giá', 'Trạng thái']];
      r.items.forEach(function (f) { rows.push([f.no, f.id, f.name, f.englishName, catInfo(f.category).label, f.region, f.price, f.calories, f.rating, f.reviewCount, STATUS[f.status][0]]); });
      window.Download.csv('mon-an-' + new Date().toISOString().slice(0, 10) + '.csv', rows);
      window.Toast.success('Đã xuất CSV', r.total + ' món đã được tải xuống.');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    selection = window.Table.selection(D.$('#foodsTable'), { onChange: bulkBar });
    window.Api.call('foods.filterOptions').then(function (o) {
      options = o; fillFilters(o);
      var q = new URLSearchParams(location.search).get('q'); if (q) { state.q = q; D.$('#fQ').value = q; }
      return load();
    });

    D.$('#fQ').addEventListener('input', D.debounce(function () { state.q = this.value.trim(); reload(true); }, 220));
    [['#fCategory', 'category'], ['#fMeal', 'meal'], ['#fRegion', 'region'], ['#fStatus', 'status']].forEach(function (p) {
      D.$(p[0]).addEventListener('change', function () { state[p[1]] = this.value; reload(true); });
    });
    D.$('#clearFilters').addEventListener('click', function () {
      state.q = ''; state.category = state.meal = state.region = state.status = 'all'; D.$('#fQ').value = '';
      ['#fCategory', '#fMeal', '#fRegion', '#fStatus'].forEach(function (s) { D.$(s).value = 'all'; }); reload(true);
    });

    window.Dropdown.bind(D.$('#sortBtn'), D.$('#sortMenu'));
    D.on(D.$('#sortMenu'), 'click', '[data-sort]', function () {
      state.sort = this.getAttribute('data-sort');
      D.$$('#sortMenu .dropdown-item').forEach(function (b) { b.classList.toggle('is-focus', b === this); }, this);
      window.Dropdown.closeAll(); reload(true);
    });

    D.on(D.$('#foodsBody'), 'click', '[data-delete]', function () { confirmDelete(this.getAttribute('data-delete')); });
    D.$('#bulkMaster').addEventListener('click', function () { selection.clear(); });

    D.$('#bulkHide').addEventListener('click', function () {
      var ids = selection.ids();
      window.Modal.confirm({ title: 'Xác nhận thao tác hàng loạt', text: 'Bạn đang chọn ' + ids.length + ' món ăn để ẩn khỏi ứng dụng người dùng. Người dùng đã lưu các món này vào mục yêu thích vẫn có thể xem lại trong lịch sử.', confirmText: 'Ẩn ' + ids.length + ' món', danger: false, icon: 'eye', confirmIcon: false }).then(function (ok) {
        if (!ok) return;
        window.Api.call('foods.bulk', { ids: ids, action: 'hide' }).then(function (r) { window.Toast.success('Đã ẩn ' + r.count + ' món', 'Các món này không còn hiển thị với người dùng.'); selection.clear(); reload(); });
      });
    });
    D.$('#bulkDelete').addEventListener('click', function () {
      var ids = selection.ids();
      window.Modal.confirm({ title: 'Xoá ' + ids.length + ' món ăn?', text: 'Các món đã chọn sẽ bị xoá khỏi hệ thống và không thể khôi phục. Món đang nằm trong thực đơn sức khỏe của người dùng sẽ được giữ lại.', confirmText: 'Xoá ' + ids.length + ' món' }).then(function (ok) {
        if (!ok) return;
        window.Api.call('foods.bulk', { ids: ids, action: 'delete' }).then(function (r) {
          var skipped = ids.length - r.count;
          if (r.count) window.Toast.success('Đã xoá ' + r.count + ' món', skipped ? skipped + ' món được giữ lại vì đang nằm trong thực đơn sức khỏe.' : '');
          else window.Toast.error('Không thể xoá', 'Các món đã chọn đang nằm trong thực đơn sức khỏe của người dùng. Hãy ẩn thay vì xoá.');
          selection.clear(); reload();
        });
      });
    });
    D.$('#exportBtn').addEventListener('click', exportCsv);
  });
})();
