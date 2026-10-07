/* pages/goi-y.js — logic riêng của trang goi-y.html (nạp sau js/core và js/widgets). */
document.addEventListener('DOMContentLoaded', function () {
  var MAX_POOL = 12;
  var MAX_PEOPLE = 10;
  var STORAGE_KEY = 'hom_nay_an_gi_group';

  var filters = { mealType: 'all', priceCategory: 'all', taste: 'all', dietary: 'all' };
  var source = window.location.hash === '#nhom' ? 'group' : 'criteria';
  var mode = 'wheel';
  var busy = false;
  var matched = [];
  var selected = new Set();
  var rejectedIds = new Set(); // món vừa bị "chưa vừa lòng" ở mục Theo tiêu chí, loại khỏi vòng quay/hộp trong phiên này
  var people = loadPeople();
  var wheel = null;
  var box = null;
  // Khi đóng modal/popup kết quả để QUAY LẠI NGAY (không phải đóng hẳn), ta không muốn
  // box.closeReveal() đóng luôn khung mở hộp vừa mở lại cho lượt mở tiếp theo — cờ này
  // báo cho listener 'hidden.bs.modal' bỏ qua đúng 1 lần đóng đó.
  var skipNextBoxClose = false;

  function shuffle(list) { return list.slice().sort(function () { return 0.5 - Math.random(); }); }
  function $(id) { return document.getElementById(id); }

  /* ---------- Danh sách món trên vòng quay ---------- */
  function nameOf(person, index) { return (person.name || '').trim() || 'Người ' + (index + 1); }

  function getItems() {
    if (source === 'criteria') {
      return matched.filter(function (f) { return selected.has(f.id) && !rejectedIds.has(f.id); });
    }
    // Cả nhóm đề cử: mỗi người tự gõ tên món, không cần khớp với món có sẵn trong thực đơn
    // nên không có ảnh/mô tả — chỉ cần tên + ai đề cử để vẽ lên vòng quay/hộp.
    var items = [];
    people.forEach(function (p, i) {
      var name = (p.dish || '').trim();
      if (name) items.push({ id: 'nom-' + i, name: name, nominatedBy: nameOf(p, i) });
    });
    return items;
  }

  function syncButtons(items) {
    var canSpin = items.length >= 2;
    ['spinWheelBtn', 'dockSpinBtn'].forEach(function (id) { $(id).disabled = busy || !canSpin; });
    if (box) box.setEnabled(canSpin);
    $('dockInfo').textContent = items.length + ' món trên vòng quay';
    if (source === 'criteria') {
      $('spinNote').textContent = canSpin
        ? 'Vòng quay có ' + items.length + ' món bạn đã chọn.'
        : 'Chọn ít nhất 2 món để quay.';
    } else {
      var n = people.filter(function (p) { return p.dish; }).length;
      $('spinNote').textContent = canSpin
        ? 'Vòng quay có ' + items.length + ' ô từ ' + n + ' người đề cử.'
        : 'Cần ít nhất 2 người gõ tên món để quay.';
    }
  }

  // Chấm màu cạnh mỗi người khớp với màu ô của họ trên vòng quay
  function updateDots() {
    var index = 0;
    document.querySelectorAll('#people .person').forEach(function (row, i) {
      var dot = row.querySelector('.person-dot');
      if (people[i] && people[i].dish) {
        dot.style.background = WHEEL_SLICES[index % WHEEL_SLICES.length].bg;
        index++;
      } else {
        dot.style.background = '';
      }
    });
  }

  function applyItems() {
    var items = getItems();
    if (wheel) wheel.updateCandidates(items, { exact: true });
    if (box) box.updateCandidates(items);
    syncButtons(items);
    updateDots();
  }

  /* ---------- Tab 1: tiêu chí + tick chọn món ---------- */
  function defaultSelection() {
    selected = new Set();
    var list = matched.length <= MAX_POOL ? matched : shuffle(matched).slice(0, 8);
    list.forEach(function (f) { selected.add(f.id); });
  }

  function renderPickGrid() {
    var grid = $('pickGrid');
    if (matched.length === 0) {
      grid.innerHTML = '<p class="hint mb-0">Không có món nào khớp các tiêu chí này. Hãy chọn lại tiêu chí rộng hơn.</p>';
    } else {
      grid.innerHTML = matched.map(function (f) {
        var on = selected.has(f.id);
        var rejected = rejectedIds.has(f.id);
        return '<button type="button" class="pick-item' + (rejected ? ' is-rejected' : '') + '" data-id="' + f.id + '" aria-pressed="' + on + '">' +
          '<img src="' + f.image + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' +
          '<span class="pi-text"><span class="pi-name">' + f.name + '</span></span>' +
          '<span class="pi-check" aria-hidden="true"><i class="bi bi-check-lg"></i></span></button>';
      }).join('');
    }
    updatePickCount();
  }

  function updatePickCount() {
    $('pickCount').innerHTML = 'Đã chọn ' + selected.size + '/' + MAX_POOL + ' món <small>(' + matched.length + ' món khớp tiêu chí)</small>';
  }

  function refreshMatched() {
    matched = filterFoods(allFoods, filters);
    rejectedIds = new Set();
    defaultSelection();
    renderPickGrid();
    applyItems();
  }

  $('pickGrid').addEventListener('click', function (e) {
    var btn = e.target.closest('.pick-item');
    if (!btn || rejectedIds.has(btn.dataset.id)) return;
    var id = btn.dataset.id;
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      if (selected.size >= MAX_POOL) { showToast('info', 'Vòng quay tối đa ' + MAX_POOL + ' món. Hãy bỏ bớt một món trước.'); return; }
      selected.add(id);
    }
    btn.setAttribute('aria-pressed', selected.has(id));
    updatePickCount();
    applyItems();
  });
  $('randomPickBtn').addEventListener('click', function () {
    rejectedIds = new Set();
    selected = new Set(shuffle(matched).slice(0, 8).map(function (f) { return f.id; }));
    renderPickGrid();
    applyItems();
  });
  $('clearPickBtn').addEventListener('click', function () {
    rejectedIds = new Set();
    selected = new Set();
    renderPickGrid();
    applyItems();
  });

  [['filterMeal', 'mealType'], ['filterPrice', 'priceCategory'], ['filterTaste', 'taste'], ['filterDietary', 'dietary']]
    .forEach(function (pair) {
      $(pair[0]).addEventListener('change', function (e) {
        filters[pair[1]] = e.target.value;
        refreshMatched();
      });
    });

  /* ---------- Tab 2: cả nhóm đề cử ---------- */
  function loadPeople() {
    var fallback = [{ name: '', dish: '' }, { name: '', dish: '' }, { name: '', dish: '' }, { name: '', dish: '' }];
    try {
      var saved = JSON.parse(Sync.storage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length >= 2) {
        return saved.slice(0, MAX_PEOPLE).map(function (p) {
          return { name: String(p.name || '').slice(0, 20), dish: p.dish || '' };
        });
      }
    } catch (e) { /* bỏ qua, dùng mặc định */ }
    return fallback;
  }
  function savePeople() {
    try { Sync.storage.setItem(STORAGE_KEY, JSON.stringify(people)); } catch (e) { /* không lưu được cũng không sao */ }
  }

  function renderPeople() {
    var wrap = $('people');
    wrap.innerHTML = people.map(function (p, i) {
      var n = i + 1;
      return '<div class="person" data-i="' + i + '">' +
        '<span class="person-dot" aria-hidden="true"></span>' +
        '<input type="text" class="form-control person-name" maxlength="20" placeholder="Người ' + n + '" aria-label="Tên người ' + n + '">' +
        '<input type="text" class="form-control person-dish" maxlength="40" placeholder="Nhập tên món muốn ăn..." aria-label="Món của người ' + n + '">' +
        '<button type="button" class="icon-btn person-random" title="Gợi ý ngẫu nhiên" aria-label="Gợi ý ngẫu nhiên món cho người ' + n + '"><i class="bi bi-dice-5"></i></button>' +
        '<button type="button" class="icon-btn person-remove" title="Xóa người này" aria-label="Xóa người ' + n + '"' + (people.length <= 2 ? ' disabled' : '') + '><i class="bi bi-x-lg"></i></button>' +
        '</div>';
    }).join('');
    wrap.querySelectorAll('.person').forEach(function (row, i) {
      row.querySelector('.person-name').value = people[i].name;
      row.querySelector('.person-dish').value = people[i].dish;
    });
    $('addPersonBtn').disabled = people.length >= MAX_PEOPLE;
  }

  function personIndex(target) { return parseInt(target.closest('.person').dataset.i, 10); }
  // Gợi ý ngẫu nhiên tên món (chỉ để gợi ý — người dùng vẫn có thể gõ đè lại bất cứ tên món gì)
  function pickRandomDishName(exceptNames) {
    var options = allFoods.filter(function (f) { return exceptNames.indexOf(f.name) === -1; });
    var list = options.length ? options : allFoods;
    return list[Math.floor(Math.random() * list.length)].name;
  }
  function chosenNames() { return people.map(function (p) { return p.dish; }).filter(Boolean); }

  $('people').addEventListener('input', function (e) {
    if (e.target.classList.contains('person-name')) {
      people[personIndex(e.target)].name = e.target.value;
    } else if (e.target.classList.contains('person-dish')) {
      people[personIndex(e.target)].dish = e.target.value;
    } else {
      return;
    }
    savePeople();
    applyItems();
  });
  $('people').addEventListener('click', function (e) {
    var randomBtn = e.target.closest('.person-random');
    var removeBtn = e.target.closest('.person-remove');
    if (randomBtn) {
      var i = personIndex(randomBtn);
      people[i].dish = pickRandomDishName(chosenNames());
      randomBtn.closest('.person').querySelector('.person-dish').value = people[i].dish;
      savePeople(); applyItems();
    } else if (removeBtn && people.length > 2) {
      people.splice(personIndex(removeBtn), 1);
      savePeople(); renderPeople(); applyItems();
    }
  });
  $('addPersonBtn').addEventListener('click', function () {
    if (people.length >= MAX_PEOPLE) return;
    people.push({ name: '', dish: '' });
    savePeople(); renderPeople(); applyItems();
    var inputs = $('people').querySelectorAll('.person-name');
    inputs[inputs.length - 1].focus();
  });
  $('fillRandomBtn').addEventListener('click', function () {
    people.forEach(function (p) { if (!p.dish) p.dish = pickRandomDishName(chosenNames()); });
    savePeople(); renderPeople(); applyItems();
  });

  /* ---------- Chuyển tab / chế độ ---------- */
  function setSource(next) {
    source = next;
    var isGroup = next === 'group';
    $('tabCriteria').setAttribute('aria-selected', String(!isGroup));
    $('tabGroup').setAttribute('aria-selected', String(isGroup));
    $('panelCriteria').hidden = isGroup;
    $('panelGroup').hidden = !isGroup;
    // Tiêu đề đổi theo đúng chế độ đang chọn — trước đây cố định "Cả nhóm ăn gì hôm nay?" dù
    // đang ở chế độ lọc theo ý mình một mình (không phải lúc nào cũng có "cả nhóm").
    $('goiYTitle').textContent = isGroup ? 'Cả nhóm ăn gì hôm nay?' : 'Hôm nay ăn gì đây?';
    $('goiYSubtitle').textContent = isGroup
      ? 'Mỗi người đề cử một món rồi quay để chốt. Vòng quay luôn xoay nhẹ, bấm vào là quay thật.'
      : 'Lọc theo ý bạn rồi quay để chốt. Vòng quay luôn xoay nhẹ, bấm vào là quay thật.';
    try { history.replaceState(null, '', isGroup ? '#nhom' : window.location.pathname + window.location.search); } catch (e) { /* bỏ qua */ }
    applyItems();
  }
  $('tabCriteria').addEventListener('click', function () { setSource('criteria'); });
  $('tabGroup').addEventListener('click', function () { setSource('group'); });

  function setMode(next) {
    mode = next;
    var isWheel = next === 'wheel';
    $('wheelStage').classList.toggle('d-none', !isWheel);
    $('boxStage').classList.toggle('d-none', isWheel);
    $('modeWheelBtn').setAttribute('aria-pressed', String(isWheel));
    $('modeBoxBtn').setAttribute('aria-pressed', String(!isWheel));
  }
  $('modeWheelBtn').addEventListener('click', function () { setMode('wheel'); });
  $('modeBoxBtn').addEventListener('click', function () { setMode('box'); });

  /* ---------- Quay / mở hộp ---------- */
  function doSpin() {
    if (getItems().length < 2) return;
    if (mode === 'wheel') { if (!busy) wheel.spin(); } else { box.openRandom(); }
  }

  // Kết quả rút gọn (cả nhóm tự gõ tên món): tên món + 2 lựa chọn. Khi ra từ hộp bí ẩn, thẻ này
  // hiện CHỒNG LÊN TRÊN hộp vừa mở (không còn pháo giấy — hiệu ứng mở hộp đã đủ "đã" rồi).
  // "Chưa vừa lòng" -> đóng lại, quay/mở tiếp được ngay. "Chính nó rồi" -> chốt, báo thành công.
  function showSimpleResult(food, onReject) {
    $('simpleResultName').textContent = food.name;
    var nomEl = $('simpleResultNominator');
    if (food.nominatedBy) {
      nomEl.textContent = food.nominatedBy + ' đề cử món này';
      nomEl.classList.remove('d-none');
    } else {
      nomEl.classList.add('d-none');
    }
    var modalEl = $('simpleResultModal');
    var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
    if (typeof logFoodHistory === 'function') logFoodHistory(food);
    if (mode !== 'box' && typeof confetti === 'function') {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 }, colors: ['#F97316', '#F59E0B', '#EF4444', '#8B5E34', '#FFFFFF'] });
      if (typeof playConfettiSound === 'function') playConfettiSound();
    }
    $('simpleResultRejectBtn').onclick = function () {
      // Vòng quay tự quay lại ngay sau khi đóng -> khung mở hộp (nếu có, vốn không mở ở chế
      // độ này) không việc gì phải đóng. Hộp bí ẩn thì để listener đóng khung như bình thường,
      // lộ lại lưới hộp cho người dùng tự bấm sang hộp khác.
      if (mode === 'wheel') skipNextBoxClose = true;
      modal.hide();
      if (typeof onReject === 'function') onReject();
    };
    $('simpleResultAcceptBtn').onclick = function () {
      modal.hide();
      showToast('success', 'Đã chốt: ' + food.name + ' 🎉');
    };
  }

  function handleResult(food) {
    busy = false;
    syncButtons(getItems());
    if (source === 'group') {
      // Vòng quay: "chưa vừa lòng" thì tự quay lại luôn (một cơ chế duy nhất).
      // Hộp bí ẩn: mỗi hộp là một lựa chọn riêng, "chưa vừa lòng" chỉ đóng popup lại
      // để người dùng tự bấm sang hộp khác — không tự mở giúp, tránh mở lụi.
      showSimpleResult(food, mode === 'wheel' ? doSpin : null);
    } else {
      // Theo tiêu chí: vẫn hiện thẻ kết quả đầy đủ như cũ (ảnh, công thức, quán bán...).
      // Bấm "Quay lại" thì loại luôn món vừa ra khỏi vòng quay/hộp trong phiên này rồi quay tiếp.
      showResultModal(food, function () {
        // Hộp bí ẩn: sắp mở lại ngay (hộp mới hiện lên trong cùng khung) nên không đóng khung giữa chừng.
        if (mode === 'box') skipNextBoxClose = true;
        rejectedIds.add(food.id);
        selected.delete(food.id);
        renderPickGrid();
        applyItems();
        doSpin();
      }, { confetti: mode !== 'box' });
    }
  }

  // Đóng khung phóng to mở hộp đúng lúc thẻ/modal kết quả đã đóng hẳn (không phải lúc đóng
  // để quay/mở lại ngay — xem skipNextBoxClose) — nhờ vậy hộp vừa mở + thẻ kết quả hiện CHỒNG
  // LÊN NHAU cùng lúc thay vì đóng khung hộp rồi mới mở modal riêng.
  ['resultModal', 'simpleResultModal'].forEach(function (id) {
    $(id).addEventListener('hidden.bs.modal', function () {
      if (skipNextBoxClose) { skipNextBoxClose = false; return; }
      if (box) box.closeReveal();
    });
  });

  wheel = createWheel($('wheelCanvas'), [], handleResult, function () {
    busy = true;
    syncButtons(getItems());
  }, { exact: true, minItems: 2 });
  box = createBoxGame($('boxGrid'), [], handleResult);

  $('spinWheelBtn').addEventListener('click', doSpin);
  $('dockSpinBtn').addEventListener('click', doSpin);
  $('resetBoxesBtn').addEventListener('click', function () { box.reset(); syncButtons(getItems()); });

  /* ---------- Khởi tạo ---------- */
  renderPeople();
  if (source === 'group') setSource('group');
  refreshMatched();
});
