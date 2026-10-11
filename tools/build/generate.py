# -*- coding: utf-8 -*-
"""Sinh các file HTML tĩnh cho website, dùng chung Navbar/Footer/Head/Scripts."""

import os

# Thư mục frontend/ (nơi ghi các file .html sinh ra) — tools/build/generate.py nằm cách gốc 2 cấp.
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(ROOT, "frontend", "user")


# Logo: bản thu nhỏ 256px của frontend/image/logo.png (ảnh gốc ~5,7 MB quá nặng để nạp ở mọi trang).
# Đổi logo: thay logo.png rồi tạo lại logo-256.png (cắt vuông quanh phần hình, 256×256).
def brand_mark():
    return """<span class="brand-mark">
          <img src="../image/logo-256.png" alt="" width="46" height="46">
        </span>"""

# Thứ tự nạp CSS QUAN TRỌNG (luật sau thắng luật trước khi cùng độ ưu tiên):
# token -> nền tảng -> thành phần -> trang -> responsive -> giảm chuyển động (cuối cùng).
CSS_FILES = [
    "base/tokens.css", "base/base.css",
    "components/buttons.css", "components/navbar.css", "components/footer.css",
    "components/sections.css", "components/food-card.css", "components/chips.css",
    "components/wheel.css", "components/modal-result.css", "components/gift-box.css", "components/music.css", "components/feedback.css",
    "pages/home.css", "pages/goi-y.css", "pages/landing.css", "pages/auth.css",
    "pages/account.css", "pages/health.css",
    "base/responsive.css", "base/motion.css",
]

def css_links():
    return "\n".join(f'<link href="css/{f}" rel="stylesheet">' for f in CSS_FILES)

def build_head(title, desc, page_css="", gated=False):
    # Trang "gated" (cần đăng nhập): chặn ngay trong <head>, trước khi phần thân trang
    # kịp vẽ ra, để tránh loé nội dung rồi mới đá về trang đăng nhập.
    guard = f"""<script>
(function () {{
  try {{
    if (!window.APP_USER) {{
      var back = location.pathname.split('/').pop() + location.search;
      location.replace('dang-nhap.html?next=' + encodeURIComponent(back || 'trang-chu.html'));
    }}
  }} catch (e) {{}}
}})();
</script>
""" if gated else ""
    return f"""<head>
<meta charset="UTF-8">
<script src="../../backend/api/auth/bootstrap.php"></script>
{guard}
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#FFF9F1">
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css" rel="stylesheet">
{css_links()}
{page_css}
</head>"""

def navbar(mode="app"):
    if mode == "public":
        # Trang xác thực (đăng nhập/đăng ký): chỉ có logo + hai nút, không có menu điều hướng
        # để khỏi phân tâm người dùng đang trong luồng đăng nhập/đăng ký.
        return f"""<a class="skip-link" href="#main">Bỏ qua điều hướng</a>
<header class="site-navbar navbar-public">
  <nav class="navbar navbar-expand-lg" aria-label="Điều hướng chính">
    <div class="container">
      <a class="navbar-brand brand" href="index.html" aria-label="Hôm Nay Ăn Gì? - Trang giới thiệu">
        {brand_mark()}
        <span class="brand-text">
          <span class="brand-name">Hôm Nay Ăn Gì?</span>
          <span class="brand-tag">Giải cứu cơn đói chỉ trong vài giây</span>
        </span>
      </a>
      <div class="nav-actions d-flex align-items-center gap-2">
        <a href="dang-nhap.html" class="btn btn-outline-brand btn-nav">Đăng nhập</a>
        <a href="dang-ky.html" class="btn btn-brand btn-nav">Đăng ký</a>
      </div>
    </div>
  </nav>
</header>"""
    if mode == "site":
        # Trang giới thiệu (index.html): chỉ logo + hai nút đăng nhập/đăng ký. Liên hệ & góp ý đã chuyển thành hộp thoại (js/widgets/feedback.js). Không có menu công cụ
        # trong app (vòng quay, khám phá...) vì những trang đó cần đăng nhập mới dùng được.
        return f"""<a class="skip-link" href="#main">Bỏ qua điều hướng</a>
<header class="site-navbar">
  <nav class="navbar navbar-expand-lg" aria-label="Điều hướng chính">
    <div class="container">
      <a class="navbar-brand brand" href="index.html" aria-label="Hôm Nay Ăn Gì? - Trang chủ">
        {brand_mark()}
        <span class="brand-text">
          <span class="brand-name">Hôm Nay Ăn Gì?</span>
          <span class="brand-tag">Giải cứu cơn đói chỉ trong vài giây</span>
        </span>
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu" aria-controls="navMenu" aria-expanded="false" aria-label="Mở menu">
        <i class="bi bi-list fs-2"></i>
      </button>
      <div class="collapse navbar-collapse" id="navMenu">
        <div class="mx-lg-auto"></div>
        <div class="nav-actions d-flex align-items-center gap-2 mt-3 mt-lg-0">
          <a href="dang-nhap.html" class="btn btn-outline-brand btn-nav">Đăng nhập</a>
          <a href="dang-ky.html" class="btn btn-brand btn-nav">Đăng ký</a>
        </div>
      </div>
    </div>
  </nav>
</header>"""
    return f"""<a class="skip-link" href="#main">Bỏ qua điều hướng</a>
<header class="site-navbar">
  <nav class="navbar navbar-expand-lg" aria-label="Điều hướng chính">
    <div class="container">
      <a class="navbar-brand brand" href="trang-chu.html" aria-label="Hôm Nay Ăn Gì? - Trang chủ">
        {brand_mark()}
        <span class="brand-text">
          <span class="brand-name">Hôm Nay Ăn Gì?</span>
          <span class="brand-tag">Giải cứu cơn đói chỉ trong vài giây</span>
        </span>
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu" aria-controls="navMenu" aria-expanded="false" aria-label="Mở menu">
        <i class="bi bi-list fs-2"></i>
      </button>
      <div class="collapse navbar-collapse" id="navMenu">
        <ul class="navbar-nav mx-lg-auto align-items-lg-center gap-lg-1">
          <li class="nav-item"><a class="nav-link" data-page="trang-chu.html" href="trang-chu.html"><img class="nav-page-icon" src="../image/icon-page/trang-chu-icon-72.png" alt="" width="22" height="22"> Trang Chủ</a></li>
          <li class="nav-item"><a class="nav-link" data-page="goi-y.html" href="goi-y.html"><img class="nav-page-icon" src="../image/icon-page/goi-y-icon-72.png" alt="" width="22" height="22"> Gợi Ý Ngay <span class="hot-badge">HOT</span></a></li>
          <li class="nav-item"><a class="nav-link" data-page="kham-pha.html" href="kham-pha.html"><img class="nav-page-icon" src="../image/icon-page/kham-pha-icon-72.png" alt="" width="22" height="22"> Khám Phá</a></li>
          <li class="nav-item"><a class="nav-link" data-page="thuc-don-suc-khoe.html" href="thuc-don-suc-khoe.html"><img class="nav-page-icon" src="../image/icon-page/thuc-don-icon-72.png" alt="" width="22" height="22"> Thực Đơn Sức Khỏe</a></li>
          <li class="nav-item"><a class="nav-link" data-page="nhat-ky-suc-khoe.html" href="nhat-ky-suc-khoe.html"><img class="nav-page-icon" src="../image/icon-page/nhat-ky-icon-72.png" alt="" width="22" height="22"> Nhật Ký Sức Khỏe</a></li>
        </ul>
        <div class="nav-actions d-flex align-items-center gap-2 mt-3 mt-lg-0">
          <a href="kham-pha.html?tab=favorites" class="nav-fav" aria-label="Yêu thích">
            <img class="nav-fav-icon" src="../image/Muc-Yeu-Thich/tim-banh-mi-96.png" alt="" width="26" height="26"> <span class="fav-text">Yêu thích</span>
            <span class="favorite-count-badge" style="display:none;">0</span>
          </a>
          <div id="navUserSlot"></div>
        </div>
      </div>
    </div>
  </nav>
</header>"""

def footer():
    return f"""<footer class="site-footer mt-auto" id="gioi-thieu">
  <div class="container" style="--bs-gutter-x: 3rem;">
    <div class="row g-5 mb-5">
      <div class="col-md-6 col-lg-4">
        <a href="index.html" class="brand brand-on-dark mb-3">
          {brand_mark()}
          <span class="brand-text"><span class="brand-name">Hôm Nay Ăn Gì?</span></span>
        </a>
        <p class="footer-lede">Ra đời từ chính nỗi phân vân "ăn gì bây giờ" mỗi ngày, Hôm Nay Ăn Gì? giúp bạn chốt một bữa ăn ngon chỉ trong vài giây — quay một vòng hoặc mở một hộp quà là xong. Miễn phí trọn đời, không quảng cáo làm phiền, và luôn lắng nghe góp ý từ bạn.</p>
        <p class="small mb-0 footer-muted">Được làm bởi một nhóm nhỏ mê ăn ngon. 🧡</p>
      </div>
      <div class="col-6 col-lg-2">
        <h4>Khám phá</h4>
        <ul class="list-unstyled small d-flex flex-column gap-2">
          <li><a href="trang-chu.html">Trang chủ</a></li>
          <li><a href="goi-y.html">Vòng quay món ăn</a></li>
          <li><a href="kham-pha.html">Thực đơn món ăn</a></li>
          <li><a href="kham-pha.html?tab=favorites">Món đã lưu</a></li>
          <li><a href="thuc-don-suc-khoe.html">Thực đơn sức khỏe</a></li>
          <li><a href="nhat-ky-suc-khoe.html">Nhật ký sức khỏe</a></li>
          <li><a href="index.html#gioi-thieu">Về chúng tôi</a></li>
          <li><a href="#" role="button" data-open-feedback>Góp ý &amp; liên hệ</a></li>
        </ul>
      </div>
      <div class="col-6 col-lg-3">
        <h4>Đội ngũ trong bếp</h4>
        <ul class="list-unstyled small d-flex flex-column gap-3">
          <li><strong class="text-white d-block">Phong <span class="footer-kitchen-role">· Bếp trưởng hậu trường</span></strong><span class="footer-muted">Backend &amp; cơ sở dữ liệu</span></li>
          <li><strong class="text-white d-block">An <span class="footer-kitchen-role">· Người nếm thử</span></strong><span class="footer-muted">FoodBot &amp; kiểm thử</span></li>
          <li><strong class="text-white d-block">Đạt <span class="footer-kitchen-role">· Người bày món</span></strong><span class="footer-muted">Giao diện &amp; trải nghiệm người dùng</span></li>
        </ul>
      </div>
      <div class="col-lg-3">
        <h4>Trong mỗi món ăn</h4>
        <ul class="list-unstyled small d-flex flex-column gap-2">
          <li><i class="bi bi-check2"></i> Nguyên liệu và các bước nấu</li>
          <li><i class="bi bi-check2"></i> Dinh dưỡng và lượng calo</li>
          <li><i class="bi bi-check2"></i> Quán ăn gợi ý để đến thử</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom d-flex flex-column flex-sm-row justify-content-between gap-2 small">
      <span>© 2026 Hôm Nay Ăn Gì? Giữ mọi quyền.</span>
      <span>Được làm với 🧡 tại Việt Nam</span>
    </div>
  </div>
</footer>"""

def toast_block():
    return """<div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index:1080;">
  <div id="appToast" class="toast align-items-center border-0 shadow" role="alert">
    <div class="d-flex">
      <div class="toast-body" id="appToastBody">Thông báo</div>
      <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  </div>
</div>"""

def result_modal_block():
    return """<div class="modal fade result-modal" id="resultModal" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="result-banner">
        <img id="resultImage" src="" alt="">
        <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-3" data-bs-dismiss="modal" aria-label="Đóng"></button>
        <span class="position-absolute top-0 start-0 m-3 badge result-badge" style="z-index:5;">Món của bạn hôm nay</span>
        <div class="position-absolute bottom-0 start-0 end-0 p-3 text-white">
          <div class="small fw-semibold result-kicker" id="resultRegionCat"></div>
          <h3 class="fw-bold mb-0" id="resultName"></h3>
          <p class="small fst-italic mb-0" id="resultEnglishName"></p>
          <p class="small fw-semibold mb-0 mt-1 result-nominator d-none" id="resultNominator"></p>
        </div>
      </div>
      <div class="modal-body">
        <div class="row text-center bg-light rounded-3 py-2 mb-3 border">
          <div class="col border-end">
            <div class="small text-muted">Thời gian</div>
            <div class="fw-bold" id="resultTime"></div>
          </div>
          <div class="col">
            <div class="small text-muted">Lượng calo</div>
            <div class="fw-bold text-danger" id="resultCalories"></div>
          </div>
        </div>
        <p class="small text-muted" id="resultDescription"></p>
        <div class="d-flex flex-wrap gap-2 mb-3" id="resultTags"></div>
        <a href="#" id="resultDetailLink" class="btn btn-brand w-100 mb-2">Chốt món này và xem quán bán</a>
        <a href="#" id="resultMapsLink" class="btn btn-outline-brand w-100" target="_blank" rel="noopener noreferrer"><i class="bi bi-geo-alt-fill"></i> Tìm quán trên Google Maps</a>
        <button type="button" class="btn btn-link btn-sm w-100 mb-2 text-muted result-maps-near" id="resultMapsNear"><i class="bi bi-crosshair"></i> Ưu tiên quán gần vị trí của tôi</button>
        <div class="row g-2">
          <div class="col-6"><button class="btn btn-outline-brand w-100" id="resultFavoriteBtn"><i class="bi bi-heart"></i> Lưu món</button></div>
          <div class="col-6"><button class="btn btn-outline-brand w-100" id="resultSpinAgainBtn"><i class="bi bi-arrow-counterclockwise"></i> Quay lại</button></div>
        </div>
        <button type="button" class="btn btn-link w-100 mt-2 result-share" id="resultShareBtn"><i class="bi bi-clipboard"></i> Sao chép để gửi nhóm</button>
      </div>
    </div>
  </div>
</div>"""

def auth_side_bg():
    """Nền cho phần bên màu của trang đăng nhập/đăng ký: 3 cột ảnh món ăn cuộn dọc
    liên tục, làm mờ và phủ gradient cam của web lên trên (xem frontend/user/js/pages/auth-bg.js để
    biết cách 3 cột này được lấp ảnh, và css/pages/auth.css để biết cách vẽ)."""
    return """<div class="auth-side-bg" aria-hidden="true">
          <div class="auth-col"><div class="auth-col-track" id="authCol1"></div></div>
          <div class="auth-col"><div class="auth-col-track auth-col-track-rev" id="authCol2"></div></div>
          <div class="auth-col"><div class="auth-col-track" id="authCol3"></div></div>
        </div>"""

def auth_hook(title_lines, subtitle):
    """Dòng chữ 'hook' nổi trên nền ảnh cam của trang đăng nhập/đăng ký: từng
    chữ trong tiêu đề hiện ra lần lượt khi tải trang (xem .auth-hook trong
    css/pages/auth.css). title_lines: danh sách các dòng (nối lại bằng <br>), mỗi dòng
    một câu ngắn; subtitle: câu phụ nhỏ hơn, hiện ra sau cùng."""
    i = 0
    rendered_lines = []
    for line in title_lines:
        spans = []
        for word in line.split(" "):
            spans.append(f'<span class="w" style="--i:{i}">{word}</span>')
            i += 1
        rendered_lines.append(" ".join(spans))
    title_html = "<br>".join(rendered_lines)
    sub_delay = i * 80 + 150
    return f"""<div class="auth-hook">
          <p class="auth-hook-title">{title_html}</p>
          <p class="auth-hook-sub" style="animation-delay:{sub_delay}ms">{subtitle}</p>
        </div>"""

# Nút "Tiếp tục với Google" + dòng phân cách, đặt dưới form ở trang đăng nhập/đăng ký. Bấm → backend/api/auth/google.php
# (js/pages/auth-google.js gắn thêm ?next= và hiện thông báo lỗi khi Google trả về ?google=<mã>).
GOOGLE_AUTH_BLOCK = """<div class="auth-divider"><span>hoặc</span></div>
        <a class="btn-google" id="googleAuthBtn" href="../../backend/api/auth/google.php">
          <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
          </svg>
          <span>Tiếp tục với Google</span>
        </a>"""
GOOGLE_AUTH_SCRIPT = '<script src="js/pages/auth-google.js"></script>'

AUTH_BG_SCRIPT = '<script src="js/pages/auth-bg.js"></script>'  # logic nằm ở frontend/user/js/pages/auth-bg.js

# Món ăn do BACKEND cấp (backend/api/public/foods.php phát ra `const allFoods = [...]`). Nếu không có PHP thì báo lỗi rõ ràng.
FOODS_SCRIPT = """<script src="../../backend/api/public/foods.php"></script>
<script>if (typeof allFoods === "undefined") { window.allFoods = []; document.body.insertAdjacentHTML("afterbegin", '<div role="alert" style="background:#b91c1c;color:#fff;padding:10px 16px;font:600 14px/1.4 sans-serif;text-align:center">Không tải được dữ liệu món ăn từ máy chủ. Hãy mở trang qua XAMPP (Apache + PHP) hoặc chạy php -S — xem README.</div>'); }</script>"""

# music=False: không nạp nhạc nền (3 trang cho khách chưa đăng nhập: giới thiệu, đăng nhập, đăng ký — xem page())
def scripts_block(extra="", music=True):
    return f"""<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js"></script>
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
{FOODS_SCRIPT}
<script src="js/core/backend.js"></script>
<script src="js/core/sync.js"></script>
<script src="js/core/data-utils.js"></script>
<script src="js/core/categories.js"></script>
<script src="js/core/health.js"></script>
<script src="js/core/main.js"></script>
<script src="js/core/auth.js"></script>
{'<script src="js/widgets/bg-music.js"></script>' + chr(10) if music else ""}<script src="js/widgets/feedback.js"></script>
{extra}
</body>
</html>"""

# FoodBot (nút tròn góc dưới phải + khung chat). Logic ở frontend/user/js/widgets/chatbot.js, giao diện ở
# css/components/chatbot.css, API ở backend/api/chat. Bật cho trang nào thì gọi page(..., chatbot=True).
# Hình FoodBot: bản thu nhỏ 192px của frontend/image/chat-bot.png (ảnh gốc ~4,9 MB).
CHATBOT_CSS = '<link href="css/components/chatbot.css" rel="stylesheet">'
CHATBOT_BLOCK = """
<button class="chatbot-launcher" id="chatbot-launcher" type="button"
        aria-label="Trò chuyện với FoodBot" aria-controls="chatbot-panel" aria-expanded="false">
  <img src="../image/chat-bot-192.png" alt="" width="60" height="60">
</button>
<section class="chatbot-panel" id="chatbot-panel" role="dialog" aria-labelledby="chatbot-title" hidden>
  <header class="chatbot-header">
    <h2 class="chatbot-title" id="chatbot-title"><img class="chatbot-title-icon" src="../image/chat-bot-192.png" alt="" width="34" height="34"> FoodBot</h2>
    <button class="chatbot-close" id="chatbot-close" type="button" aria-label="Đóng trò chuyện">×</button>
  </header>
  <div class="chatbot-messages" id="chatbot-messages" role="log" aria-label="Tin nhắn với FoodBot"
       aria-live="polite" aria-relevant="additions" aria-busy="false" tabindex="0"></div>
  <form class="chatbot-form" id="chatbot-form">
    <label class="chatbot-sr-only" for="chatbot-input">Tin nhắn cho FoodBot</label>
    <input class="chatbot-input" id="chatbot-input" type="text" name="message"
           placeholder="Bạn muốn ăn gì…" maxlength="2000" autocomplete="off" enterkeyhint="send">
    <button class="chatbot-send" id="chatbot-send" type="submit">Gửi</button>
  </form>
  <span class="chatbot-sr-only" id="chatbot-status" role="status"></span>
</section>
<script src="js/widgets/chatbot.js"></script>"""

# Banner ảnh lớn ở đầu trang (ảnh trong frontend/image/icon-page/<tên>-banner.jpg).
# banner=("trang-chu", "22%"): tên ảnh + vị trí dọc của khung cắt (object-position) để chữ tiêu đề trong ảnh luôn lọt khung.
def page_banner(banner):
    if not banner:
        return ""
    name, pos = banner
    return f"""<div class="container pt-4">
  <div class="page-banner"><img src="../image/icon-page/{name}-banner.jpg" alt="" style="object-position: center {pos};"></div>
</div>
"""

def page(title, desc, body_content, extra_scripts="", page_css="", navbar_mode="app", gated=False, chatbot=False, banner=None):
    """navbar_mode: "app" (menu đầy đủ, dùng cho các trang sau khi đăng nhập) hoặc
    "public" (chỉ logo + nút đăng nhập/đăng ký, dùng cho trang ngoài và trang đăng nhập/đăng ký).
    gated: True để chặn trang này lại cho tới khi đăng nhập (xem build_head).
    chatbot: True để gắn FoodBot (khách chưa đăng nhập chỉ được hỏi 2 lượt — xem backend/api/chat)."""
    if chatbot:
        page_css = (page_css + "\n" if page_css else "") + CHATBOT_CSS
        extra_scripts += "\n" + CHATBOT_BLOCK
    return f"""<!DOCTYPE html>
<html lang="vi">
{build_head(title, desc, page_css, gated)}
<body class="d-flex flex-column min-vh-100">
{navbar(navbar_mode)}
<main id="main" class="flex-grow-1">
{page_banner(banner)}{body_content}
</main>
{footer()}
{toast_block()}
{scripts_block(extra_scripts, music=(navbar_mode == "app"))}"""

if __name__ == "__main__":
    print("Module sẵn sàng — import từ các script sinh trang khác.")
