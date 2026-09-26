/* seed/seed-audit.js — Nhật ký hoạt động mẫu (342 sự kiện) + cài đặt hệ thống mặc định. */
(function () {
  'use strict';

  var MIN = 60000, H = 3600000, DAY = 86400000;

  function atHour(daysAgo, h, m) { var d = new Date(); d.setHours(h, m, 0, 0); return d.getTime() - daysAgo * DAY; }

  function build() {
    var A = 'Quản trị viên';
    var e = [
      { type: 'edit', actor: A, text: 'đã cập nhật món “Phở Bò Hà Nội”', ip: '118.70.24.7', ts: Date.now() - 5 * MIN },
      { type: 'user', actor: 'Hệ thống', text: 'người dùng mới đăng ký: nguyenvana@gmail.com', ip: '118.70.24.105', ts: Date.now() - 22 * MIN },
      { type: 'approve', actor: A, text: 'đã duyệt đánh giá 5★ cho “Bún Chả Hà Nội”', ip: '118.70.24.2', ts: Date.now() - 41 * MIN },
      { type: 'reply', actor: A, text: 'đã phản hồi góp ý #1042', ip: '118.70.24.153', ts: Date.now() - 1 * H - 5 * MIN },
      { type: 'add', actor: A, text: 'đã thêm món mới “Bánh Canh Cua”', ip: '118.70.24.192', ts: Date.now() - 3 * H },
      { type: 'lock', actor: A, text: 'đã tạm khoá tài khoản huy.do.qn@gmail.com', ip: '118.70.24.107', ts: Date.now() - 5 * H },
      { type: 'delete', actor: A, text: 'đã xoá quán “Bún Đậu Cô Ba” khỏi Bún Đậu Mắm Tôm', ip: '118.70.24.58', ts: atHour(1, 10, 5) },
      { type: 'login', actor: 'Phạm Thu Hà', text: 'đã đăng nhập vào bảng quản trị', ip: '118.70.24.100', ts: atHour(1, 8, 47) },
    ];
    var pool = [
      ['edit', A, 'đã cập nhật món “Bún Bò Huế”'], ['approve', A, 'đã duyệt đánh giá 4★ cho “Cơm Tấm Sườn Bì Chả”'],
      ['user', 'Hệ thống', 'người dùng mới đăng ký: lan.vu@outlook.com'], ['reply', A, 'đã phản hồi góp ý #1031'],
      ['add', A, 'đã thêm quán “Phở Hòa Pasteur” cho Phở Bò Hà Nội'], ['edit', 'Phạm Thu Hà', 'đã sửa danh mục “Món nước”'],
      ['lock', A, 'đã mở khoá tài khoản tuan.bui@gmail.com'], ['login', A, 'đã đăng nhập vào bảng quản trị'],
      ['delete', A, 'đã xoá đánh giá vi phạm #2871'], ['edit', A, 'đã ẩn món “Salad Ức Gà Sốt Mè Rang Healthy”'],
    ];
    var R = window.Seed.rnd, t = atHour(2, 18, 0);
    for (var i = 0; e.length < 342; i++) {
      var p = pool[R('au' + i, 0, pool.length - 1)];
      t -= R('at' + i, 20, 240) * MIN;
      e.push({ type: p[0], actor: p[1], text: p[2], ip: '118.70.24.' + R('ai' + i, 2, 220), ts: t });
    }
    return e.map(function (x, i) { x.id = i + 1; return x; });
  }

  function settings() {
    return {
      general: { platformName: 'Hôm Nay Ăn Gì?', tagline: 'Trưa nay ăn gì trong vài giây', contactEmail: 'support@homnayangi.vn', timezone: 'GMT+7 — Asia/Ho_Chi_Minh', maintenance: false },
      admins: [
        { id: 1, name: 'Quản trị viên', email: 'admin@homnayangi.vn', role: 'super' },
        { id: 2, name: 'Phạm Thu Hà', email: 'thuha.pham@gmail.com', role: 'moderator' },
      ],
      notify: { pendingReview: true, newUser: false, weeklyReport: true, inApp: true },
      security: { twoFactor: true, autoLogout: true, ipRestrict: false },
      backup: { last: 'Hôm nay, 03:00', freq: 'Hằng ngày, tự động' },
    };
  }

  window.Seed = window.Seed || {};
  window.Seed.audit = build;
  window.Seed.settings = settings;
})();
