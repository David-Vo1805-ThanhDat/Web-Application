/* pages/tai-khoan.js — logic riêng của trang tai-khoan.html (nạp sau js/core và js/widgets). */
document.addEventListener('DOMContentLoaded', function () {
  var user = getCurrentUser();
  if (!user) return; // trang đã tự chặn ở <head> nếu chưa đăng nhập, đây chỉ là phòng hờ

  function paintUser(u) {
    document.getElementById('acctName').textContent = u.name;
    document.getElementById('acctEmail').textContent = u.email;
    document.getElementById('acctEmail2').textContent = u.email;
    document.getElementById('acctAvatar').textContent = initials(u.name);
    document.getElementById('acctSince').textContent = u.since
      ? new Date(u.since).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—';
  }
  paintUser(user);
  document.getElementById('nameInput').value = user.name;
  document.getElementById('acctFavCount').textContent = getFavoritesFromStorage().length;

  document.getElementById('nameForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var newName = document.getElementById('nameInput').value.trim();
    if (!newName) { showToast('error', 'Tên hiển thị không được để trống'); return; }
    var updated = updateUserName(newName);
    paintUser(updated);
    if (typeof renderAuthNav === 'function') renderAuthNav(); // cập nhật luôn chip tên trên navbar
    showToast('success', 'Đã cập nhật tên hiển thị');
  });

  document.getElementById('clearDataBtn').addEventListener('click', function () {
    if (!window.confirm('Xoá hết món yêu thích và đăng xuất khỏi trình duyệt này?')) return;
    try { localStorage.removeItem('hom_nay_an_gi_favorites'); } catch (e) {}
    logoutUser();
  });

  /* ---- Hồ sơ sức khỏe (xem js/health.js): nhập 1 lần, dùng chung cho Thực Đơn Sức Khỏe
     và Nhật Ký Sức Khỏe. Chỉ lưu trên trình duyệt này, giống mọi dữ liệu khác của trang. ---- */
  var activitySelect = document.getElementById('hpActivity');
  activitySelect.innerHTML = Object.keys(ACTIVITY_LABEL).map(function (key) {
    return '<option value="' + key + '">' + ACTIVITY_LABEL[key] + '</option>';
  }).join('');
  var goalSelect = document.getElementById('hpGoal');
  goalSelect.innerHTML = Object.keys(GOAL_LABEL).map(function (key) {
    return '<option value="' + key + '">' + GOAL_LABEL[key] + '</option>';
  }).join('');

  function paintHealthSummary(profile) {
    var summary = document.getElementById('healthSummary');
    if (!profile) { summary.classList.add('d-none'); return; }
    var bmi = calcBMI(profile.weightKg, profile.heightCm);
    var cat = bmiCategory(bmi);
    document.getElementById('hsBMI').textContent = bmi != null ? bmi : '—';
    document.getElementById('hsBMICat').textContent = cat.label;
    document.getElementById('hsBMICat').className = 'badge text-bg-' + cat.cls;
    document.getElementById('hsTDEE').textContent = calcTDEE(profile) + ' kcal';
    document.getElementById('hsTarget').textContent = calcTargetCalories(profile) + ' kcal';
    document.getElementById('hsGoal').textContent = GOAL_LABEL[profile.goal] || '—';
    summary.classList.remove('d-none');
  }

  var healthProfile = getHealthProfile();
  if (healthProfile) {
    document.getElementById('hpHeight').value = healthProfile.heightCm;
    document.getElementById('hpWeight').value = healthProfile.weightKg;
    document.getElementById('hpAge').value = healthProfile.age;
    document.getElementById('hpGender').value = healthProfile.gender;
    activitySelect.value = healthProfile.activity;
    goalSelect.value = healthProfile.goal;
    paintHealthSummary(healthProfile);
  }

  document.getElementById('healthForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var profile = {
      heightCm: parseFloat(document.getElementById('hpHeight').value),
      weightKg: parseFloat(document.getElementById('hpWeight').value),
      age: parseInt(document.getElementById('hpAge').value, 10),
      gender: document.getElementById('hpGender').value,
      activity: activitySelect.value,
      goal: goalSelect.value,
    };
    if (!profile.heightCm || !profile.weightKg || !profile.age) {
      showToast('error', 'Bạn nhập đủ chiều cao, cân nặng và tuổi giúp mình nhé');
      return;
    }
    saveHealthProfile(profile);
    paintHealthSummary(profile);
    showToast('success', 'Đã lưu hồ sơ sức khỏe 💪');
  });
});
