# -*- coding: utf-8 -*-
"""Sinh trang NGOÀI (index.html): trang công khai DUY NHẤT, ai cũng xem được mà
không cần đăng nhập — gộp cả 3 vai trò Trang Chủ + Giới Thiệu + Liên Hệ vào một
trang cuộn dài (không còn gioi-thieu.html/lien-he.html riêng, xem lịch sử sửa
đổi nếu cần khôi phục). Thứ tự: hero + poster chạy ngang + vì sao nên thử + video
giới thiệu + 3 bước + cảm nhận + băng CTA + footer (khối thương hiệu trong footer đóng vai
trò Giới Thiệu tóm tắt, id="gioi-thieu"). Form Liên Hệ cũ đã chuyển thành hộp
thoại "Góp ý & liên hệ" dùng chung mọi trang (js/widgets/feedback.js). Đây là trang
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
            <!-- FoodBot bình luận theo từng lần lướt (js/pages/index.js → botSay) -->
            <div class="swipe-bot">
              <img class="swipe-bot-avatar" src="../image/chat-bot-192.png" alt="" width="48" height="48">
              <p class="swipe-bot-bubble" id="swipeBotText" aria-live="polite">Kéo thẻ sang phải nếu thích, sang trái nếu không nha. Lướt hết 6 món là mình đoán ra gu bạn liền!</p>
            </div>
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

            <!-- "Gu ăn của bạn" sau khi lướt hết thẻ (js/pages/index.js → showResult) -->
            <div class="swipe-result d-none" id="swipeResult">
              <div class="gu-emoji" id="guEmoji" aria-hidden="true"></div>
              <p class="gu-credit" id="guCredit"></p>
              <p class="gu-label">Gu ăn của bạn là</p>
              <p class="gu-title" id="guTitle"></p>
              <p class="gu-desc" id="guDesc"></p>
              <div class="gu-badges" id="guBadges"></div>
              <p class="swipe-result-title">Bạn đã thả tim <span id="swipeLikeCount">0</span> món</p>
              <div class="swipe-result-chips" id="swipeResultChips"></div>
              <a href="dang-ky.html" class="btn btn-brand">Đăng ký để nhận gợi ý đúng gu</a>
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

<!-- 3. VÌ SAO NÊN DÙNG: tiêu đề (cùng kiểu .section-head với "Hôm nay bạn thèm gì?") + 4 thẻ (kiểu ở .why-* trong landing.css) -->
<section class="section why-section" aria-labelledby="whyTitle">
  <div class="container">
    <div class="section-head" data-reveal>
      <div>
        <h2 id="whyTitle">Ăn gì, để tụi mình lo</h2>
        <p>Bốn thứ giúp bạn chốt món nhanh hơn mỗi ngày.</p>
      </div>
    </div>
    <div class="why-grid">
      <article class="why-card is-hero" data-reveal>
        <span class="why-num" aria-hidden="true">01</span>
        <span class="why-icon"><img src="../image/vong-quay-160.png" alt="" width="64" height="64"></span>
        <h3>Vòng quay may mắn</h3>
        <p>Không biết chọn gì thì để vòng quay chọn giúp. Quay lại thoải mái tới khi ưng ý.</p>
        <span class="why-tag">Tính năng được dùng nhiều nhất</span>
      </article>
      <article class="why-card" data-reveal>
        <span class="why-num" aria-hidden="true">02</span>
        <span class="why-icon why-icon-full"><img src="../image/loc-160.png" alt="" width="64" height="64"></span>
        <h3>Lọc theo ý bạn</h3>
        <p>Chọn bữa ăn, ngân sách, khẩu vị và chế độ ăn. Vòng quay chỉ quay trong các món hợp với bạn.</p>
        <span class="why-tag">Bữa ăn · Giá · Khẩu vị</span>
      </article>
      <article class="why-card" data-reveal>
        <span class="why-num" aria-hidden="true">03</span>
        <span class="why-icon why-icon-full"><img src="../image/cung-nhom-160.png" alt="" width="64" height="64"></span>
        <h3>Quyết định cùng cả nhóm</h3>
        <p>Mỗi người đề cử một món, món nào nhiều người chọn sẽ dễ trúng hơn khi quay chung.</p>
        <span class="why-tag">Hết cảnh "ăn gì cũng được"</span>
      </article>
      <article class="why-card" data-reveal>
        <span class="why-num" aria-hidden="true">04</span>
        <span class="why-icon why-icon-full"><img src="../image/note-160.png" alt="" width="64" height="64"></span>
        <h3>Công thức và quán gợi ý</h3>
        <p>Mỗi món đều có nguyên liệu, các bước nấu, dinh dưỡng và vài quán để bạn đến thử.</p>
        <span class="why-tag">Tự nấu hay đi ăn đều có</span>
      </article>
    </div>
  </div>
</section>

<!-- 4. VIDEO GIỚI THIỆU (frontend/video/: gioi-thieu.mp4 + ảnh bìa + phụ đề .vtt; nút phát + tạm dừng nhạc nền ở js/pages/index.js) -->
<section class="section pt-0 demo-section" id="video" aria-labelledby="demoTitle">
  <div class="container">
    <div class="row g-4 g-lg-5 align-items-center">
      <div class="col-lg-5" data-reveal>
        <h2 id="demoTitle" class="demo-title">Bụng bạn đã chọn được món chưa?</h2>
        <p class="demo-lead">Từ "ăn gì cũng được" tới lúc chốt kèo. Bấm vào từng phần để xem nhanh.</p>
        <ol class="demo-chapters" id="demoChapters">
          <li><button type="button" data-t="5.6"><span class="demo-time">0:05</span>Vòng quay may mắn</button></li>
          <li><button type="button" data-t="15.2"><span class="demo-time">0:15</span>Cả nhóm cùng đề cử</button></li>
          <li><button type="button" data-t="20.8"><span class="demo-time">0:21</span>Bắn hộp quà bí ẩn</button></li>
          <li><button type="button" data-t="26.6"><span class="demo-time">0:27</span>Công thức và quán gợi ý</button></li>
        </ol>
      </div>
      <div class="col-lg-7" data-reveal>
        <div class="demo-video">
          <video id="demoVideo" preload="none" playsinline poster="../video/gioi-thieu-poster.jpg" aria-label="Video giới thiệu Hôm Nay Ăn Gì?">
            <source src="../video/gioi-thieu.mp4" type="video/mp4">
            <track kind="captions" src="../video/gioi-thieu.vtt" srclang="vi" label="Tiếng Việt">
          </video>
          <button type="button" class="demo-play" id="demoPlay" aria-label="Phát video giới thiệu"><i class="bi bi-play-fill"></i></button>
          <span class="demo-duration" id="demoDuration">0:38</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- 5. BA BƯỚC BẮT ĐẦU -->
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

<!-- 6. CẢM NHẬN -->
<section class="section pt-0" aria-labelledby="quoteTitle">
  <div class="container">
    <h2 id="quoteTitle" class="mb-4" data-reveal>Mọi người nói gì</h2>
    <div class="row row-cols-1 row-cols-md-3 g-3 g-lg-4">
      <div class="col" data-reveal>
        <div class="quote-card">
          <p>"Cả nhóm tôi hết phải ngồi trước tòa E cãi nhau " trưa nay ăn gì? ". Quay một cái xong luôn."</p>
          <span class="quote-by">Nhóm bạn Tuấn Anh TDTU</span>
        </div>
      </div>
      <div class="col" data-reveal>
        <div class="quote-card">
          <p>"Thích nhất là có sẵn quán gợi ý, khỏi phải suy nghĩ rồi lại ngập ngừng 15-20 phút."</p>
          <span class="quote-by">Các bạn bên CLB ETIT khoa CNTT</span>
        </div>
      </div>
      <div class="col" data-reveal>
        <div class="quote-card">
          <p>"Lọc theo ngân sách sinh viên vẫn ra cả chục món ngon, không sợ hết tiền."</p>
          <span class="quote-by">Bạn Đỗ Quang Huy </span>
        </div>
      </div>
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
