/* seed/seed-community.js — Dữ liệu mẫu cho Đánh giá món ăn và Góp ý liên hệ (form ở trang chủ ngoài). */
(function () {
  'use strict';

  var H = 3600000, DAY = 86400000;

  var TEXTS = [
    'Rất ngon, đúng vị, sẽ quay lại nhiều lần.', 'Món hơi mặn so với khẩu vị của mình nhưng vẫn ổn.', 'Ứng dụng gợi ý rất trúng ý, quán gợi ý ở gần chỗ làm.',
    'Công thức dễ làm theo, nấu thử ở nhà cả nhà đều khen.', 'Giá hợp lý cho sinh viên, phần ăn đầy đặn.', 'Vòng quay ra đúng món mình đang thèm luôn!',
    'Nước dùng đậm đà, thịt mềm, rất đáng thử.', 'Hơi cay so với mình, mong có tuỳ chọn ít cay.', 'Quán được gợi ý hơi xa nhưng ăn xong thấy xứng đáng.',
  ];
  var SUBJECTS = {
    'gop-y': 'Góp ý chung', 'de-xuat-mon': 'Đề xuất món mới', 'bao-loi': 'Báo lỗi', 'hop-tac': 'Hợp tác',
  };
  var FB_TEXTS = [
    ['gop-y', 'Web rất tiện nhưng mong có thêm chế độ tối cho ban đêm.'],
    ['de-xuat-mon', 'Bạn thêm giúp mình món Bánh canh cua nhé, mình rất thích món này.'],
    ['bao-loi', 'Ảnh món Cháo sườn sụn không đúng món, hiện ra ảnh người.'],
    ['hop-tac', 'Bên mình là quán ăn ở Quận 7, muốn được gợi ý trên web của bạn.'],
    ['gop-y', 'Vòng quay nên có thêm âm thanh khi trúng món.'],
    ['de-xuat-mon', 'Đề xuất thêm món Bún mắm miền Tây và Bánh tráng trộn.'],
    ['bao-loi', 'Nút lưu món yêu thích đôi lúc không đổi màu ngay.'],
    ['gop-y', 'Thực đơn sức khỏe rất hay, mong có thêm bữa xế.'],
  ];

  function reviews(foods, users) {
    var R = window.Seed.rnd;
    var fig = [
      { user: 'Nguyễn Văn An', food: 'pho-bo-ha-noi', stars: 5, text: 'Nước dùng đậm đà, đúng chuẩn Hà Nội. Ứng dụng gợi ý rất trúng ý mình!', ago: 2 * H, status: 'pending' },
      { user: 'Trần Thị Bích', food: 'tra-sua-tran-chau-duong-den', stars: 4, text: 'Ngon nhưng hơi ngọt so với khẩu vị của mình, mong có tuỳ chọn ít đường.', ago: 5 * H, status: 'pending' },
      { user: 'Lê Minh Cường', food: 'mi-cay-7-cap-do', stars: 2, text: 'Cấp độ cay không rõ ràng, quán gợi ý hơi xa nhà mình.', ago: DAY, status: 'hidden' },
      { user: 'Phạm Thu Hà', food: 'com-tam-suon-bi-cha', stars: 5, text: 'Vòng quay trúng ngay món này, quán gợi ý ở Q3 rất gần chỗ làm!', ago: 2 * DAY, status: 'approved' },
    ];
    var byId = {}; foods.forEach(function (f) { byId[f.id] = f; });
    var out = fig.map(function (r, i) { return { id: i + 1, userName: r.user, foodId: r.food, foodName: byId[r.food].name, stars: r.stars, text: r.text, createdAt: Date.now() - r.ago, status: r.status, reply: '' }; });
    var pending = 2;
    for (var i = 5; i <= 60; i++) {
      var f = foods[R('rf' + i, 0, foods.length - 1)];
      var u = users[R('ru' + i, 7, 200)];
      var status = pending < 11 ? (pending++, 'pending') : (R('rs' + i, 0, 9) === 0 ? 'hidden' : 'approved');
      out.push({ id: i, userName: u.name, foodId: f.id, foodName: f.name, stars: R('rst' + i, 3, 5), text: TEXTS[R('rt' + i, 0, TEXTS.length - 1)], createdAt: Date.now() - 2 * DAY - i * 5 * H, status: status, reply: '' });
    }
    return out;
  }

  function feedback(users) {
    var R = window.Seed.rnd, out = [];
    for (var i = 0; i < 24; i++) {
      var id = 1042 - i, pair = FB_TEXTS[i % FB_TEXTS.length], u = users[R('fu' + i, 0, 300)];
      var replied = i === 0 || i > 8; // #1042 đã phản hồi; 8 góp ý kế tiếp chưa phản hồi
      if (i === 0) replied = true;
      out.push({
        id: id, name: u.name, email: u.email, subject: pair[0], subjectLabel: SUBJECTS[pair[0]], message: pair[1],
        createdAt: Date.now() - (i * 9 + 2) * H, status: replied ? 'replied' : 'new', reply: replied ? 'Cảm ơn bạn đã góp ý, đội ngũ đã ghi nhận và sẽ cân nhắc trong bản cập nhật tới.' : '',
      });
    }
    return out;
  }

  window.Seed = window.Seed || {};
  window.Seed.reviews = reviews;
  window.Seed.feedback = feedback;
  window.Seed.SUBJECTS = SUBJECTS;
})();
