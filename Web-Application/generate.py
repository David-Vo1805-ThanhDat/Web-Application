# -*- coding: utf-8 -*-
"""Sinh 6 file HTML tĩnh cho website, dùng chung Navbar/Footer/Head/Scripts."""

def build_head(title, desc, page_css=""):
    return f"""<head>
<meta charset="UTF-8">
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
<link href="css/style.css" rel="stylesheet">
{page_css}
</head>"""

def navbar():
    return """<a class="skip-link" href="#main">Bỏ qua điều hướng</a>
<header class="site-navbar">
  <nav class="navbar navbar-expand-lg" aria-label="Điều hướng chính">
    <div class="container">
      <a class="navbar-brand brand" href="index.html" aria-label="Hôm Nay Ăn Gì? - Trang chủ">
        <span class="brand-mark">
          <svg viewBox="0 0 32 32" aria-hidden="true" fill="none">
            <path d="M5 15h22c0 6.6-4.9 11-11 11S5 21.6 5 15z" fill="#fff"/>
            <path d="M12 12c.6-1.3.6-2.3 0-3.6M16 12c.6-1.3.6-2.3 0-3.6M20 12c.6-1.3.6-2.3 0-3.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>
            <path d="M22 4.5 27 12M25.5 3.5 30 10.5" stroke="#FFE7C2" stroke-width="1.7" stroke-linecap="round"/>
          </svg>
        </span>
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
          <li class="nav-item"><a class="nav-link" data-page="index.html" href="index.html"><i class="bi bi-egg-fried"></i> Trang Chủ</a></li>
          <li class="nav-item"><a class="nav-link" data-page="goi-y.html" href="goi-y.html"><i class="bi bi-stars"></i> Gợi Ý Ngay <span class="hot-badge">HOT</span></a></li>
          <li class="nav-item"><a class="nav-link" data-page="kham-pha.html" href="kham-pha.html"><i class="bi bi-compass"></i> Khám Phá</a></li>
          <li class="nav-item"><a class="nav-link" data-page="gioi-thieu.html" href="gioi-thieu.html"><i class="bi bi-info-circle"></i> Giới Thiệu</a></li>
          <li class="nav-item"><a class="nav-link" data-page="lien-he.html" href="lien-he.html"><i class="bi bi-envelope"></i> Liên Hệ</a></li>
        </ul>
        <div class="nav-actions d-flex align-items-center gap-2 mt-3 mt-lg-0">
          <a href="kham-pha.html?tab=favorites" class="nav-fav">
            <i class="bi bi-heart"></i> <span class="fav-text">Yêu thích</span>
            <span class="favorite-count-badge" style="display:none;">0</span>
          </a>
          <a href="goi-y.html" class="btn btn-brand btn-nav"><i class="bi bi-stars"></i> Gợi Ý Ngay</a>
        </div>
      </div>
    </div>
  </nav>
</header>"""

def footer():
    return """<footer class="site-footer mt-auto">
  <div class="container">
    <div class="row g-5 mb-5">
      <div class="col-md-6 col-lg-4">
        <a href="index.html" class="brand brand-on-dark mb-3">
          <span class="brand-mark">
            <svg viewBox="0 0 32 32" aria-hidden="true" fill="none">
            <path d="M5 15h22c0 6.6-4.9 11-11 11S5 21.6 5 15z" fill="#fff"/>
            <path d="M12 12c.6-1.3.6-2.3 0-3.6M16 12c.6-1.3.6-2.3 0-3.6M20 12c.6-1.3.6-2.3 0-3.6" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>
            <path d="M22 4.5 27 12M25.5 3.5 30 10.5" stroke="#FFE7C2" stroke-width="1.7" stroke-linecap="round"/>
          </svg>
          </span>
          <span class="brand-text"><span class="brand-name">Hôm Nay Ăn Gì?</span></span>
        </a>
        <p class="footer-lede">Gợi ý món ăn ngẫu nhiên theo bữa ăn, ngân sách, khẩu vị và chế độ ăn. Hết cảnh nghĩ mãi không ra "trưa nay ăn gì".</p>
        <p class="small mb-0 footer-muted">Đồ án môn học Web Application, bản demo 2026.</p>
      </div>
      <div class="col-6 col-lg-2">
        <h4>Khám phá</h4>
        <ul class="list-unstyled small d-flex flex-column gap-2">
          <li><a href="index.html">Trang chủ</a></li>
          <li><a href="goi-y.html">Vòng quay món ăn</a></li>
          <li><a href="kham-pha.html">Thực đơn 31 món</a></li>
          <li><a href="kham-pha.html?tab=favorites">Món đã lưu</a></li>
          <li><a href="gioi-thieu.html">Về dự án</a></li>
          <li><a href="lien-he.html">Liên hệ và góp ý</a></li>
        </ul>
      </div>
      <div class="col-6 col-lg-3">
        <h4>Nhóm thực hiện</h4>
        <ul class="list-unstyled small d-flex flex-column gap-3">
          <li><strong class="text-white d-block">Người A</strong><span class="footer-muted">Giao diện: HTML/CSS, Bootstrap, AOS</span></li>
          <li><strong class="text-white d-block">Người B</strong><span class="footer-muted">Dữ liệu: lọc, tìm kiếm, chọn ngẫu nhiên</span></li>
          <li><strong class="text-white d-block">Người C</strong><span class="footer-muted">Nội dung: chi tiết món, giới thiệu, liên hệ</span></li>
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
      <span>© 2026 Hôm nay ăn gì? Nhóm đồ án cuối kỳ.</span>
      <span>HTML5, CSS3, Bootstrap 5, JavaScript</span>
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
        <div class="row g-2">
          <div class="col-6"><button class="btn btn-outline-brand w-100" id="resultFavoriteBtn"><i class="bi bi-heart"></i> Lưu món</button></div>
          <div class="col-6"><button class="btn btn-outline-brand w-100" id="resultSpinAgainBtn"><i class="bi bi-arrow-counterclockwise"></i> Quay lại</button></div>
        </div>
        <button type="button" class="btn btn-link w-100 mt-2 result-share" id="resultShareBtn"><i class="bi bi-clipboard"></i> Sao chép để gửi nhóm</button>
      </div>
    </div>
  </div>
</div>"""

def scripts_block(extra=""):
    return f"""<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js"></script>
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
<script src="data/data.js"></script>
<script src="js/data-utils.js"></script>
<script src="js/main.js"></script>
{extra}
</body>
</html>"""

def page(title, desc, body_content, extra_scripts="", page_css=""):
    return f"""<!DOCTYPE html>
<html lang="vi">
{build_head(title, desc, page_css)}
<body class="d-flex flex-column min-vh-100">
{navbar()}
<main id="main" class="flex-grow-1">
{body_content}
</main>
{footer()}
{toast_block()}
{scripts_block(extra_scripts)}"""

if __name__ == "__main__":
    print("Module sẵn sàng — import từ các script sinh trang khác.")
