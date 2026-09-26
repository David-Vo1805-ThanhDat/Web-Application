# -*- coding: utf-8 -*-
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))  # tools/build (nơi có generate.py)
from generate import OUT_DIR, page

BODY = """
<div id="notFoundBox" class="container py-5 text-center d-none">
  <div style="font-size:4rem;">🔍</div>
  <h1 class="fw-bold">Không Tìm Thấy Món Ăn</h1>
  <p class="text-muted">Món ăn bạn tìm không tồn tại hoặc đã bị xoá khỏi thực đơn.</p>
  <a href="kham-pha.html" class="btn btn-brand rounded-3">Về Trang Khám Phá</a>
</div>

<div id="detailBox" class="d-none pb-5">
  <!-- Hero Banner -->
  <section class="position-relative" style="height:22rem;overflow:hidden;">
    <img id="heroImage" src="" alt="" class="w-100 h-100" style="object-fit:cover;">
    <div class="position-absolute top-0 start-0 end-0 bottom-0" style="background:linear-gradient(to top, rgba(2,6,23,.92), rgba(2,6,23,.35) 55%, transparent);"></div>
    <div class="position-absolute top-0 start-0 m-3 m-sm-4">
      <a href="kham-pha.html" class="btn btn-sm btn-dark bg-opacity-50 rounded-3 d-inline-flex align-items-center gap-2" style="backdrop-filter:blur(6px);">
        <i class="bi bi-chevron-left"></i> Quay Lại
      </a>
    </div>
    <div class="position-absolute bottom-0 start-0 end-0 p-3 p-sm-4 p-lg-5">
      <div style="max-width:56rem;">
        <div class="d-flex flex-wrap align-items-center gap-2 mb-2" id="heroTags"></div>
        <h1 class="fw-black text-white display-6" id="heroName"></h1>
        <p class="small text-white-50 fst-italic mb-0" id="heroEnglishName"></p>
      </div>
    </div>
  </section>

  <!-- Quick stats bar -->
  <div class="bg-white border-bottom shadow-sm sticky-top" style="top:0;z-index:20;">
    <div class="container d-flex align-items-center justify-content-between gap-3 py-2 overflow-auto">
      <div class="d-flex align-items-center gap-4 flex-shrink-0">
        <div class="text-center">
          <div class="fw-bold"><i class="bi bi-clock text-muted"></i> <span id="statTime"></span></div>
          <div class="text-muted" style="font-size:.65rem;">Thời gian</div>
        </div>
        <div class="text-center border-start ps-4">
          <div class="fw-bold text-danger"><i class="bi bi-fire"></i> <span id="statCalories"></span></div>
          <div class="text-muted" style="font-size:.65rem;">Calo</div>
        </div>
        <div class="text-center border-start ps-4">
          <div class="fw-bold text-warning"><i class="bi bi-star-fill"></i> <span id="statRating"></span></div>
          <div class="text-muted" style="font-size:.65rem;" id="statReviewCount"></div>
        </div>
      </div>
      <button class="btn btn-outline-secondary rounded-3 flex-shrink-0" id="detailFavoriteBtn">
        <i class="bi bi-heart"></i>
      </button>
    </div>
  </div>

  <div class="container py-4 py-sm-5" style="max-width:56rem;">
    <!-- Description -->
    <section class="mb-4">
      <p class="text-secondary" id="detailDescription"></p>
      <div class="d-flex flex-wrap gap-2 mt-2" id="detailTags"></div>
    </section>

    <!-- Nutrition -->
    <section class="rounded-3xl-custom p-4 p-sm-4 mb-4" style="background:var(--surface); border:1px solid var(--line);">
      <h2 class="h5 fw-bold mb-3"><i class="bi bi-fire text-danger"></i> Thông Tin Dinh Dưỡng (trên 1 phần ăn)</h2>
      <div class="row row-cols-2 row-cols-sm-4 g-3 text-center" id="nutritionGrid"></div>
    </section>

    <div class="row g-4">
      <!-- Ingredient checklist -->
      <div class="col-lg-6">
        <h2 class="h5 fw-bold mb-1"><i class="bi bi-basket text-brand"></i> Nguyên Liệu Cần Chuẩn Bị
          <span class="small fw-normal text-muted">(<span id="ingredientProgress">0/0</span> đã chuẩn bị)</span>
        </h2>
        <div class="progress rounded-pill mb-3" style="height:8px;">
          <div class="progress-bar bg-gradient-brand" id="ingredientProgressBar" style="width:0%;"></div>
        </div>
        <ul class="list-unstyled d-flex flex-column gap-2" id="ingredientList"></ul>
        <div class="alert alert-success small fw-bold text-center d-none mt-2" id="ingredientDoneMsg">
          🎉 Bạn đã chuẩn bị đủ nguyên liệu! Bắt đầu nào!
        </div>
      </div>

      <!-- Cooking steps -->
      <div class="col-lg-6">
        <h2 class="h5 fw-bold mb-3"><i class="bi bi-egg-fried text-brand"></i> Các Bước Thực Hiện</h2>
        <ol class="list-unstyled d-flex flex-column gap-2" id="stepsList"></ol>
      </div>
    </div>

    <!-- Suggested restaurants -->
    <section class="mt-5">
      <h2 class="h5 fw-bold mb-3"><i class="bi bi-geo-alt text-brand"></i> Quán Ăn Ngon Không Cần Nấu 📍</h2>
      <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3" id="restaurantGrid"></div>
      <div class="d-flex flex-wrap align-items-center gap-2 mt-3">
        <a id="detailMapsLink" class="btn btn-outline-brand" target="_blank" rel="noopener noreferrer" href="#"><i class="bi bi-geo-alt-fill"></i> Tìm thêm quán “<span class="maps-food"></span>” trên Google Maps</a>
        <button type="button" class="btn btn-link btn-sm text-muted" id="detailMapsNear"><i class="bi bi-crosshair"></i> Ưu tiên quán gần vị trí của tôi</button>
      </div>
    </section>

    <!-- Nấu thử món này: phản hồi từng nguyên liệu / vị / khẩu vị sau khi nấu (js/widgets/cook-feedback.js; cần backend) -->
    <section class="mt-5 d-none" id="cookSection" aria-labelledby="cookTitle">
      <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
        <h2 class="h5 fw-bold mb-0" id="cookTitle"><i class="bi bi-egg-fried text-brand"></i> Nấu Thử Món Này</h2>
        <p class="small text-muted mb-0" id="cookSummary" aria-live="polite"></p>
      </div>
      <div id="cookBody"></div>
    </section>

    <!-- Related foods -->
    <section class="mt-5 pt-4 border-top d-none" id="relatedSection">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2 class="h5 fw-bold mb-0">Món Ăn Tương Tự Bạn Có Thể Thích 🍽️</h2>
        <a href="kham-pha.html" class="small fw-semibold text-decoration-none">Xem Tất Cả →</a>
      </div>
      <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4" id="relatedGrid"></div>
    </section>
  </div>
</div>
"""

EXTRA_SCRIPT = """<script src="js/widgets/cook-feedback.js"></script>
<script src="js/pages/chi-tiet-mon-an.js"></script>"""

if __name__ == "__main__":
    html = page(
        "Chi Tiết Món Ăn | Hôm Nay Bạn Muốn Ăn Gì?",
        "Xem chi tiết nguyên liệu, cách chế biến, thông tin dinh dưỡng và quán ăn gợi ý cho món ăn bạn đã chọn.",
        BODY, EXTRA_SCRIPT, page_css='<link href="css/pages/detail.css" rel="stylesheet">', gated=True
    )
    with open(os.path.join(OUT_DIR, "chi-tiet-mon-an.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("chi-tiet-mon-an.html:", len(html), "ky tu")
