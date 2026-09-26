/* pages/auth-bg.js — nền ảnh món ăn cuộn dọc cho trang đăng nhập/đăng ký (xem auth_side_bg trong tools/build/generate.py). */
document.addEventListener('DOMContentLoaded', function () {
  var col1 = document.getElementById('authCol1');
  if (!col1) return;
  var cols = [col1, document.getElementById('authCol2'), document.getElementById('authCol3')];
  var pics = allFoods.map(function (f) { return f.image; }).sort(function () { return 0.5 - Math.random(); });
  var per = Math.ceil(pics.length / 3);
  var groups = [pics.slice(0, per), pics.slice(per, per * 2), pics.slice(per * 2)];
  cols.forEach(function (col, i) {
    var html = groups[i].map(function (src) {
      return '<img src="' + src + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">';
    }).join('');
    col.innerHTML = html + html; // nhân đôi danh sách để cuộn được liền mạch, không giật
  });
});

