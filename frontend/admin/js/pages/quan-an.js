/* pages/quan-an.js — Quán ăn gợi ý: thống kê, tìm/lọc, thêm/sửa/xoá quán, phân trang. */
(function () {
  'use strict';
  var D = window.Dom, F = window.Fmt;
  var state = { q: '', foodId: 'all', city: 'all', page: 1 };
  var foods = [], cities = [];

  function rowHtml(r) {
    return '<tr><td><div class="cell-main"><span class="thumb ' + D.colorClass(r.name) + '">' + D.initial(r.name) + '</span><span class="cell-title">' + D.esc(r.name) + '</span></div></td>' +
      '<td><span class="badge b-orange">' + D.esc(r.foodName) + '</span></td><td class="addr">' + D.esc(r.address) + '</td><td>' + D.esc(r.city) + '</td><td class="money">' + D.esc(r.priceText || '—') + '</td>' +
      '<td class="col-actions"><div class="row-actions"><button class="icon-action" type="button" data-edit="' + r.id + '" aria-label="Sửa ' + D.esc(r.name) + '">' + D.icon('edit') + '</button>' +
      '<button class="icon-action is-danger" type="button" data-del="' + r.id + '" aria-label="Xoá ' + D.esc(r.name) + '">' + D.icon('trash') + '</button></div></td></tr>';
  }
  var last = null;

  function loadStats() {
    return window.Api.call('restaurants.stats').then(function (s) {
      cities = s.cities;
      D.$('[data-stat=total]').textContent = s.total; D.$('[data-note=total]').textContent = 'Trung bình ' + F.dec(s.avgPerFood, 1) + ' quán / món';
      D.$('[data-stat=cities]').textContent = s.cities.length; D.$('[data-note=cities]').textContent = s.cities.slice(0, 3).join(', ') + (s.cities.length > 3 ? '…' : '');
      D.$('[data-stat=nofood]').textContent = s.foodsWithoutRestaurant; D.$('[data-note=nofood]').textContent = s.foodsWithoutRestaurant ? 'Cần bổ sung gợi ý' : 'Món nào cũng có quán';
      D.$('#fCity').innerHTML = '<option value="all">Thành phố: Tất cả</option>' + cities.map(function (c) { return '<option value="' + D.esc(c) + '">' + D.esc(c) + '</option>'; }).join('');
      D.$('#fCity').value = state.city;
      return window.Api.call('foods.list', { pageSize: 1000 }).then(function (r) {
        foods = r.items; D.$('#sub').textContent = s.total + ' quán ăn được gắn cho ' + r.all + ' món ăn trong hệ thống';
        D.$('#fFood').innerHTML = '<option value="all">Món ăn: Tất cả</option>' + foods.map(function (f) { return '<option value="' + D.esc(f.id) + '">' + D.esc(f.name) + '</option>'; }).join('');
        D.$('#fFood').value = state.foodId;
      });
    });
  }

  function load() {
    return window.Api.call('restaurants.list', Object.assign({}, state, { pageSize: 6 })).then(function (r) {
      last = r; var empty = r.total === 0; D.$('#tableScroll').hidden = empty; D.$('#empty').hidden = !empty;
      D.$('#body').innerHTML = r.items.map(rowHtml).join('');
      D.$('#footInfo').textContent = empty ? '' : 'Hiển thị ' + ((r.page - 1) * r.pageSize + 1) + '–' + Math.min(r.page * r.pageSize, r.total) + ' trong tổng số ' + r.total + ' quán ăn';
      window.Pagination.render(D.$('#pager'), { page: r.page, pages: r.pages, onChange: function (p) { state.page = p; load(); } });
      if (empty) D.$('#pager').innerHTML = '';
    });
  }
  function reload(reset) { if (reset) state.page = 1; return load(); }

  function form(r) {
    r = r || { name: '', address: '', city: '', priceText: '', foodId: foods[0] && foods[0].id };
    window.Modal.form({
      title: r.id ? 'Sửa quán ăn' : 'Thêm quán ăn', submitText: r.id ? 'Lưu thay đổi' : 'Thêm quán',
      html: '<div class="field"><label>Tên quán <span class="req">*</span></label><input class="input" name="name" value="' + D.esc(r.name) + '"></div>' +
        '<div class="field"><label>Món liên kết <span class="req">*</span></label><div class="select"><select name="foodId">' + foods.map(function (f) { return '<option value="' + D.esc(f.id) + '"' + (f.id === r.foodId ? ' selected' : '') + '>' + D.esc(f.name) + '</option>'; }).join('') + '</select>' + D.icon('chev') + '</div></div>' +
        '<div class="field"><label>Địa chỉ <span class="req">*</span></label><input class="input" name="address" value="' + D.esc(r.address) + '"></div>' +
        '<div class="field-row"><div class="field"><label>Thành phố <span class="req">*</span></label><input class="input" name="city" value="' + D.esc(r.city) + '"></div>' +
        '<div class="field"><label>Giá tham khảo</label><input class="input" name="priceText" placeholder="VD: 40.000đ - 70.000đ" value="' + D.esc(r.priceText || '') + '"></div></div>' +
        '<span class="field-error" data-modal-err hidden></span>',
      onSubmit: function (f) {
        var d = { id: r.id, name: f.name.value.trim(), foodId: f.foodId.value, address: f.address.value.trim(), city: f.city.value.trim(), priceText: f.priceText.value.trim() };
        if (!d.name || !d.address || !d.city) { var e = f.querySelector('[data-modal-err]'); e.textContent = 'Vui lòng nhập tên quán, địa chỉ và thành phố.'; e.hidden = false; return false; }
        return window.Api.call('restaurants.save', { restaurant: d }).then(function () { window.Toast.success(r.id ? 'Đã cập nhật quán' : 'Đã thêm quán ăn', d.name); return Promise.all([loadStats(), load()]); });
      },
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadStats().then(load);
    D.$('#fQ').addEventListener('input', D.debounce(function () { state.q = this.value.trim(); reload(true); }, 220));
    D.$('#fFood').addEventListener('change', function () { state.foodId = this.value; reload(true); });
    D.$('#fCity').addEventListener('change', function () { state.city = this.value; reload(true); });
    D.$('#clearFilters').addEventListener('click', function () { state = { q: '', foodId: 'all', city: 'all', page: 1 }; D.$('#fQ').value = ''; D.$('#fFood').value = 'all'; D.$('#fCity').value = 'all'; load(); });
    D.$('#addBtn').addEventListener('click', function () { form(); });
    D.on(D.$('#body'), 'click', '[data-edit]', function () { var id = +this.dataset.edit; form(last.items.filter(function (x) { return x.id === id; })[0]); });
    D.on(D.$('#body'), 'click', '[data-del]', function () {
      var id = +this.dataset.del, r = last.items.filter(function (x) { return x.id === id; })[0];
      window.Modal.confirm({ title: 'Xoá quán ăn này?', text: 'Quán “' + r.name + '” sẽ không còn được gợi ý cho món “' + r.foodName + '”.', confirmText: 'Xoá quán' }).then(function (ok) {
        if (!ok) return;
        window.Api.call('restaurants.remove', { id: id }).then(function () { window.Toast.success('Đã xoá quán ăn', r.name); return Promise.all([loadStats(), load()]); });
      });
    });
  });
})();
