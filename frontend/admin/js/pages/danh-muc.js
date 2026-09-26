/* pages/danh-muc.js — Danh mục & thẻ: CRUD danh mục, vùng miền, khẩu vị, chế độ ăn, thẻ. Bấm vào pill/ô để sửa. */
(function () {
  'use strict';
  var D = window.Dom, T = null;
  var TONES = [['orange', 'Cam'], ['blue', 'Xanh dương'], ['purple', 'Tím'], ['green', 'Xanh lá'], ['amber', 'Vàng'], ['rose', 'Hồng'], ['sky', 'Xanh da trời']];
  var ICONS = ['bowl', 'tag', 'leaf', 'fire', 'star', 'heart'];
  var NAMES = { CATEGORIES: 'danh mục', REGIONS: 'vùng miền', TASTES: 'khẩu vị', DIETS: 'chế độ ăn', TAGS: 'thẻ' };

  function render() {
    D.$('#catSub').textContent = T.CATEGORIES.length + ' danh mục · ' + T.CATEGORIES.reduce(function (a, c) { return a + c.count; }, 0) + ' món ăn';
    D.$('#catList').innerHTML = T.CATEGORIES.map(function (c) {
      return '<div class="cat-row"><span class="tint tint-' + c.tone + '">' + D.icon(c.icon || 'tag') + '</span>' +
        '<div class="cat-info"><b>' + D.esc(c.label) + '</b><small>slug: ' + D.esc(c.slug) + '</small></div><span class="count-pill">' + c.count + ' món</span>' +
        '<button class="icon-action" type="button" data-edit="CATEGORIES:' + D.esc(c.slug) + '" aria-label="Sửa ' + D.esc(c.label) + '">' + D.icon('edit') + '</button>' +
        '<button class="icon-action is-danger" type="button" data-del="CATEGORIES:' + D.esc(c.slug) + '" aria-label="Xoá ' + D.esc(c.label) + '">' + D.icon('trash') + '</button></div>';
    }).join('');
    D.$('#regSub').textContent = T.REGIONS.length + ' vùng miền đang sử dụng';
    D.$('#regionList').innerHTML = T.REGIONS.map(function (r) {
      return '<button class="region-tile" type="button" data-edit="REGIONS:' + D.esc(r.slug) + '"><span class="dot dot-' + (r.dot || 'orange') + '"></span><b>' + D.esc(r.label) + '</b><small>' + r.count + ' món</small></button>';
    }).join('');
    [['TASTES', '#tasteList', '#tasteSub', 'nhãn khẩu vị'], ['DIETS', '#dietList', '#dietSub', 'chế độ'], ['TAGS', '#tagList', '#tagSub', 'thẻ']].forEach(function (g) {
      D.$(g[2]).textContent = g[0] === 'TAGS' ? 'Gắn trên món trong ứng dụng' : T[g[0]].length + ' ' + g[3];
      D.$(g[1]).innerHTML = T[g[0]].map(function (x) {
        return '<button class="pill" type="button" data-edit="' + g[0] + ':' + D.esc(x.slug) + '">' + D.esc(x.label) + '<span class="n">' + x.count + '</span></button>';
      }).join('');
    });
  }

  function load() { return window.Api.call('taxonomy.get').then(function (t) { T = t; render(); }); }

  function form(type, slug) {
    var item = slug == null ? null : T[type].filter(function (x) { return x.slug === slug; })[0];
    var isCat = type === 'CATEGORIES', isReg = type === 'REGIONS';
    var html = '<div class="field"><label>Tên ' + NAMES[type] + ' <span class="req">*</span></label><input class="input" name="label" maxlength="40" value="' + D.esc(item ? item.label : '') + '"></div>';
    if (type !== 'TAGS') html += '<div class="field"><label>Mã (slug)</label><input class="input" name="slug" value="' + D.esc(item ? item.slug : '') + '"' + (item ? ' readonly' : ' placeholder="Để trống để tự tạo"') + '>' + (item ? '<span class="field-hint">Mã không thể đổi sau khi tạo.</span>' : '') + '</div>';
    if (isCat) html += '<div class="field-row"><div class="field"><label>Màu nhãn</label><div class="select"><select name="tone">' + TONES.map(function (t) { return '<option value="' + t[0] + '"' + (item && item.tone === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select>' + D.icon('chev') + '</div></div>' +
      '<div class="field"><label>Biểu tượng</label><div class="select"><select name="icon">' + ICONS.map(function (i) { return '<option value="' + i + '"' + (item && item.icon === i ? ' selected' : '') + '>' + i + '</option>'; }).join('') + '</select>' + D.icon('chev') + '</div></div></div>';
    if (isReg) html += '<div class="field"><label>Màu chấm</label><div class="select"><select name="dot">' + TONES.map(function (t) { return '<option value="' + t[0] + '"' + (item && item.dot === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select>' + D.icon('chev') + '</div></div>';
    html += '<span class="field-error" data-modal-err hidden></span>';
    if (item && type !== 'REGIONS' || (item && isReg)) html += '<button class="btn-link" type="button" data-remove style="color:var(--ad-rose);align-self:flex-start">Xoá ' + NAMES[type] + ' này</button>';

    var m = window.Modal.form({
      title: (item ? 'Sửa ' : 'Thêm ') + NAMES[type], html: html, submitText: item ? 'Lưu thay đổi' : 'Thêm',
      onSubmit: function (f) {
        var label = f.label.value.trim(), e = f.querySelector('[data-modal-err]');
        if (!label) { e.textContent = 'Vui lòng nhập tên.'; e.hidden = false; return false; }
        var it = { label: label };
        if (f.slug) it.slug = f.slug.value.trim(); if (f.tone) it.tone = f.tone.value; if (f.icon) it.icon = f.icon.value; if (f.dot) it.dot = f.dot.value;
        return window.Api.call('taxonomy.save', { type: type, item: it, original: item ? item.slug : null }).then(function () {
          window.Toast.success('Đã lưu ' + NAMES[type], '“' + label + '” đã được cập nhật.'); return load();
        }).catch(function (err) { e.textContent = err.message; e.hidden = false; return false; });
      },
    });
    var rm = m.querySelector('[data-remove]'); if (rm) rm.addEventListener('click', function () { m.close(false); remove(type, item.slug); });
  }

  function remove(type, slug) {
    var item = T[type].filter(function (x) { return x.slug === slug; })[0];
    window.Modal.confirm({ title: 'Xoá ' + NAMES[type] + '?', text: 'Bạn sắp xoá “' + item.label + '”. Chỉ xoá được khi không còn món ăn nào sử dụng.', confirmText: 'Xoá' }).then(function (ok) {
      if (!ok) return;
      window.Api.call('taxonomy.remove', { type: type, slug: slug }).then(function () { window.Toast.success('Đã xoá', '“' + item.label + '” đã bị xoá.'); return load(); })
        .catch(function (err) { window.Toast.error('Không thể xoá', err.message); });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    load();
    D.on(document.body, 'click', '[data-edit]', function () { var p = this.getAttribute('data-edit').split(':'); form(p[0], p.slice(1).join(':')); });
    D.on(document.body, 'click', '[data-del]', function () { var p = this.getAttribute('data-del').split(':'); remove(p[0], p.slice(1).join(':')); });
    D.$('#addCategory').addEventListener('click', function () { form('CATEGORIES'); });
    D.$('#addTaste').addEventListener('click', function () { form('TASTES'); });
    D.$('#addDiet').addEventListener('click', function () { form('DIETS'); });
    D.$('#addTag').addEventListener('click', function () { form('TAGS'); });
  });
})();
