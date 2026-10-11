/* pages/tai-khoan.js — logic riêng của trang tai-khoan.html (nạp sau js/core và js/widgets). */
document.addEventListener('DOMContentLoaded', function () {
  var user = getCurrentUser();
  if (!user) return; // trang đã tự chặn ở <head> nếu chưa đăng nhập, đây chỉ là phòng hờ

  function paintUser(u) {
    document.getElementById('acctName').textContent = u.name;
    document.getElementById('acctEmail').textContent = u.email;
    document.getElementById('acctEmail2').textContent = u.email;
    document.getElementById('acctAvatar').innerHTML = avatarInner(u);
    document.getElementById('avatarRemoveBtn').classList.toggle('d-none', !u.avatar);
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
    updateUserName(newName).then(function (updated) {
      paintUser(updated); renderAuthNav(); showToast('success', 'Đã cập nhật tên hiển thị');
    }).catch(function (error) { showToast('error', error.message); });
  });

  /* ---- Ảnh đại diện: chọn ảnh → cắt vuông ở giữa, thu nhỏ 256px, nén JPEG → lưu lên server (profile.update).
     Server chỉ nhận JPEG/PNG/WebP dưới 150 KB nên ảnh luôn được thu nhỏ ở đây trước khi gửi. ---- */
  var AVATAR_SIZE = 256;
  var avatarInput = document.getElementById('avatarInput');
  var avatarPickBtn = document.getElementById('avatarPickBtn');
  avatarPickBtn.addEventListener('click', function () { avatarInput.click(); });

  function makeAvatar(file) {
    return new Promise(function (resolve, reject) {
      if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return reject(new Error('Chỉ nhận ảnh JPG, PNG hoặc WebP'));
      if (file.size > 10 * 1024 * 1024) return reject(new Error('Ảnh quá lớn, vui lòng chọn ảnh dưới 10 MB'));
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var side = Math.min(img.naturalWidth, img.naturalHeight);   // cắt hình vuông ở giữa ảnh
        var canvas = document.createElement('canvas');
        canvas.width = canvas.height = AVATAR_SIZE;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);   // nền trắng cho ảnh PNG trong suốt
        ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
        URL.revokeObjectURL(url);
        var quality = 0.86, data = canvas.toDataURL('image/jpeg', quality);
        while (data.length > 190000 && quality > 0.4) { quality -= 0.1; data = canvas.toDataURL('image/jpeg', quality); }
        resolve(data);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Không đọc được ảnh này')); };
      img.src = url;
    });
  }

  function saveAvatar(dataUrl, okMessage) {
    var label = avatarPickBtn.innerHTML;
    avatarPickBtn.disabled = true; avatarPickBtn.textContent = 'Đang lưu…';
    return updateUserAvatar(dataUrl).then(function (updated) {
      paintUser(updated); renderAuthNav(); showToast('success', okMessage);
    }).catch(function (error) { showToast('error', error.message); })
      .then(function () { avatarPickBtn.disabled = false; avatarPickBtn.innerHTML = label; });
  }

  avatarInput.addEventListener('change', function () {
    var file = avatarInput.files[0];
    avatarInput.value = '';   // chọn lại đúng ảnh cũ vẫn kích hoạt sự kiện
    if (!file) return;
    makeAvatar(file).then(function (dataUrl) { return saveAvatar(dataUrl, 'Đã cập nhật ảnh đại diện'); })
      .catch(function (error) { showToast('error', error.message); });
  });
  document.getElementById('avatarRemoveBtn').addEventListener('click', function () {
    if (!window.confirm('Xoá ảnh đại diện và dùng lại chữ cái đầu của tên?')) return;
    saveAvatar(null, 'Đã xoá ảnh đại diện');
  });

  document.getElementById('clearDataBtn').addEventListener('click', function () {
    if (!window.confirm('Xoá hết món yêu thích và đăng xuất khỏi trình duyệt này?')) return;
    try { Sync.storage.removeItem('hom_nay_an_gi_favorites'); } catch (e) {}
    logoutUser();
  });

  /* ---- Hồ sơ sức khỏe (xem js/health.js): nhập 1 lần, dùng chung cho Thực Đơn Sức Khỏe
     và Nhật Ký Sức Khỏe. Lưu trong database của tài khoản. ---- */
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
