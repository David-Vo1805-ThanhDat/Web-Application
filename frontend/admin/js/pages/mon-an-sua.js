/* pages/mon-an-sua.js — Thêm/Sửa món ăn (?id=... hoặc ?new=1): form, chip, nguyên liệu & bước kéo-thả, quán gợi ý, ảnh, xem trước, lưu nháp/xuất bản. */
(function () {
  'use strict';
  var D = window.Dom, F = window.Fmt;
  var params = new URLSearchParams(location.search);
  var isNew = params.get('new') === '1' || !params.get('id');
  var opts = null, food = null, restaurants = [], ingredients = [], steps = [], image = '', dirty = false, saving = false;
  var sel = { mealType: [], taste: [], dietary: [], tags: [] };

  function val(id) { return D.$(id).value.trim(); }
  function num(id) { var v = D.$(id).value; return v === '' ? 0 : Number(v); }
  function markDirty() { dirty = true; }

  // ---------- Chip chọn nhiều ----------
  function chips(box, key, items, valueOf, labelOf) {
    var el = D.$(box);
    el.innerHTML = items.map(function (it) {
      var v = valueOf(it); return '<button type="button" class="chip' + (sel[key].indexOf(v) >= 0 ? ' is-on' : '') + '" data-v="' + D.esc(v) + '" aria-pressed="' + (sel[key].indexOf(v) >= 0) + '">' + D.esc(labelOf(it)) + '</button>';
    }).join('');
    D.on(el, 'click', '.chip', function () {
      var v = this.getAttribute('data-v'), i = sel[key].indexOf(v);
      if (i >= 0) sel[key].splice(i, 1); else sel[key].push(v);
      this.classList.toggle('is-on', i < 0); this.setAttribute('aria-pressed', i < 0); markDirty();
    });
  }

  // ---------- Danh sách kéo-thả (nguyên liệu / bước) ----------
  function makeSortable(box, arr, render) {
    var from = null, el = D.$(box);
    el.addEventListener('dragstart', function (e) {
      var row = e.target.closest && e.target.closest('.item-row'); if (!row) return;
      from = +row.dataset.i; row.classList.add('is-dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', String(from)); } catch (x) {}
    });
    el.addEventListener('dragover', function (e) {
      if (from === null) return; e.preventDefault();
      D.$$('.item-row', el).forEach(function (r) { r.classList.remove('is-over'); });
      var row = e.target.closest('.item-row'); if (row) row.classList.add('is-over');
    });
    el.addEventListener('drop', function (e) {
      e.preventDefault(); var row = e.target.closest('.item-row'); if (row && from !== null) {
        var to = +row.dataset.i; if (to !== from) { var m = arr.splice(from, 1)[0]; arr.splice(to, 0, m); markDirty(); render(); }
      } from = null;
    });
    el.addEventListener('dragend', function () { from = null; D.$$('.item-row', el).forEach(function (r) { r.classList.remove('is-over', 'is-dragging'); }); });
  }

  function renderIngredients() {
    D.$('#ingredientList').innerHTML = ingredients.map(function (x, i) {
      return '<div class="item-row" draggable="true" data-i="' + i + '"><span class="drag-handle" aria-hidden="true">' + D.icon('drag') + '</span>' +
        '<input class="input" data-k="name" placeholder="Tên nguyên liệu" value="' + D.esc(x.name) + '" aria-label="Nguyên liệu ' + (i + 1) + '">' +
        '<input class="input amount" data-k="amount" placeholder="Số lượng" value="' + D.esc(x.amount) + '" aria-label="Số lượng ' + (i + 1) + '">' +
        '<button class="icon-action is-danger" type="button" data-del="' + i + '" aria-label="Xoá nguyên liệu ' + (i + 1) + '">' + D.icon('trash') + '</button></div>';
    }).join('');
  }
  function renderSteps() {
    D.$('#stepList').innerHTML = steps.map(function (s, i) {
      return '<div class="item-row is-step" draggable="true" data-i="' + i + '"><span class="drag-handle" aria-hidden="true">' + D.icon('drag') + '</span><span class="step-no">' + (i + 1) + '</span>' +
        '<textarea class="textarea" rows="2" placeholder="Mô tả bước ' + (i + 1) + '" aria-label="Bước ' + (i + 1) + '">' + D.esc(s) + '</textarea>' +
        '<button class="icon-action is-danger" type="button" data-del="' + i + '" aria-label="Xoá bước ' + (i + 1) + '">' + D.icon('trash') + '</button></div>';
    }).join('');
  }

  function bindLists() {
    makeSortable('#ingredientList', ingredients, renderIngredients);
    makeSortable('#stepList', steps, renderSteps);
    D.on(D.$('#ingredientList'), 'input', 'input', function () { var i = +this.closest('.item-row').dataset.i; ingredients[i][this.dataset.k] = this.value; markDirty(); });
    D.on(D.$('#stepList'), 'input', 'textarea', function () { steps[+this.closest('.item-row').dataset.i] = this.value; markDirty(); });
    D.on(D.$('#ingredientList'), 'click', '[data-del]', function () { ingredients.splice(+this.dataset.del, 1); markDirty(); renderIngredients(); });
    D.on(D.$('#stepList'), 'click', '[data-del]', function () { steps.splice(+this.dataset.del, 1); markDirty(); renderSteps(); });
    D.$('#addIngredient').addEventListener('click', function () { ingredients.push({ name: '', amount: '' }); markDirty(); renderIngredients(); var r = D.$$('#ingredientList .item-row'); r[r.length - 1].querySelector('input').focus(); });
    D.$('#addStep').addEventListener('click', function () { steps.push(''); markDirty(); renderSteps(); var r = D.$$('#stepList textarea'); r[r.length - 1].focus(); });
  }

  // ---------- Quán ăn gợi ý ----------
  function renderRestaurants() {
    var box = D.$('#restaurantList');
    box.innerHTML = restaurants.length ? restaurants.map(function (r, i) {
      return '<div class="restaurant-item"><span class="pin">' + D.icon('pin') + '</span><div class="restaurant-info"><b>' + D.esc(r.name) + '</b><small>' + D.esc(r.address) + (r.city ? ' · ' + D.esc(r.city) : '') + (r.priceText ? ' · ' + D.esc(r.priceText) : '') + '</small></div>' +
        '<button class="icon-action" type="button" data-edit="' + i + '" aria-label="Sửa quán ' + D.esc(r.name) + '">' + D.icon('edit') + '</button>' +
        '<button class="icon-action is-danger" type="button" data-del="' + i + '" aria-label="Xoá quán ' + D.esc(r.name) + '">' + D.icon('trash') + '</button></div>';
    }).join('') : '<p class="field-hint">Chưa có quán ăn nào được gợi ý cho món này.</p>';
  }
  function restaurantForm(index) {
    var r = index == null ? { name: '', address: '', city: '', priceText: '' } : restaurants[index];
    window.Modal.form({
      title: index == null ? 'Thêm quán ăn gợi ý' : 'Sửa quán ăn gợi ý', submitText: index == null ? 'Thêm quán' : 'Lưu quán',
      html: '<div class="field"><label>Tên quán <span class="req">*</span></label><input class="input" name="name" value="' + D.esc(r.name) + '"></div>' +
        '<div class="field"><label>Địa chỉ <span class="req">*</span></label><input class="input" name="address" value="' + D.esc(r.address) + '"></div>' +
        '<div class="field-row"><div class="field"><label>Thành phố</label><input class="input" name="city" value="' + D.esc(r.city) + '"></div>' +
        '<div class="field"><label>Khoảng giá</label><input class="input" name="priceText" placeholder="VD: 40.000đ - 70.000đ" value="' + D.esc(r.priceText) + '"></div></div>' +
        '<span class="field-error" data-modal-err hidden></span>',
      onSubmit: function (f) {
        var d = { id: r.id, name: f.name.value.trim(), address: f.address.value.trim(), city: f.city.value.trim(), priceText: f.priceText.value.trim() };
        if (!d.name || !d.address) { var e = f.querySelector('[data-modal-err]'); e.textContent = 'Vui lòng nhập tên quán và địa chỉ.'; e.hidden = false; return false; }
        if (index == null) restaurants.push(d); else restaurants[index] = d;
        markDirty(); renderRestaurants();
      },
    });
  }

  // ---------- Ảnh ----------
  function renderImage() {
    var box = D.$('#imageBox');
    if (image) {
      box.innerHTML = '<div class="dropzone-preview"><img src="' + D.esc(image) + '" alt="Ảnh món ăn"><button class="btn btn-ghost" type="button" id="changeImg">Đổi ảnh</button></div>';
      D.$('#changeImg').addEventListener('click', function () { D.$('#fileInput').click(); });
    } else {
      box.innerHTML = '<div class="dropzone" tabindex="0" role="button" id="drop">' + D.icon('image') + '<b>Kéo thả ảnh hoặc bấm để tải lên</b><small>PNG, JPG tối đa 5MB · tỉ lệ 4:3</small></div>';
      var dz = D.$('#drop');
      dz.addEventListener('click', function () { D.$('#fileInput').click(); });
      dz.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); D.$('#fileInput').click(); } });
      dz.addEventListener('dragover', function (e) { e.preventDefault(); dz.classList.add('is-over'); });
      dz.addEventListener('dragleave', function () { dz.classList.remove('is-over'); });
      dz.addEventListener('drop', function (e) { e.preventDefault(); dz.classList.remove('is-over'); if (e.dataTransfer.files[0]) readImage(e.dataTransfer.files[0]); });
    }
  }
  function readImage(file) {
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) { window.Toast.error('Định dạng không hợp lệ', 'Chỉ nhận ảnh PNG, JPG hoặc WEBP.'); return; }
    if (file.size > 5 * 1024 * 1024) { window.Toast.error('Ảnh quá lớn', 'Vui lòng chọn ảnh dưới 5MB.'); return; }
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () { // thu nhỏ để lưu vừa localStorage (bản mock); bản PHP sẽ upload file thật
        var k = Math.min(1, 800 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        image = c.toDataURL('image/jpeg', 0.8); D.$('#fImage').value = ''; markDirty(); renderImage();
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  // ---------- Đổ dữ liệu vào form / đọc form ----------
  function fillSelect(id, items, blank) {
    D.$(id).innerHTML = (blank ? '<option value="">—</option>' : '') + items.map(function (x) { return '<option value="' + D.esc(x.slug) + '">' + D.esc(x.label) + '</option>'; }).join('');
  }
  function setStatusBadge() {
    var pub = D.$('#tgPublic').checked, b = D.$('#statusBadge');
    var st = pub ? ['Đang hiển thị', 'b-green'] : (food && food.status === 'pending' ? ['Chờ duyệt', 'b-amber'] : ['Đang ẩn', 'b-dark']);
    b.className = 'badge ' + st[1]; b.textContent = st[0];
  }
  function populate() {
    var f = food;
    D.$('#fName').value = f.name; D.$('#fEn').value = f.englishName; D.$('#fDesc').value = f.description;
    D.$('#fCategory').value = f.category; D.$('#fRegion').value = f.region; D.$('#fTime').value = f.cookTimeMinutes || '';
    D.$('#fPrice').value = f.price || ''; D.$('#fPriceRange').value = f.priceRange; D.$('#fCalories').value = f.calories || '';
    D.$('#fProtein').value = f.nutrition.protein || ''; D.$('#fCarbs').value = f.nutrition.carbs || ''; D.$('#fFat').value = f.nutrition.fat || '';
    D.$('#fImage').value = /^data:/.test(f.image) ? '' : f.image;
    D.$('#tgPublic').checked = f.status === 'visible'; D.$('#tgPopular').checked = !!f.popular;
    D.$('#createdBy').textContent = f.createdBy || 'Quản trị viên'; D.$('#createdAt').textContent = f.createdAt ? F.dmy(f.createdAt) : 'Chưa lưu';
    D.$('#pViews').textContent = F.int(f.stats.views); D.$('#pSpins').textContent = F.int(f.stats.spins); D.$('#pFavs').textContent = F.int(f.stats.favorites);
    D.$('#pRating').textContent = f.reviewCount ? F.dec(f.rating, 1) + ' / 5 (' + f.reviewCount + ' đánh giá)' : 'Chưa có đánh giá';
    setStatusBadge();
  }
  function collect(status) {
    return {
      id: food.id, name: val('#fName'), englishName: val('#fEn'), description: val('#fDesc'),
      category: D.$('#fCategory').value, region: D.$('#fRegion').value, cookTimeMinutes: num('#fTime'),
      mealType: sel.mealType.slice(), taste: sel.taste.slice(), dietary: sel.dietary.slice(), tags: sel.tags.slice(),
      price: num('#fPrice'), priceRange: val('#fPriceRange'), calories: num('#fCalories'),
      nutrition: { protein: num('#fProtein'), carbs: num('#fCarbs'), fat: num('#fFat') },
      image: image || val('#fImage'),
      ingredients: ingredients.filter(function (x) { return x.name.trim(); }).map(function (x) { return { name: x.name.trim(), amount: x.amount.trim() }; }),
      instructions: steps.map(function (s) { return s.trim(); }).filter(Boolean),
      popular: D.$('#tgPopular').checked, status: status,
    };
  }

  function validate(d) {
    var errs = {};
    if (!d.name) errs.name = 'Vui lòng nhập tên món.';
    if (!d.description) errs.description = 'Vui lòng nhập mô tả ngắn cho món.';
    if (!(d.price > 0)) errs.price = 'Giá phải lớn hơn 0.';
    D.$$('[data-err]').forEach(function (e) { var m = errs[e.dataset.err]; e.hidden = !m; e.textContent = m || ''; });
    ['#fName', '#fDesc', '#fPrice'].forEach(function (id) { D.$(id).classList.remove('is-invalid'); });
    if (errs.name) D.$('#fName').classList.add('is-invalid');
    if (errs.description) D.$('#fDesc').classList.add('is-invalid');
    if (errs.price) D.$('#fPrice').classList.add('is-invalid');
    var first = Object.keys(errs)[0];
    if (first) { var t = D.$({ name: '#fName', description: '#fDesc', price: '#fPrice' }[first]); t.scrollIntoView({ block: 'center', behavior: 'smooth' }); t.focus({ preventScroll: true }); }
    return !first;
  }

  function save(publish) {
    if (saving) return;
    var status = publish ? 'visible' : (D.$('#tgPublic').checked ? 'visible' : 'hidden');
    if (!publish && D.$('#tgPublic').checked) status = 'hidden'; // Lưu nháp luôn ẩn món khỏi người dùng
    var d = collect(status);
    if (!validate(d)) { window.Toast.error('Chưa thể lưu', 'Vui lòng điền đủ các trường bắt buộc.'); return; }
    saving = true;
    window.Api.call('foods.save', { food: d, restaurants: restaurants.map(function (r) { return { id: r.id, name: r.name, address: r.address, city: r.city, priceText: r.priceText }; }) }).then(function (saved) {
      dirty = false;
      window.Toast.success(publish ? 'Đã lưu & xuất bản' : 'Đã lưu nháp', '“' + saved.name + '” ' + (publish ? 'đang hiển thị với người dùng.' : 'đã được lưu và đang ẩn.'));
      setTimeout(function () { location.href = 'mon-an.html'; }, 700);
    }).catch(function (e) { saving = false; window.Toast.error('Lưu thất bại', e.message || 'Đã có lỗi xảy ra.'); });
  }

  // ---------- Xem trước ----------
  function preview() {
    var d = collect('visible'), cat = opts.categories.filter(function (c) { return c.slug === d.category; })[0];
    var meals = d.mealType.map(function (m) { var x = opts.meals.filter(function (y) { return y.slug === m; })[0]; return x ? x.label : m; });
    var o = window.Modal.open(
      '<div class="modal-head"><h3 class="modal-title">Xem trước — như người dùng thấy</h3><button class="modal-close" type="button" data-x aria-label="Đóng">' + D.icon('x') + '</button></div>' +
      '<div class="modal-body preview">' + (d.image ? '<img class="preview-img" src="' + D.esc(d.image) + '" alt="">' : '') +
      '<h2 class="preview-title">' + D.esc(d.name || 'Chưa đặt tên') + '</h2><p class="field-hint">' + D.esc(d.englishName) + (cat ? ' · ' + D.esc(cat.label) : '') + (meals.length ? ' · ' + D.esc(meals.join(', ')) : '') + '</p>' +
      '<p>' + D.esc(d.description) + '</p>' +
      '<div class="kv-list"><div class="kv-row"><span>Giá</span><b>' + F.vnd(d.price) + '</b></div><div class="kv-row"><span>Calories</span><b>' + F.int(d.calories) + ' kcal</b></div>' +
      '<div class="kv-row"><span>Đạm / Tinh bột / Béo</span><b>' + d.nutrition.protein + ' / ' + d.nutrition.carbs + ' / ' + d.nutrition.fat + ' g</b></div></div>' +
      (d.ingredients.length ? '<h4>Nguyên liệu</h4><ul>' + d.ingredients.map(function (x) { return '<li>' + D.esc(x.name) + (x.amount ? ' — ' + D.esc(x.amount) : '') + '</li>'; }).join('') + '</ul>' : '') +
      (d.instructions.length ? '<h4>Cách nấu</h4><ol>' + d.instructions.map(function (s) { return '<li>' + D.esc(s) + '</li>'; }).join('') + '</ol>' : '') + '</div>', 'lg');
    o.querySelector('[data-x]').addEventListener('click', function () { o.close(false); });
  }

  // ---------- Khởi tạo ----------
  document.addEventListener('DOMContentLoaded', function () {
    window.Api.call('foods.filterOptions').then(function (o) {
      opts = o;
      fillSelect('#fCategory', o.categories); fillSelect('#fRegion', o.regions);
      return isNew ? null : window.Api.call('foods.get', { id: params.get('id') });
    }).then(function (f) {
      food = f || { id: '', name: '', englishName: '', description: '', category: opts.categories[0].slug, region: opts.regions[0].slug, cookTimeMinutes: 0, mealType: [], taste: [], dietary: [], tags: [], price: 0, priceRange: '', calories: 0, nutrition: { protein: 0, carbs: 0, fat: 0 }, image: '', ingredients: [{ name: '', amount: '' }], instructions: [''], popular: false, status: 'hidden', stats: { views: 0, spins: 0, favorites: 0 }, rating: 0, reviewCount: 0 };
      restaurants = (food.restaurants || []).map(function (r) { return { id: r.id, name: r.name, address: r.address, city: r.city, priceText: r.priceText }; });
      ingredients = food.ingredients.map(function (x) { return { name: x.name, amount: x.amount }; });
      steps = food.instructions.slice(); image = food.image || '';
      ['mealType', 'taste', 'dietary', 'tags'].forEach(function (k) { sel[k] = food[k].slice(); });

      D.$('#pageTitle').textContent = isNew ? 'Thêm món ăn mới' : 'Sửa món ăn — ' + food.name;
      D.$('#pageSub').textContent = isNew ? 'Điền thông tin để thêm món vào hệ thống. Món mới sẽ ẩn cho tới khi bạn xuất bản.' : 'ID: ' + food.id + ' · Cập nhật lần cuối ' + (food.updatedAt ? F.ago(food.updatedAt) : '—');
      document.title = (isNew ? 'Thêm món ăn' : 'Sửa món ăn') + ' — Hôm Nay Ăn Gì? Admin';
      if (isNew) D.$('#perfCard').hidden = true;

      chips('#mealChips', 'mealType', opts.meals, function (x) { return x.slug; }, function (x) { return x.label; });
      chips('#tasteChips', 'taste', opts.tastes, function (x) { return x.slug; }, function (x) { return x.label; });
      chips('#dietChips', 'dietary', opts.diets, function (x) { return x.slug; }, function (x) { return x.label; });
      chips('#tagChips', 'tags', opts.tags, function (x) { return x; }, function (x) { return x; });
      populate(); renderIngredients(); renderSteps(); renderRestaurants(); renderImage(); bindLists();
      dirty = false;
    }).catch(function (e) {
      D.$('#foodForm').innerHTML = '<div class="empty"><h2 class="empty-title">Không tải được món ăn</h2><p class="empty-desc">' + D.esc(e.message || '') + '</p><a class="btn btn-primary" href="mon-an.html">Về danh sách</a></div>';
    });

    D.$('#foodForm').addEventListener('input', markDirty);
    D.$('#foodForm').addEventListener('submit', function (e) { e.preventDefault(); });
    D.$('#tgPublic').addEventListener('change', setStatusBadge);
    D.$('#fImage').addEventListener('input', function () { image = this.value.trim(); renderImage(); });
    D.$('#fileInput').addEventListener('change', function () { if (this.files[0]) readImage(this.files[0]); this.value = ''; });
    D.$('#addRestaurant').addEventListener('click', function () { restaurantForm(null); });
    D.on(D.$('#restaurantList'), 'click', '[data-edit]', function () { restaurantForm(+this.dataset.edit); });
    D.on(D.$('#restaurantList'), 'click', '[data-del]', function () { restaurants.splice(+this.dataset.del, 1); markDirty(); renderRestaurants(); });
    D.$('#previewBtn').addEventListener('click', preview);
    D.$('#draftBtn').addEventListener('click', function () { save(false); });
    D.$('#publishBtn').addEventListener('click', function () { save(true); });

    // Cảnh báo khi rời trang có thay đổi chưa lưu
    window.addEventListener('beforeunload', function (e) { if (dirty && !saving) { e.preventDefault(); e.returnValue = ''; } });
    D.$('#backLink').addEventListener('click', function (e) {
      if (!dirty) return; e.preventDefault(); var href = this.href;
      window.Modal.confirm({ title: 'Rời trang mà chưa lưu?', text: 'Các thay đổi của bạn sẽ bị mất nếu rời khỏi trang này.', confirmText: 'Rời trang', danger: false, icon: 'warn', confirmIcon: false }).then(function (ok) { if (ok) { dirty = false; location.href = href; } });
    });
  });
})();
