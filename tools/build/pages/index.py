# -*- coding: utf-8 -*-
"""Sinh trang NGOÀI (index.html): trang công khai DUY NHẤT, ai cũng xem được mà
không cần đăng nhập — gộp cả 3 vai trò Trang Chủ + Giới Thiệu + Liên Hệ vào một
trang cuộn dài (không còn gioi-thieu.html/lien-he.html riêng, xem lịch sử sửa
đổi nếu cần khôi phục). Thứ tự: hero + poster chạy ngang + vì sao nên thử + 3
bước + cảm nhận + Liên Hệ (id="lien-he") + băng CTA + footer (khối thương hiệu
trong footer đóng vai trò Giới Thiệu tóm tắt, id="gioi-thieu"). Đây là trang
đầu tiên mọi người thấy khi vào web; muốn dùng vòng quay, gợi ý, khám phá...
thì phải đăng nhập (xem dang-nhap.html / dang-ky.html), lúc đó mới vào
"Trang Chủ" thật (trang-chu.html)."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))  # tools/build (nơi có generate.py)
from generate import OUT_DIR, page

BODY = """
<script>document.documentElement.classList.add('fx');</script>

<!-- 1. HERO NGOÀI: mồi bằng thẻ món ăn LƯỚT được kiểu Tinder, khỏi cần đăng nhập -->
<section class="hero">
  <div class="container" style="--bs-gutter-x: 3rem;">
    <div class="row align-items-center g-5">
      <div class="col-lg-6">
        <span class="hero-chip"><span id="chipText">🌅 Sáng ăn gì ta?</span></span>
        <h1 class="hero-title">Đói meo mà chưa<br>biết <span class="text-grad">ăn gì hôm nay?</span></h1>
        <p class="hero-lede">
          Lướt vài thẻ món là web nắm được gu của bạn, chưa ưng thì bấm vòng quay may mắn chốt trong 5 giây,
          kèm công thức và quán ăn gợi ý liền tay. Rủ thêm hội bạn cùng chọn cho đỡ cãi nhau "ăn gì bây giờ".
        </p>
        <div class="hero-actions">
          <a href="dang-ky.html" class="btn btn-brand btn-lg">Bắt đầu thật á nha</a>
        </div>
        <p class="hero-signin">Đã có tài khoản? <a href="dang-nhap.html">Đăng nhập</a></p>
        <div class="hero-stats">
          <div class="hero-stat"><b id="statFoods">31+</b><span>Món ngon đặc sắc</span></div>
          <div class="hero-stat"><b>5 giây</b><span>Quyết định bữa ăn</span></div>
          <div class="hero-stat"><b>100%</b><span>Miễn phí sử dụng</span></div>
        </div>
      </div>

      <div class="col-lg-6">
        <div class="lucky-card swipe-card">
          <div class="swipe-card-pad">
            <span class="lucky-chip">Lướt để chọn gu ăn</span>
            <h2 class="lucky-title">Bạn thích món nào?</h2>
          </div>

          <div class="swipe-stage" id="swipeStage">
            <div class="swipe-deck" id="swipeDeck"></div>
            <span class="swipe-hint-like" aria-hidden="true">THÍCH</span>
            <span class="swipe-hint-nope" aria-hidden="true">BỎ QUA</span>
          </div>

          <div class="swipe-card-pad">
            <div class="swipe-controls" id="swipeControls">
              <button type="button" class="swipe-btn swipe-btn-nope" id="swipeNopeBtn" aria-label="Bỏ qua món này"><img src="../image/chu-x-96.png" alt="" width="30" height="30"></button>
              <span class="swipe-counter" id="swipeCounter">1/6</span>
              <button type="button" class="swipe-btn swipe-btn-like" id="swipeLikeBtn" aria-label="Thích món này"><img src="../image/trai-tim-96.png" alt="" width="34" height="34"></button>
            </div>
            <p class="swipe-help">Kéo thẻ sang phải nếu thích, sang trái nếu không</p>

            <div class="swipe-result d-none" id="swipeResult">
              <p class="swipe-result-title">Bạn thích <span id="swipeLikeCount">0</span> món!</p>
              <div class="swipe-result-chips" id="swipeResultChips"></div>
              <p class="swipe-result-lock"><i class="bi bi-lock-fill"></i> Đăng ký để xem đủ gợi ý hợp gu này, kèm công thức &amp; quán ăn</p>
              <a href="dang-ky.html" class="btn btn-brand btn-sm">Xem gợi ý đầy đủ</a>
              <button type="button" class="text-btn mt-2" id="swipeReplayBtn">Lướt lại từ đầu</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 2. POSTER MÓN ĂN CHẠY NGANG (hình lớn, hai hàng chạy ngược chiều) -->
<section class="poster-strip-wrap" aria-label="Một vài món trong thực đơn">
  <div class="poster-strip" id="posterA"></div>
  <div class="poster-strip" id="posterB"></div>
</section>

<!-- 3. VÌ SAO NÊN DÙNG -->
<section class="section" aria-labelledby="whyTitle">
  <div class="container">
    <div class="section-head" data-reveal>
      <div>
        <h2 id="whyTitle">Vì sao nên thử Hôm Nay Ăn Gì?</h2>
        <p>Bốn lý do để đăng ký chỉ mất mười giây.</p>
      </div>
    </div>
    <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3 g-lg-4">
      <div class="col" data-reveal>
        <div class="feature-card">
          <span class="feature-icon feature-icon-img"><img src="../image/vong-quay-160.png" alt="" width="48" height="48"></span>
          <h3>Vòng quay may mắn</h3>
          <p>Không biết chọn gì thì để vòng quay chọn giúp. Quay lại thoải mái tới khi ưng ý.</p>
        </div>
      </div>
      <div class="col" data-reveal>
        <div class="feature-card">
          <span class="feature-icon feature-icon-img feature-icon-full"><img src="../image/loc-160.png" alt="" width="48" height="48"></span>
          <h3>Lọc theo ý bạn</h3>
          <p>Chọn bữa ăn, ngân sách, khẩu vị và chế độ ăn. Vòng quay chỉ quay trong các món hợp với bạn.</p>
        </div>
      </div>
      <div class="col" data-reveal>
        <div class="feature-card">
          <span class="feature-icon feature-icon-img feature-icon-full"><img src="../image/cung-nhom-160.png" alt="" width="48" height="48"></span>
          <h3>Quyết định cùng cả nhóm</h3>
          <p>Mỗi người đề cử một món, món nào nhiều người chọn sẽ dễ trúng hơn khi quay chung.</p>
        </div>
      </div>
      <div class="col" data-reveal>
        <div class="feature-card">
          <span class="feature-icon feature-icon-img feature-icon-full"><img src="../image/note-160.png" alt="" width="48" height="48"></span>
          <h3>Công thức và quán gợi ý</h3>
          <p>Mỗi món đều có nguyên liệu, các bước nấu, dinh dưỡng và vài quán để bạn đến thử.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 4. BA BƯỚC BẮT ĐẦU -->
<section class="section pt-0" aria-labelledby="howTitle">
  <div class="container">
    <h2 id="howTitle" class="mb-4" data-reveal>Bắt đầu chỉ với ba bước</h2>
    <ol class="steps">
      <li data-reveal>
        <div class="step-card">
          <span class="step-num">1</span>
          <h3>Tạo tài khoản miễn phí</h3>
          <p>Chỉ cần email và mật khẩu, mất chưa tới mười giây.</p>
        </div>
      </li>
      <li data-reveal>
        <div class="step-card">
          <span class="step-num">2</span>
          <h3>Chọn bữa và khẩu vị</h3>
          <p>Sáng, trưa, tối hay ăn vặt. Lọc thêm theo ngân sách và chế độ ăn nếu muốn.</p>
        </div>
      </li>
      <li data-reveal>
        <div class="step-card">
          <span class="step-num">3</span>
          <h3>Quay để chốt món</h3>
          <p>Vòng quay chọn ngẫu nhiên trong các món phù hợp. Chưa ưng thì quay lại.</p>
        </div>
      </li>
    </ol>
  </div>
</section>

<!-- 5. CẢM NHẬN -->
<section class="section pt-0" aria-labelledby="quoteTitle">
  <div class="container">
    <h2 id="quoteTitle" class="mb-4" data-reveal>Mọi người nói gì</h2>
    <div class="row row-cols-1 row-cols-md-3 g-3 g-lg-4">
      <div class="col" data-reveal>
        <div class="quote-card">
          <p>"Cả phòng trọ hết cãi nhau trưa nay ăn gì. Quay một cái xong luôn."</p>
          <span class="quote-by">— Nhóm sinh viên năm 3</span>
        </div>
      </div>
      <div class="col" data-reveal>
        <div class="quote-card">
          <p>"Thích nhất là có sẵn quán gợi ý, khỏi phải tìm thêm trên bản đồ."</p>
          <span class="quote-by">— Người đi làm, quận Bình Thạnh</span>
        </div>
      </div>
      <div class="col" data-reveal>
        <div class="quote-card">
          <p>"Lọc theo ngân sách sinh viên vẫn ra cả chục món ngon, không sợ hết tiền."</p>
          <span class="quote-by">— Sinh viên năm nhất</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 6. LIÊN HỆ (gộp từ trang lien-he.html cũ — xem ghi chú đầu file) -->
<section class="section pt-0" id="lien-he" aria-labelledby="lienHeTitle">
  <div class="container" style="max-width:52rem;">
    <div class="text-center mb-5" data-reveal>
      <span class="badge bg-brand-subtle-custom text-brand-emphasis-custom px-3 py-2 rounded-pill mb-2">
        <i class="bi bi-envelope-heart"></i> Chúng Mình Luôn Lắng Nghe
      </span>
      <h2 id="lienHeTitle" class="fw-black display-6">Liên Hệ &amp; Góp Ý 💌</h2>
      <p class="text-muted mb-0">Có góp ý, muốn đề xuất món ăn mới hay phát hiện lỗi? Gửi cho đội ngũ ngay bên dưới nhé!</p>
    </div>

    <!-- Contact info cards -->
    <div class="row row-cols-1 row-cols-sm-3 g-3 mb-5" data-reveal>
      <div class="col"><div class="bg-white rounded-3xl-custom border p-4 text-center h-100 shadow-sm">
        <div class="contact-icon"><img src="../image/gmail-96.png" alt="" width="32" height="32"></div>
        <h3 class="h6 fw-bold mt-2 mb-1">Email Hỗ Trợ</h3>
        <p class="small text-muted mb-0">hotro@homnayangi.vn</p>
      </div></div>
      <div class="col"><div class="bg-white rounded-3xl-custom border p-4 text-center h-100 shadow-sm">
        <div class="contact-icon"><img src="../image/fb-96.png" alt="" width="32" height="32"></div>
        <h3 class="h6 fw-bold mt-2 mb-1">Fanpage</h3>
        <p class="small text-muted mb-0">Theo dõi để cập nhật món mới</p>
      </div></div>
      <div class="col"><div class="bg-white rounded-3xl-custom border p-4 text-center h-100 shadow-sm">
        <div class="contact-icon"><img src="../image/clock-128.png" alt="" width="40" height="40"></div>
        <h3 class="h6 fw-bold mt-2 mb-1">Thời Gian Phản Hồi</h3>
        <p class="small text-muted mb-0">Trong vòng 1-2 ngày làm việc</p>
      </div></div>
    </div>

    <!-- Contact / contribute form -->
    <div class="bg-white rounded-3xl-custom border shadow-sm p-4 p-sm-5" data-reveal>
      <h3 class="h4 fw-extrabold mb-1">Gửi Lời Nhắn Cho Đội Ngũ</h3>
      <p class="small text-muted mb-4">Bạn có thể góp ý chung, đề xuất món ăn mới muốn thêm vào thực đơn, hoặc báo lỗi bạn gặp phải khi dùng website.</p>

      <form id="contactForm" novalidate>
        <div class="row g-3 mb-3">
          <div class="col-sm-6">
            <label class="form-label small fw-bold text-uppercase text-muted">Tên của bạn</label>
            <input type="text" class="form-control" id="cfName" placeholder="Nguyễn Văn A">
          </div>
          <div class="col-sm-6">
            <label class="form-label small fw-bold text-uppercase text-muted">Email liên hệ <span class="text-danger">*</span></label>
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
</section>

<!-- 7. CTA -->
<section class="cta-band">
  <div class="container">
    <div>
      <h2 class="display-font" data-reveal="left">Đói rồi thì đừng chần chừ nữa.</h2>
      <p class="pub-cta-note" data-reveal="left">Đăng ký miễn phí, vào thẳng vòng quay may mắn.</p>
    </div>
    <div data-reveal>
      <a href="dang-ky.html" class="btn btn-light btn-lg">Tạo tài khoản miễn phí</a>
      <p class="cta-signin">Đã có tài khoản? <a href="dang-nhap.html">Đăng nhập</a></p>
    </div>
  </div>
</section>
"""

EXTRA_SCRIPT = """<script src="js/widgets/effects.js"></script>
<script src="js/pages/index.js"></script>"""

if __name__ == "__main__":
    html = page(
        "Hôm Nay Ăn Gì? Vòng quay may mắn chọn món trong 5 giây",
        'Web gợi ý món ăn ngẫu nhiên theo bữa ăn, ngân sách, khẩu vị và chế độ ăn. Tạo tài khoản miễn phí để quay vòng quay và khám phá hơn 31 món ăn.',
        BODY, EXTRA_SCRIPT, navbar_mode="site", chatbot=True
    )
    with open(os.path.join(OUT_DIR, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("index.html:", len(html), "ky tu")
