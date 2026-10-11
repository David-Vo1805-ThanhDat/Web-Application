/* widgets/feedback.js — hộp thoại "Góp ý & Liên hệ" dùng chung mọi trang (thay cho form Liên Hệ cũ ở index.html).
   Mở bằng bất kỳ phần tử nào có [data-open-feedback] (mục "Góp ý & liên hệ" trong menu tài khoản, link ở chân trang).
   - Đã đăng nhập: form chỉ còn chủ đề + nội dung; tên và email lấy từ tài khoản (getCurrentUser) rồi gửi qua
     Backend.sendFeedback → backend/api/public feedback.create (API cũ của Phong, không đổi).
   - Khách chưa đăng nhập: chỉ hiện email/fanpage + nút đăng nhập để gửi góp ý.
   Kiểu ở css/components/feedback.css. */
(function () {
  var modalEl = null;

  function buildModal() {
    var user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    var body = user
      ? '<p class="fb-sender"><span class="nav-user-avatar">' + avatarInner(user) + '</span>' +
          '<span>Gửi với tên <strong>' + escHtml(user.name) + '</strong><br><span class="text-muted">' + escHtml(user.email) + '</span></span></p>' +
        '<form id="fbForm" novalidate>' +
          '<label class="form-label small fw-bold text-uppercase text-muted" for="fbSubject">Chủ đề</label>' +
          '<select class="form-select mb-3" id="fbSubject">' +
            '<option value="gop-y">Góp ý chung về website</option>' +
            '<option value="de-xuat-mon">Đề xuất món ăn mới</option>' +
            '<option value="bao-loi">Báo lỗi</option>' +
            '<option value="hop-tac">Hợp tác khác</option>' +
          '</select>' +
          '<div class="mb-3 d-none" id="fbDishGroup">' +
            '<label class="form-label small fw-bold text-uppercase text-muted" for="fbDish">Tên món muốn thêm <span class="text-danger">*</span></label>' +
            '<input type="text" class="form-control" id="fbDish" maxlength="120" placeholder="Ví dụ: Bánh căn Phan Rang">' +
          '</div>' +
          '<label class="form-label small fw-bold text-uppercase text-muted" for="fbMessage">Nội dung <span class="text-danger">*</span></label>' +
          '<textarea class="form-control" id="fbMessage" rows="4" maxlength="2000" placeholder="Bạn muốn nhắn gì cho nhóm?"></textarea>' +
          '<div class="small text-danger mt-1 d-none" id="fbError"></div>' +
          '<button type="submit" class="btn btn-brand w-100 mt-3" id="fbSubmit"><i class="bi bi-send"></i> <span>Gửi lời nhắn</span></button>' +
        '</form>'
      : '<p class="text-muted">Đăng nhập để gửi góp ý trực tiếp cho nhóm, hoặc liên hệ qua:</p>' +
        '<ul class="fb-contacts list-unstyled">' +
          '<li><img src="../image/gmail-96.png" alt="" width="28" height="28"> <span><strong>Email</strong><br>hotro@homnayangi.vn</span></li>' +
          '<li><img src="../image/fb-96.png" alt="" width="28" height="28"> <span><strong>Fanpage</strong><br>Hôm Nay Ăn Gì?</span></li>' +
        '</ul>' +
        '<a class="btn btn-brand w-100" href="dang-nhap.html">Đăng nhập để gửi góp ý</a>';

    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="modal fade feedback-modal" id="feedbackModal" tabindex="-1" aria-labelledby="feedbackTitle" aria-hidden="true">' +
        '<div class="modal-dialog modal-dialog-centered"><div class="modal-content">' +
          '<div class="modal-header border-0 pb-0">' +
            '<h2 class="modal-title h5 fw-bold" id="feedbackTitle"><img src="../image/gmail-96.png" alt="" width="26" height="26"> Góp ý &amp; Liên hệ</h2>' +
            '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>' +
          '</div>' +
          '<div class="modal-body">' + body + '</div>' +
        '</div></div>' +
      '</div>';
    modalEl = wrap.firstChild;
    document.body.appendChild(modalEl);
    if (user) wireForm(user);
  }

  function wireForm(user) {
    var form = modalEl.querySelector('#fbForm');
    var subject = modalEl.querySelector('#fbSubject');
    var dishGroup = modalEl.querySelector('#fbDishGroup');
    var error = modalEl.querySelector('#fbError');
    var btn = modalEl.querySelector('#fbSubmit');
    subject.addEventListener('change', function () { dishGroup.classList.toggle('d-none', subject.value !== 'de-xuat-mon'); });
    function fail(msg) { error.textContent = msg; error.classList.remove('d-none'); }
    form.addEventListener('input', function () { error.classList.add('d-none'); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var message = modalEl.querySelector('#fbMessage').value.trim();
      var dish = modalEl.querySelector('#fbDish').value.trim();
      var isDish = subject.value === 'de-xuat-mon';
      if (isDish && !dish) return fail('Bạn nhập tên món muốn thêm nha.');
      if (message.length < 5) return fail('Nội dung cần ít nhất 5 ký tự.');
      error.classList.add('d-none');
      btn.disabled = true;
      Backend.available().then(function (online) {
        if (!online) throw new Error(Backend.OFFLINE_MESSAGE);
        return Backend.sendFeedback({
          name: user.name, email: user.email, subject: subject.value,
          message: (isDish ? 'Món đề xuất: ' + dish + '\n' : '') + message,
        });
      }).then(function () {
        btn.disabled = false;
        form.reset();
        dishGroup.classList.add('d-none');
        bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        showToast('success', 'Cảm ơn bạn đã góp ý! Nhóm sẽ xem và phản hồi sớm nhất.');
      }).catch(function (err) {
        btn.disabled = false;
        fail(err.message);
      });
    });
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-open-feedback]');
    if (!trigger) return;
    e.preventDefault();
    if (!modalEl) buildModal();
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  });
})();
