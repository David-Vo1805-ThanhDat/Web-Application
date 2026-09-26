# -*- coding: utf-8 -*-
"""Sinh trang Liên hệ (lien-he.html). Trang CÔNG KHAI (không cần đăng nhập,
navbar_mode="site") — người ngoài (đối tác, người chưa dùng web...) vẫn phải
liên hệ được, không có lý do gì bắt họ đăng ký chỉ để thấy email/fanpage."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from generate import page

BODY = """
<div class="container py-5" style="max-width:52rem;">
  <div class="text-center mb-5" data-aos="fade-up">
    <span class="badge bg-brand-subtle-custom text-brand-emphasis-custom px-3 py-2 rounded-pill mb-2">
      <i class="bi bi-envelope-heart"></i> Chúng Mình Luôn Lắng Nghe
    </span>
    <h1 class="fw-black display-6">Liên Hệ &amp; Góp Ý 💌</h1>
    <p class="text-muted mb-0">Có góp ý, muốn đề xuất món ăn mới hay phát hiện lỗi? Gửi cho nhóm mình ngay bên dưới nhé!</p>
  </div>

  <!-- Contact info cards -->
  <div class="row row-cols-1 row-cols-sm-3 g-3 mb-5" data-aos="fade-up">
    <div class="col"><div class="bg-white rounded-3xl-custom border p-4 text-center h-100 shadow-sm">
      <div class="contact-icon"><i class="bi bi-envelope-fill"></i></div>
      <h3 class="h6 fw-bold mt-2 mb-1">Email Hỗ Trợ</h3>
      <p class="small text-muted mb-0">hotro@homnayangi.vn</p>
    </div></div>
    <div class="col"><div class="bg-white rounded-3xl-custom border p-4 text-center h-100 shadow-sm">
      <div class="contact-icon"><i class="bi bi-facebook"></i></div>
      <h3 class="h6 fw-bold mt-2 mb-1">Fanpage</h3>
      <p class="small text-muted mb-0">Theo dõi để cập nhật món mới</p>
    </div></div>
    <div class="col"><div class="bg-white rounded-3xl-custom border p-4 text-center h-100 shadow-sm">
      <div class="contact-icon"><i class="bi bi-clock-history"></i></div>
      <h3 class="h6 fw-bold mt-2 mb-1">Thời Gian Phản Hồi</h3>
      <p class="small text-muted mb-0">Trong vòng 1-2 ngày làm việc</p>
    </div></div>
  </div>

  <!-- Contact / contribute form -->
  <div class="bg-white rounded-3xl-custom border shadow-sm p-4 p-sm-5" data-aos="fade-up">
    <h2 class="h4 fw-extrabold mb-1">Gửi Lời Nhắn Cho Đội Ngũ</h2>
    <p class="small text-muted mb-4">Bạn có thể góp ý chung, đề xuất món ăn mới muốn thêm vào thực đơn, hoặc báo lỗi bạn gặp phải khi dùng website.</p>

    <form id="contactForm" novalidate>
      <div class="row g-3 mb-3">
        <div class="col-sm-6">
          <label class="form-label small fw-bold text-uppercase text-muted">Tên của bạn</label>
          <input type="text" class="form-control" id="cfName" placeholder="Nguyễn Văn A">
        </div>
        <div class="col-sm-6">
          <label class="form-label small fw-bold text-uppercase text-muted">Email liên hệ</label>
          <input type="email" class="form-control" id="cfEmail" placeholder="email@example.com">
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label small fw-bold text-uppercase text-muted">Chủ đề</label>
        <select class="form-select" id="cfSubject">
          <option value="gop-y">Góp ý chung về website</option>
          <option value="de-xuat-mon">Đề xuất món ăn mới</option>
          <option value="bao-loi">Báo lỗi / Bug</option>
          <option value="hop-tac">Hợp tác khác</option>
        </select>
      </div>

      <div class="mb-3 d-none" id="dishNameGroup">
        <label class="form-label small fw-bold text-uppercase text-muted">Tên Món Ăn Đề Xuất <span class="text-danger">*</span></label>
        <input type="text" class="form-control" id="cfDishName" placeholder="Ví dụ: Cháo lòng Hà Nội, Bánh căn Phan Rang...">
      </div>

      <div class="mb-4">
        <label class="form-label small fw-bold text-uppercase text-muted">Nội Dung <span class="text-danger">*</span></label>
        <textarea class="form-control" id="cfMessage" rows="4" placeholder="Nhập nội dung góp ý, đề xuất hoặc mô tả lỗi bạn gặp phải..."></textarea>
        <div class="invalid-feedback d-block text-danger small mt-1 d-none" id="cfError">Vui lòng điền đầy đủ các trường bắt buộc!</div>
      </div>

      <button type="submit" class="btn btn-brand btn-lg w-100 d-flex align-items-center justify-content-center gap-2" id="cfSubmitBtn">
        <i class="bi bi-send"></i> <span id="cfSubmitLabel">Gửi Lời Nhắn</span>
      </button>
    </form>
  </div>
</div>
"""

EXTRA_SCRIPT = """<style>
.contact-icon{width:3.2rem;height:3.2rem;border-radius:1rem;background:var(--brand-50);color:var(--brand-600);display:flex;align-items:center;justify-content:center;font-size:1.4rem;margin:0 auto;}
.bg-brand-subtle-custom{background:var(--brand-50);}
.text-brand-emphasis-custom{color:var(--brand-700);}
</style>
<script>
document.addEventListener('DOMContentLoaded', function () {
  // Trang công khai nên có thể có người chưa đăng nhập lẫn người đã đăng nhập ghé qua
  // (vd. bấm "Liên hệ" ở footer trong lúc đang dùng app) — điền sẵn tên/email nếu đã có.
  if (typeof getCurrentUser === 'function') {
    var user = getCurrentUser();
    if (user) {
      document.getElementById('cfName').value = user.name;
      document.getElementById('cfEmail').value = user.email;
    }
  }

  var subjectSelect = document.getElementById('cfSubject');
  var dishGroup = document.getElementById('dishNameGroup');
  subjectSelect.addEventListener('change', function () {
    dishGroup.classList.toggle('d-none', subjectSelect.value !== 'de-xuat-mon');
  });

  var form = document.getElementById('contactForm');
  var submitBtn = document.getElementById('cfSubmitBtn');
  var submitLabel = document.getElementById('cfSubmitLabel');
  var errorBox = document.getElementById('cfError');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var message = document.getElementById('cfMessage').value.trim();
    var dishName = document.getElementById('cfDishName').value.trim();
    var isDishSubject = subjectSelect.value === 'de-xuat-mon';

    if (!message || (isDishSubject && !dishName)) {
      errorBox.classList.remove('d-none');
      return;
    }
    errorBox.classList.add('d-none');

    submitBtn.disabled = true;
    submitLabel.textContent = 'Đang gửi...';

    setTimeout(function () {
      submitBtn.disabled = false;
      submitLabel.textContent = 'Gửi Lời Nhắn';
      form.reset();
      dishGroup.classList.add('d-none');
      showToast('success', '🎉 Cảm ơn bạn đã liên hệ! Nhóm sẽ xem xét và phản hồi sớm nhất.');
    }, 1200);
  });
});
</script>"""

if __name__ == "__main__":
    html = page(
        "Liên Hệ & Góp Ý | Hôm Nay Bạn Muốn Ăn Gì?",
        "Gửi góp ý, đề xuất món ăn mới hoặc báo lỗi cho đội ngũ Hôm Nay Bạn Muốn Ăn Gì?",
        BODY, EXTRA_SCRIPT, navbar_mode="site"
    )
    with open(os.path.join(HERE, "lien-he.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("lien-he.html:", len(html), "ky tu")
