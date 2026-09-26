/* pages/thuc-don-suc-khoe.js — logic riêng của trang thuc-don-suc-khoe.html (nạp sau js/core và js/widgets). */
document.addEventListener('DOMContentLoaded', function () {
  var profile = getHealthProfile();
  if (!profile) {
    document.getElementById('planEmptyState').classList.remove('d-none');
    document.getElementById('planMain').classList.add('d-none');
    return;
  }

  function paintSummary() {
    var bmi = calcBMI(profile.weightKg, profile.heightCm);
    var cat = bmiCategory(bmi);
    document.getElementById('psBMI').textContent = bmi != null ? bmi : '—';
    document.getElementById('psBMICat').textContent = cat.label;
    document.getElementById('psBMICat').className = 'badge text-bg-' + cat.cls;
    document.getElementById('psTDEE').textContent = calcTDEE(profile) + ' kcal';
    document.getElementById('psTarget').textContent = calcTargetCalories(profile) + ' kcal';
    document.getElementById('psGoal').textContent = GOAL_LABEL[profile.goal] || '—';
  }
  paintSummary();

  var MEAL_META = {
    sang: { label: 'Sáng', icon: '🌅' },
    trua: { label: 'Trưa', icon: '🍚' },
    toi: { label: 'Tối', icon: '🌙' },
  };
  var tasteSelect = document.getElementById('planTaste');
  var dietarySelect = document.getElementById('planDietary');
  var grid = document.getElementById('planGrid');
  var currentPlan = null; // { days: [...] } — xem generateWeeklyPlan/rerollPlanMeal trong js/health.js

  function currentOptions() {
    return { taste: tasteSelect.value, dietary: dietarySelect.value };
  }

  function renderDayCard(day, dayIndex) {
    var rows = PLAN_MEAL_TYPES.map(function (mt) {
      var food = day.meals[mt];
      var meta = MEAL_META[mt];
      if (!food) {
        return '<div class="pick-item is-static"><span class="plan-meal-icon">' + meta.icon + '</span>' +
          '<div class="pi-text"><span class="pi-name text-muted">Không đủ món phù hợp</span></div></div>';
      }
      return '<div class="pick-item is-static">' +
        '<span class="plan-meal-icon">' + meta.icon + '</span>' +
        '<img src="' + food.image + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' +
        '<div class="pi-text"><a class="pi-name" href="chi-tiet-mon-an.html?id=' + food.id + '" title="' + food.name + '">' + food.name + '</a>' +
        '<span class="small text-muted">' + meta.label + ' • ' + food.calories + ' kcal</span></div>' +
        '<button type="button" class="plan-reroll-btn" title="Đổi món khác" data-day="' + dayIndex + '" data-meal="' + mt + '"><i class="bi bi-arrow-repeat"></i></button>' +
        '</div>';
    }).join('');
    return '<div class="col"><div class="panel plan-day-card">' +
      '<div class="plan-day-head"><h3 class="plan-day-title">' + day.label + '</h3>' +
      '<span class="badge plan-day-total">' + day.totalCalories + ' kcal</span></div>' +
      rows + '</div></div>';
  }

  function renderPlan() {
    grid.innerHTML = currentPlan.days.map(renderDayCard).join('');
  }

  var saved = loadWeeklyPlan();
  if (saved) {
    tasteSelect.value = (saved.meta && saved.meta.taste) || 'all';
    dietarySelect.value = (saved.meta && saved.meta.dietary) || 'all';
    currentPlan = { days: saved.days };
  } else {
    currentPlan = { days: generateWeeklyPlan(calcTargetCalories(profile), currentOptions()) };
    saveWeeklyPlan(currentPlan.days, currentOptions());
  }
  renderPlan();

  document.getElementById('planRegenBtn').addEventListener('click', function () {
    currentPlan = { days: generateWeeklyPlan(calcTargetCalories(profile), currentOptions()) };
    saveWeeklyPlan(currentPlan.days, currentOptions());
    renderPlan();
    showToast('success', 'Đã tạo thực đơn tuần mới 🎉');
  });

  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('.plan-reroll-btn');
    if (!btn) return;
    var dayIndex = parseInt(btn.dataset.day, 10);
    var mt = btn.dataset.meal;
    var food = rerollPlanMeal(currentPlan.days, dayIndex, mt, calcTargetCalories(profile), currentOptions());
    saveWeeklyPlan(currentPlan.days, currentOptions());
    renderPlan();
    if (food) showToast('success', 'Đã đổi món'); else showToast('info', 'Không tìm được món khác phù hợp');
  });
});
