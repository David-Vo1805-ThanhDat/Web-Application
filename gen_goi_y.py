# -*- coding: utf-8 -*-
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from generate import page, result_modal_block

BODY = """
<section class="container py-4 py-lg-5 dock-space">
  <div class="page-head">
    <h1>Cả nhóm ăn gì hôm nay?</h1>
    <p>Chọn món rồi quay để chốt. Vòng quay luôn xoay nhẹ, bấm vào là quay thật.</p>
  </div>

  <div class="row g-4 align-items-start">

    <!-- Bước 2: quay (bên phải trên máy tính, dính khi cuộn; trên điện thoại hiện trước) -->
    <div class="col-lg-5 order-1 order-lg-2">
      <div class="tool-wheel">
        <div class="panel wheel-panel">
          <div class="panel-head">
            <h2 class="panel-title"><span class="panel-num">2</span> Quay để chốt</h2>
            <div class="seg" id="modeSwitch" role="group" aria-label="Cách chọn ngẫu nhiên">
              <button type="button" id="modeWheelBtn" aria-pressed="true">Vòng quay</button>
              <button type="button" id="modeDiceBtn" aria-pressed="false">Hộp bí ẩn</button>
            </div>
          </div>

          <div id="wheelStage">
            <div class="wheel-wrapper">
              <div class="wheel-pointer" aria-hidden="true"></div>
              <div class="wheel-ring">
                <canvas id="wheelCanvas" width="560" height="560" role="img" aria-label="Vòng quay chọn món ăn. Bấm để quay."></canvas>
              </div>
            </div>
            <button type="button" class="btn btn-brand btn-lg mt-3" id="spinWheelBtn">Quay chọn món</button>
          </div>

          <div id="diceStage" class="d-none">
            <div class="row g-3 mx-auto my-3" style="max-width:380px;" id="mysteryBoxes">
              <div class="col-4"><div class="mystery-box" data-idx="0"></div></div>
              <div class="col-4"><div class="mystery-box" data-idx="1"></div></div>
              <div class="col-4"><div class="mystery-box" data-idx="2"></div></div>
            </div>
            <button type="button" class="btn btn-brand btn-lg" id="rollDiceBtn">Lắc chọn món</button>
          </div>

          <p class="spin-note" id="spinNote" aria-live="polite"></p>
        </div>
      </div>
    </div>

    <!-- Bước 1: chọn món -->
    <div class="col-lg-7 order-2 order-lg-1">
      <div class="panel picker">
        <div class="panel-head">
          <h2 class="panel-title"><span class="panel-num">1</span> Chọn món</h2>
          <div class="seg" role="tablist" aria-label="Cách chọn món">
            <button type="button" role="tab" id="tabCriteria" aria-selected="true" aria-controls="panelCriteria">Theo tiêu chí</button>
            <button type="button" role="tab" id="tabGroup" aria-selected="false" aria-controls="panelGroup">Cả nhóm đề cử</button>
          </div>
        </div>

        <!-- Tab 1: lọc theo tiêu chí rồi tick chọn món -->
        <div id="panelCriteria" role="tabpanel" aria-labelledby="tabCriteria">
          <div class="filter-bar">
            <div>
              <label for="filterMeal">Bữa ăn</label>
              <select class="form-select" id="filterMeal">
                <option value="all">Tất cả</option>
                <option value="sang">Sáng</option>
                <option value="trua">Trưa</option>
                <option value="toi">Tối</option>
                <option value="an-vat">Ăn vặt</option>
              </select>
            </div>
            <div>
              <label for="filterPrice">Ngân sách</label>
              <select class="form-select" id="filterPrice">
                <option value="all">Tất cả</option>
                <option value="under-30k">Dưới 30k</option>
                <option value="30k-60k">30k - 60k</option>
                <option value="60k-150k">60k - 150k</option>
                <option value="above-150k">Trên 150k</option>
              </select>
            </div>
            <div>
              <label for="filterTaste">Khẩu vị</label>
              <select class="form-select" id="filterTaste">
                <option value="all">Tất cả</option>
                <option value="cay">Cay</option>
                <option value="ngot">Ngọt</option>
                <option value="thanh-dam">Thanh đạm</option>
                <option value="beo-ngay">Béo ngậy</option>
              </select>
            </div>
            <div>
              <label for="filterDietary">Chế độ ăn</label>
              <select class="form-select" id="filterDietary">
                <option value="all">Tất cả</option>
                <option value="vegetarian">Chay</option>
                <option value="eat-clean">Eat-clean</option>
                <option value="low-carb">Low-carb</option>
              </select>
            </div>
          </div>

          <div class="pick-toolbar">
            <div class="pick-count" id="pickCount" aria-live="polite"></div>
            <div class="d-flex gap-3">
              <button type="button" class="text-btn" id="randomPickBtn"><i class="bi bi-shuffle"></i> Chọn ngẫu nhiên 8 món</button>
              <button type="button" class="text-btn" id="clearPickBtn">Bỏ chọn hết</button>
            </div>
          </div>
          <div class="pick-grid" id="pickGrid"></div>
        </div>

        <!-- Tab 2: mỗi người đề cử một món -->
        <div id="panelGroup" role="tabpanel" aria-labelledby="tabGroup" hidden>
          <p class="hint">Mỗi người chọn một món mình muốn ăn. Món nào được nhiều người chọn sẽ chiếm nhiều ô hơn trên vòng quay, nên dễ trúng hơn.</p>
          <div class="people" id="people"></div>
          <div class="d-flex flex-wrap gap-2 mt-3">
            <button type="button" class="btn btn-outline-brand" id="addPersonBtn"><i class="bi bi-person-plus"></i> Thêm người</button>
            <button type="button" class="btn btn-outline-brand" id="fillRandomBtn"><i class="bi bi-dice-5"></i> Chọn giúp người chưa chọn</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Thanh quay cố định ở đáy màn hình điện thoại -->
<div class="spin-dock" id="spinDock">
  <span id="dockInfo"></span>
  <button type="button" class="btn btn-brand" id="dockSpinBtn">Quay chọn món</button>
</div>
""" + result_modal_block()

EXTRA_SCRIPT = """<script src="js/wheel.js"></script>
<script src="js/dice.js"></script>
<script>
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
  var people = loadPeople();
  var wheel = null;
  var dice = null;

  var foodById = {};
  allFoods.forEach(function (f) { foodById[f.id] = f; });

  function shuffle(list) { return list.slice().sort(function () { return 0.5 - Math.random(); }); }
  function $(id) { return document.getElementById(id); }

  /* ---------- Danh sách món trên vòng quay ---------- */
  function nameOf(person, index) { return (person.name || '').trim() || 'Người ' + (index + 1); }

  function getItems() {
    if (source === 'criteria') {
      return matched.filter(function (f) { return selected.has(f.id); });
    }
    var items = [];
    people.forEach(function (p, i) {
      if (p.dish && foodById[p.dish]) items.push(Object.assign({}, foodById[p.dish], { nominatedBy: nameOf(p, i) }));
    });
    return items;
  }

  function syncButtons(items) {
    var canSpin = items.length >= 2;
    ['spinWheelBtn', 'rollDiceBtn', 'dockSpinBtn'].forEach(function (id) { $(id).disabled = busy || !canSpin; });
    $('dockInfo').textContent = items.length + ' món trên vòng quay';
    if (source === 'criteria') {
      $('spinNote').textContent = canSpin
        ? 'Vòng quay có ' + items.length + ' món bạn đã chọn.'
        : 'Chọn ít nhất 2 món để quay.';
    } else {
      var n = people.filter(function (p) { return p.dish; }).length;
      $('spinNote').textContent = canSpin
        ? 'Vòng quay có ' + items.length + ' ô từ ' + n + ' người đề cử.'
        : 'Cần ít nhất 2 người chọn món để quay.';
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
    if (dice) dice.updateCandidates(items);
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
        return '<button type="button" class="pick-item" data-id="' + f.id + '" aria-pressed="' + on + '">' +
          '<img src="' + f.image + '" alt="" loading="lazy" onerror="this.style.visibility=\\'hidden\\'">' +
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
    defaultSelection();
    renderPickGrid();
    applyItems();
  }

  $('pickGrid').addEventListener('click', function (e) {
    var btn = e.target.closest('.pick-item');
    if (!btn) return;
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
    selected = new Set(shuffle(matched).slice(0, 8).map(function (f) { return f.id; }));
    renderPickGrid();
    applyItems();
  });
  $('clearPickBtn').addEventListener('click', function () {
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
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved) && saved.length >= 2) {
        return saved.slice(0, MAX_PEOPLE).map(function (p) {
          return { name: String(p.name || '').slice(0, 20), dish: p.dish || '' };
        });
      }
    } catch (e) { /* bỏ qua, dùng mặc định */ }
    return fallback;
  }
  function savePeople() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(people)); } catch (e) { /* không lưu được cũng không sao */ }
  }

  var byCategory = {};
  allFoods.forEach(function (f) { (byCategory[f.category] = byCategory[f.category] || []).push(f); });
  var dishOptions = '<option value="">Chọn món...</option>' + Object.keys(byCategory).map(function (cat) {
    return '<optgroup label="' + (CATEGORY_LABEL[cat] || cat) + '">' +
      byCategory[cat].slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'vi'); })
        .map(function (f) { return '<option value="' + f.id + '">' + f.name + '</option>'; }).join('') +
      '</optgroup>';
  }).join('');

  function renderPeople() {
    var wrap = $('people');
    wrap.innerHTML = people.map(function (p, i) {
      var n = i + 1;
      return '<div class="person" data-i="' + i + '">' +
        '<span class="person-dot" aria-hidden="true"></span>' +
        '<input type="text" class="form-control person-name" maxlength="20" placeholder="Người ' + n + '" aria-label="Tên người ' + n + '">' +
        '<select class="form-select person-dish" aria-label="Món của người ' + n + '">' + dishOptions + '</select>' +
        '<button type="button" class="icon-btn person-random" title="Chọn ngẫu nhiên" aria-label="Chọn ngẫu nhiên món cho người ' + n + '"><i class="bi bi-dice-5"></i></button>' +
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
  function pickRandomDish(exceptIds) {
    var options = allFoods.filter(function (f) { return exceptIds.indexOf(f.id) === -1; });
    var list = options.length ? options : allFoods;
    return list[Math.floor(Math.random() * list.length)].id;
  }
  function chosenIds() { return people.map(function (p) { return p.dish; }).filter(Boolean); }

  $('people').addEventListener('input', function (e) {
    if (!e.target.classList.contains('person-name')) return;
    people[personIndex(e.target)].name = e.target.value;
    savePeople();
    applyItems();
  });
  $('people').addEventListener('change', function (e) {
    if (!e.target.classList.contains('person-dish')) return;
    people[personIndex(e.target)].dish = e.target.value;
    savePeople();
    applyItems();
  });
  $('people').addEventListener('click', function (e) {
    var randomBtn = e.target.closest('.person-random');
    var removeBtn = e.target.closest('.person-remove');
    if (randomBtn) {
      var i = personIndex(randomBtn);
      people[i].dish = pickRandomDish(chosenIds());
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
    people.forEach(function (p) { if (!p.dish) p.dish = pickRandomDish(chosenIds()); });
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
    try { history.replaceState(null, '', isGroup ? '#nhom' : window.location.pathname + window.location.search); } catch (e) { /* bỏ qua */ }
    applyItems();
  }
  $('tabCriteria').addEventListener('click', function () { setSource('criteria'); });
  $('tabGroup').addEventListener('click', function () { setSource('group'); });

  function setMode(next) {
    mode = next;
    var isWheel = next === 'wheel';
    $('wheelStage').classList.toggle('d-none', !isWheel);
    $('diceStage').classList.toggle('d-none', isWheel);
    $('modeWheelBtn').setAttribute('aria-pressed', String(isWheel));
    $('modeDiceBtn').setAttribute('aria-pressed', String(!isWheel));
  }
  $('modeWheelBtn').addEventListener('click', function () { setMode('wheel'); });
  $('modeDiceBtn').addEventListener('click', function () { setMode('dice'); });

  /* ---------- Quay ---------- */
  function doSpin() {
    if (busy || getItems().length < 2) return;
    if (mode === 'wheel') { wheel.spin(); } else { busy = true; syncButtons(getItems()); dice.roll(); }
  }
  function handleResult(food) {
    busy = false;
    syncButtons(getItems());
    showResultModal(food, doSpin);
  }

  wheel = createWheel($('wheelCanvas'), [], handleResult, function () {
    busy = true;
    syncButtons(getItems());
  }, { exact: true, minItems: 2 });
  dice = createDiceRandomizer($('mysteryBoxes'), [], handleResult);

  $('spinWheelBtn').addEventListener('click', doSpin);
  $('rollDiceBtn').addEventListener('click', doSpin);
  $('dockSpinBtn').addEventListener('click', doSpin);

  /* ---------- Khởi tạo ---------- */
  renderPeople();
  if (source === 'group') setSource('group');
  refreshMatched();
});
</script>"""

if __name__ == "__main__":
    html = page(
        "Cả nhóm ăn gì hôm nay? | Hôm nay ăn gì?",
        "Chọn món cho cả nhóm: mỗi người đề cử một món rồi quay vòng quay để chốt, hoặc lọc theo bữa, ngân sách và khẩu vị.",
        BODY, EXTRA_SCRIPT
    )
    with open(os.path.join(HERE, "goi-y.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("goi-y.html:", len(html), "ky tu")
