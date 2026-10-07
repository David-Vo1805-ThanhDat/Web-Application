# -*- coding: utf-8 -*-
"""Sinh các file HTML tĩnh cho website, dùng chung Navbar/Footer/Head/Scripts."""

import os

# Thư mục frontend/ (nơi ghi các file .html sinh ra) — tools/build/generate.py nằm cách gốc 2 cấp.
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(ROOT, "frontend", "user")


def brand_mark():
    return """<span class="brand-mark">
          <svg viewBox="0 0 32 32" aria-hidden="true" fill="none">
            <path d="M5 15h22c0 6.6-4.9 11-11 11S5 21.6 5 15z" fill="#fff"/>
            <path d="M12 12c.6-1.3.6-2.3 0-3.6M16 12c.6-1.3.6-2.3 0-3.6M20 12c.6-1.3.6-2.3 0-3.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>
            <path d="M22 4.5 27 12M25.5 3.5 30 10.5" stroke="#FFE7C2" stroke-width="1.7" stroke-linecap="round"/>
          </svg>
        </span>"""

# Thứ tự nạp CSS QUAN TRỌNG (luật sau thắng luật trước khi cùng độ ưu tiên):
# token -> nền tảng -> thành phần -> trang -> responsive -> giảm chuyển động (cuối cùng).
CSS_FILES = [
    "base/tokens.css", "base/base.css",
    "components/buttons.css", "components/navbar.css", "components/footer.css",
    "components/sections.css", "components/food-card.css", "components/chips.css",
    "components/wheel.css", "components/modal-result.css", "components/gift-box.css",
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
        <a href="dang-ky.html" class="btn btn-brand btn-nav"><i class="bi bi-stars"></i> Đăng ký</a>
      </div>
    </div>
  </nav>
</header>"""
    if mode == "site":
        # Trang công khai có nội dung thật (trang chủ ngoài, giới thiệu, liên hệ): đầy đủ menu
        # điều hướng giữa các trang công khai + hai nút đăng nhập/đăng ký. Không có menu công cụ
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
        <ul class="navbar-nav mx-lg-auto align-items-lg-center gap-lg-1">
          <li class="nav-item"><a class="nav-link" data-page="index.html" href="index.html"><i class="bi bi-house-heart"></i> Trang Chủ</a></li>
          <li class="nav-item"><a class="nav-link" href="index.html#gioi-thieu"><i class="bi bi-info-circle"></i> Giới Thiệu</a></li>
          <li class="nav-item"><a class="nav-link" href="index.html#lien-he"><i class="bi bi-envelope"></i> Liên Hệ</a></li>
        </ul>
        <div class="nav-actions d-flex align-items-center gap-2 mt-3 mt-lg-0">
          <a href="dang-nhap.html" class="btn btn-outline-brand btn-nav">Đăng nhập</a>
          <a href="dang-ky.html" class="btn btn-brand btn-nav"><i class="bi bi-stars"></i> Đăng ký</a>
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
          <li class="nav-item"><a class="nav-link" data-page="trang-chu.html" href="trang-chu.html"><i class="bi bi-egg-fried"></i> Trang Chủ</a></li>
          <li class="nav-item"><a class="nav-link" data-page="goi-y.html" href="goi-y.html"><i class="bi bi-stars"></i> Gợi Ý Ngay <span class="hot-badge">HOT</span></a></li>
          <li class="nav-item"><a class="nav-link" data-page="kham-pha.html" href="kham-pha.html"><i class="bi bi-compass"></i> Khám Phá</a></li>
          <li class="nav-item"><a class="nav-link" data-page="thuc-don-suc-khoe.html" href="thuc-don-suc-khoe.html"><i class="bi bi-calendar-week"></i> Thực Đơn Sức Khỏe</a></li>
          <li class="nav-item"><a class="nav-link" data-page="nhat-ky-suc-khoe.html" href="nhat-ky-suc-khoe.html"><i class="bi bi-heart-pulse"></i> Nhật Ký Sức Khỏe</a></li>
        </ul>
        <div class="nav-actions d-flex align-items-center gap-2 mt-3 mt-lg-0">
          <a href="kham-pha.html?tab=favorites" class="nav-fav" aria-label="Yêu thích">
            <i class="bi bi-heart"></i> <span class="fav-text">Yêu thích</span>
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
          <li><a href="kham-pha.html">Thực đơn 31 món</a></li>
          <li><a href="kham-pha.html?tab=favorites">Món đã lưu</a></li>
          <li><a href="thuc-don-suc-khoe.html">Thực đơn sức khỏe</a></li>
          <li><a href="nhat-ky-suc-khoe.html">Nhật ký sức khỏe</a></li>
          <li><a href="index.html#gioi-thieu">Về chúng tôi</a></li>
          <li><a href="index.html#lien-he">Liên hệ và góp ý</a></li>
        </ul>
      </div>
      <div class="col-6 col-lg-3">
        <h4>Đội ngũ</h4>
        <ul class="list-unstyled small d-flex flex-column gap-3">
          <li><strong class="text-white d-block">Người A</strong><span class="footer-muted">Thiết kế sản phẩm</span></li>
          <li><strong class="text-white d-block">Người B</strong><span class="footer-muted">Dữ liệu ẩm thực</span></li>
          <li><strong class="text-white d-block">Người C</strong><span class="footer-muted">Nội dung &amp; đối tác quán ăn</span></li>
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
        <span class="position-absolute top-0 start-0 m-3 badge result-badge" style="z-index:5;"><i class="bi bi-stars"></i> Món của bạn hôm nay</span>
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

AUTH_BG_SCRIPT = '<script src="js/pages/auth-bg.js"></script>'  # logic nằm ở frontend/user/js/pages/auth-bg.js

# Món ăn do BACKEND cấp (backend/api/public/foods.php phát ra `const allFoods = [...]`). Nếu không có PHP thì báo lỗi rõ ràng.
FOODS_SCRIPT = """<script src="../../backend/api/public/foods.php"></script>
<script>if (typeof allFoods === "undefined") { window.allFoods = []; document.body.insertAdjacentHTML("afterbegin", '<div role="alert" style="background:#b91c1c;color:#fff;padding:10px 16px;font:600 14px/1.4 sans-serif;text-align:center">Không tải được dữ liệu món ăn từ máy chủ. Hãy mở trang qua XAMPP (Apache + PHP) hoặc chạy php -S — xem README.</div>'); }</script>"""

def scripts_block(extra=""):
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
{extra}
</body>
</html>"""

def page(title, desc, body_content, extra_scripts="", page_css="", navbar_mode="app", gated=False):
    """navbar_mode: "app" (menu đầy đủ, dùng cho các trang sau khi đăng nhập) hoặc
    "public" (chỉ logo + nút đăng nhập/đăng ký, dùng cho trang ngoài và trang đăng nhập/đăng ký).
    gated: True để chặn trang này lại cho tới khi đăng nhập (xem build_head)."""
    return f"""<!DOCTYPE html>
<html lang="vi">
{build_head(title, desc, page_css, gated)}
<body class="d-flex flex-column min-vh-100">
{navbar(navbar_mode)}
<main id="main" class="flex-grow-1">
{body_content}
</main>
{footer()}
{toast_block()}
{scripts_block(extra_scripts)}"""

if __name__ == "__main__":
    print("Module sẵn sàng — import từ các script sinh trang khác.")
