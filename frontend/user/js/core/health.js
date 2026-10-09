/* Health profile, log and weekly plan use Sync.storage, backed by MySQL. */

var HEALTH_PROFILE_KEY = 'hom_nay_an_gi_health_profile';
var HEALTH_LOG_KEY = 'hom_nay_an_gi_health_log';
var FOOD_HISTORY_KEY = 'hom_nay_an_gi_food_history';

var ACTIVITY_FACTORS = { it: 1.2, nhe: 1.375, vua: 1.55, nhieu: 1.725 };
var ACTIVITY_LABEL = {
  it: 'Ít vận động (ngồi nhiều, ít tập thể dục)',
  nhe: 'Vận động nhẹ (tập 1-3 buổi/tuần)',
  vua: 'Vận động vừa (tập 3-5 buổi/tuần)',
  nhieu: 'Vận động nhiều (tập 6-7 buổi/tuần, lao động tay chân)',
};
var GOAL_LABEL = { giam: 'Giảm cân', giu: 'Giữ dáng', tang: 'Tăng cân' };

// "YYYY-MM-DD" theo giờ ĐỊA PHƯƠNG của trình duyệt. Không dùng Date#toISOString() cho việc
// này — nó luôn quy đổi ra giờ UTC, nên ở múi giờ trước UTC như Việt Nam (UTC+7), bất kể lúc
// nào trong ngày, kết quả cũng bị lùi lại đúng 1 ngày so với ngày thật của người dùng.
function toLocalDateStr(d) {
  d = d || new Date();
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

/* ---------- Hồ sơ sức khỏe ---------- */
function getHealthProfile() {
  try {
    var raw = Sync.storage.getItem(HEALTH_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function saveHealthProfile(profile) {
  profile.updatedAt = Date.now();
  try { Sync.storage.setItem(HEALTH_PROFILE_KEY, JSON.stringify(profile)); } catch (e) {}
  return profile;
}

/* ---------- BMI ---------- */
function calcBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  var heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

// Mốc phân loại BMI theo chuẩn châu Á (thường dùng tại Việt Nam) — thấp hơn chuẩn
// quốc tế (WHO) một chút ở ngưỡng thừa cân/béo phì.
function bmiCategory(bmi) {
  if (bmi == null) return { label: '—', cls: 'secondary' };
  if (bmi < 18.5) return { label: 'Thiếu cân', cls: 'info' };
  if (bmi < 23) return { label: 'Bình thường', cls: 'success' };
  if (bmi < 25) return { label: 'Thừa cân', cls: 'warning' };
  return { label: 'Béo phì', cls: 'danger' };
}

/* ---------- Nhu cầu năng lượng (Mifflin-St Jeor) ---------- */
function calcBMR(profile) {
  var base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  return Math.round(profile.gender === 'nu' ? base - 161 : base + 5);
}

function calcTDEE(profile) {
  var factor = ACTIVITY_FACTORS[profile.activity] || ACTIVITY_FACTORS.it;
  return Math.round(calcBMR(profile) * factor);
}

// Điều chỉnh theo mục tiêu: giảm cân bớt ~15% (không dưới mốc an toàn 1200 kcal),
// tăng cân cộng thêm ~15%, giữ dáng thì giữ nguyên TDEE.
function calcTargetCalories(profile) {
  var tdee = calcTDEE(profile);
  if (profile.goal === 'giam') return Math.max(1200, Math.round(tdee * 0.85));
  if (profile.goal === 'tang') return Math.round(tdee * 1.15);
  return tdee;
}

/* ---------- Nhật ký cân nặng ---------- */
function getHealthLog() {
  try {
    var raw = Sync.storage.getItem(HEALTH_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

// Mỗi ngày chỉ giữ 1 mốc (ghi đè nếu ghi lại cùng ngày). Nếu mốc vừa thêm là mốc
// mới nhất, đồng bộ luôn cân nặng vào hồ sơ để Thực Đơn Sức Khỏe tính đúng calo.
function addHealthLogEntry(dateStr, weightKg, heightCm) {
  var log = getHealthLog().filter(function (e) { return e.date !== dateStr; });
  log.push({ date: dateStr, weightKg: weightKg, bmi: calcBMI(weightKg, heightCm), ts: Date.now() });
  log.sort(function (a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); });
  try { Sync.storage.setItem(HEALTH_LOG_KEY, JSON.stringify(log)); } catch (e) {}

  var profile = getHealthProfile();
  if (profile) {
    var latest = log[log.length - 1];
    if (latest.date === dateStr) {
      profile.weightKg = weightKg;
      profile.weightDate = dateStr;
      saveHealthProfile(profile);
    }
  }
  return log;
}

// Nhóm nhật ký theo tuần/tháng/năm, lấy cân nặng trung bình mỗi nhóm — dùng vẽ xu hướng.
// Chỉ tính được trên dữ liệu đã ghi nhận trong trình duyệt này, không có dữ liệu "quá khứ".
function groupHealthLog(period) {
  var log = getHealthLog();
  var groups = {};
  log.forEach(function (entry) {
    var d = new Date(entry.date + 'T00:00:00');
    var key;
    if (period === 'year') {
      key = String(d.getFullYear());
    } else if (period === 'month') {
      key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    } else {
      var dow = (d.getDay() + 6) % 7; // đưa Thứ 2 về 0 để tính mốc đầu tuần
      var monday = new Date(d);
      monday.setDate(d.getDate() - dow);
      key = toLocalDateStr(monday);
    }
    (groups[key] = groups[key] || []).push(entry.weightKg);
  });
  return Object.keys(groups).sort().map(function (key) {
    var arr = groups[key];
    var avg = arr.reduce(function (s, w) { return s + w; }, 0) / arr.length;
    return { key: key, avgWeight: Math.round(avg * 10) / 10 };
  });
}

/* ---------- Lịch sử món đã chọn (vòng quay / hộp quà bí ẩn) ----------
   Gọi từ showResultModal (main.js) và showSimpleResult (gen_goi_y.py) mỗi khi
   có kết quả mới, để Nhật Ký Sức Khỏe đối chiếu được "gần đây ăn gì". */
function getFoodHistory() {
  try {
    var raw = Sync.storage.getItem(FOOD_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function logFoodHistory(food) {
  if (!food || !food.id) return;
  try {
    var list = getFoodHistory();
    // showResultModal() được gọi lại để vẽ lại nút khi bấm "Lưu món" trên cùng 1 kết quả —
    // tránh ghi trùng nhiều lần cho cùng 1 lần quay/mở hộp bằng cách bỏ qua nếu mốc gần nhất
    // là đúng món này và vừa ghi cách đây chưa tới vài giây.
    if (list[0] && list[0].id === food.id && Date.now() - list[0].ts < 4000) return;
    list.unshift({ id: food.id, name: food.name, image: food.image, calories: food.calories, ts: Date.now() });
    if (list.length > 30) list = list.slice(0, 30);
    Sync.storage.setItem(FOOD_HISTORY_KEY, JSON.stringify(list));
  } catch (e) {}
}

/* ---------- Thực đơn tuần theo nhu cầu calo ---------- */
var WEEK_DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
var PLAN_MEAL_TYPES = ['sang', 'trua', 'toi'];

function pickMealFood(mealType, budget, usedIds, options) {
  options = options || {};
  var candidates = filterFoods(allFoods, {
    mealType: mealType,
    dietary: options.dietary || 'all',
    taste: options.taste || 'all',
    priceCategory: options.priceCategory || 'all',
  });
  if (!candidates.length) candidates = allFoods.filter(function (f) { return f.mealType.includes(mealType); });
  if (!candidates.length) candidates = allFoods;

  // Ưu tiên món chưa dùng trong tuần để đỡ lặp, nhưng nếu bộ lọc hẹp quá thì đành chấp nhận trùng.
  var fresh = candidates.filter(function (f) { return !usedIds.has(f.id); });
  var pool = fresh.length ? fresh : candidates;

  // Sắp theo độ lệch calo so với ngân sách mỗi bữa, lấy nhóm 5 món gần nhất rồi chọn ngẫu nhiên
  // trong đó — vừa đúng lượng calo cần, vừa không ra đúng 1 món y hệt mỗi lần tạo thực đơn.
  var sorted = pool.slice().sort(function (a, b) { return Math.abs(a.calories - budget) - Math.abs(b.calories - budget); });
  var top = sorted.slice(0, Math.min(5, sorted.length));
  return top.length ? top[Math.floor(Math.random() * top.length)] : null;
}

function generateWeeklyPlan(targetCaloriesPerDay, options) {
  var perMealBudget = targetCaloriesPerDay / PLAN_MEAL_TYPES.length;
  var usedIds = new Set();
  var days = [];
  for (var d = 0; d < 7; d++) {
    var meals = {};
    var dayTotal = 0;
    PLAN_MEAL_TYPES.forEach(function (mt) {
      var food = pickMealFood(mt, perMealBudget, usedIds, options);
      if (food) { meals[mt] = food; usedIds.add(food.id); dayTotal += food.calories; }
    });
    days.push({ label: WEEK_DAY_LABELS[d], meals: meals, totalCalories: dayTotal });
  }
  return days;
}

// Đổi lại 1 món trong 1 ngày (không tạo lại cả tuần) — tránh trùng với các món còn lại trong
// tuần và tránh ra lại đúng món cũ vừa bị đổi.
function rerollPlanMeal(plan, dayIndex, mealType, targetCaloriesPerDay, options) {
  var usedIds = new Set();
  plan.forEach(function (day, i) {
    PLAN_MEAL_TYPES.forEach(function (mt) {
      if (i === dayIndex && mt === mealType) return;
      if (day.meals[mt]) usedIds.add(day.meals[mt].id);
    });
  });
  var current = plan[dayIndex].meals[mealType];
  if (current) usedIds.add(current.id);

  var perMealBudget = targetCaloriesPerDay / PLAN_MEAL_TYPES.length;
  var food = pickMealFood(mealType, perMealBudget, usedIds, options);
  if (food) {
    plan[dayIndex].meals[mealType] = food;
    plan[dayIndex].totalCalories = PLAN_MEAL_TYPES.reduce(function (sum, mt) {
      var f = plan[dayIndex].meals[mt];
      return sum + (f ? f.calories : 0);
    }, 0);
  }
  return food;
}

// Lưu lại thực đơn tuần đang xem (chỉ lưu id món + bộ lọc đang dùng, không lưu nguyên object
// món ăn) để tải lại trang không bị xáo thực đơn mỗi lần — chỉ đổi khi người dùng chủ động bấm
// "Tạo thực đơn mới" hoặc đổi từng món riêng lẻ.
var WEEKLY_PLAN_KEY = 'hom_nay_an_gi_weekly_plan';

function saveWeeklyPlan(days, options) {
  var compact = {
    meta: options || {},
    days: days.map(function (day) {
      var ids = {};
      PLAN_MEAL_TYPES.forEach(function (mt) { if (day.meals[mt]) ids[mt] = day.meals[mt].id; });
      return { label: day.label, meals: ids };
    }),
    savedAt: Date.now(),
  };
  try { Sync.storage.setItem(WEEKLY_PLAN_KEY, JSON.stringify(compact)); } catch (e) {}
}

function loadWeeklyPlan() {
  try {
    var raw = Sync.storage.getItem(WEEKLY_PLAN_KEY);
    if (!raw) return null;
    var compact = JSON.parse(raw);
    var days = compact.days.map(function (day) {
      var meals = {};
      var total = 0;
      PLAN_MEAL_TYPES.forEach(function (mt) {
        var food = day.meals[mt] ? getFoodById(day.meals[mt]) : null;
        if (food) { meals[mt] = food; total += food.calories; }
      });
      return { label: day.label, meals: meals, totalCalories: total };
    });
    return { meta: compact.meta, days: days };
  } catch (e) { return null; }
}
