/* seed/seed-users.js — Sinh 1.284 người dùng mẫu (7 người đầu khớp thiết kế Figma, còn lại sinh ổn định). */
(function () {
  'use strict';

  var DAY = 86400000;
  var HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
  var DEM = ['Văn', 'Thị', 'Minh', 'Ngọc', 'Quang', 'Thu', 'Anh', 'Hoàng', 'Gia', 'Thanh', 'Khánh', 'Đức', 'Mai', 'Bảo', 'Tuấn'];
  var TEN = ['An', 'Bích', 'Cường', 'Hà', 'Huy', 'Lan', 'Tuấn', 'Linh', 'Khoa', 'Nam', 'Phúc', 'Trang', 'Vy', 'Hùng', 'Quân', 'Yến', 'Dũng', 'Thảo', 'Long', 'Mai'];
  var MAIL = ['gmail.com', 'gmail.com', 'gmail.com', 'yahoo.com', 'outlook.com'];

  function ascii(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, '.');
  }

  // 7 người đầu: đúng như thiết kế
  var FIXED = [
    { name: 'Nguyễn Văn An', email: 'nguyenvana@gmail.com', joined: '2026-03-12', fav: 24, hp: true, role: 'member', status: 'active' },
    { name: 'Trần Thị Bích', email: 'bich.tran@gmail.com', joined: '2026-02-28', fav: 18, hp: true, role: 'member', status: 'active' },
    { name: 'Lê Minh Cường', email: 'cuong.le99@yahoo.com', joined: '2026-01-15', fav: 31, hp: false, role: 'member', status: 'active' },
    { name: 'Phạm Thu Hà', email: 'thuha.pham@gmail.com', joined: '2026-01-03', fav: 9, hp: true, role: 'moderator', status: 'active' },
    { name: 'Đỗ Quang Huy', email: 'huy.do.qn@gmail.com', joined: '2025-12-22', fav: 5, hp: false, role: 'member', status: 'locked' },
    { name: 'Vũ Ngọc Lan', email: 'lan.vu@outlook.com', joined: '2025-12-10', fav: 42, hp: true, role: 'member', status: 'active' },
    { name: 'Bùi Anh Tuấn', email: 'tuan.bui@gmail.com', joined: '2025-11-29', fav: 2, hp: false, role: 'member', status: 'unverified' },
  ];

  function build() {
    var H = window.Seed.hash, R = window.Seed.rnd;
    var users = FIXED.map(function (u, i) {
      return { id: i + 1, name: u.name, email: u.email, joinedAt: new Date(u.joined + 'T09:00:00').getTime(), favorites: u.fav, hasHealthProfile: u.hp, role: u.role, status: u.status };
    });
    var used = {}; users.forEach(function (u) { used[u.email] = true; });
    var t = new Date('2025-11-28T09:00:00').getTime();
    var i = FIXED.length;
    while (users.length < 1284) {
      i++;
      var name = HO[R('h' + i, 0, HO.length - 1)] + ' ' + DEM[R('d' + i, 0, DEM.length - 1)] + ' ' + TEN[R('t' + i, 0, TEN.length - 1)];
      var email = ascii(name) + (R('n' + i, 0, 9) > 5 ? R('m' + i, 1, 99) : '') + '@' + MAIL[R('e' + i, 0, MAIL.length - 1)];
      if (used[email]) email = email.replace('@', i + '@');
      used[email] = true;
      t -= R('j' + i, 3000000, 90000000);
      users.push({ id: users.length + 1, name: name, email: email, joinedAt: t, favorites: R('f' + i, 0, 45), hasHealthProfile: R('p' + i, 0, 99) < 32, role: 'member', status: 'active' });
    }
    // Chỉnh để tổng khớp thiết kế: 412 người có hồ sơ sức khỏe, 18 tài khoản bị khoá, 1 số chưa xác thực
    var hp = users.filter(function (u) { return u.hasHealthProfile; }).length, k = 7;
    while (hp !== 412 && k < users.length) { if (hp > 412 && users[k].hasHealthProfile) { users[k].hasHealthProfile = false; hp--; } else if (hp < 412 && !users[k].hasHealthProfile) { users[k].hasHealthProfile = true; hp++; } k += 3; if (k >= users.length) k = 8; }
    var locked = users.filter(function (u) { return u.status === 'locked'; }).length; k = 20;
    while (locked < 18) { if (users[k].status === 'active') { users[k].status = 'locked'; locked++; } k += 61; }
    for (k = 30; k < 60; k += 13) users[k].status = 'unverified';
    return users;
  }

  window.Seed = window.Seed || {};
  window.Seed.users = build;
})();
