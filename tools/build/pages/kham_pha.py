# -*- coding: utf-8 -*-
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))  # tools/build (nơi có generate.py)
from generate import OUT_DIR, page

BODY = """
<div class="container py-5">
  <!-- Page Header -->
  <div class="mb-4" data-aos="fade-up">
    <span class="badge bg-brand-subtle-custom text-brand-emphasis-custom px-3 py-2 rounded-pill mb-2">
      <i class="bi bi-egg-fried"></i> Thực Đơn Phong Phú
    </span>
    <h1 class="fw-black display-6">Khám Phá Ẩm Thực 🧭</h1>
    <p class="text-muted mb-0">31+ món ăn đặc sắc từ Bắc vào Nam — tìm kiếm, lọc và lưu những món yêu thích của bạn.</p>
  </div>

  <!-- Tabs -->
  <div class="d-flex align-items-center gap-3 border-bottom mb-4" data-aos="fade-up">
    <button class="btn btn-tab active" id="tabAll" data-tab="all">Tất Cả Món Ăn (<span id="totalCount">0</span>)</button>
    <button class="btn btn-tab" id="tabFavorites" data-tab="favorites">
      <i class="bi bi-heart"></i> Đã Lưu Yêu Thích
      <span class="badge bg-danger rounded-pill ms-1" id="favTabCount" style="display:none;">0</span>
    </button>
  </div>

  <!-- Search -->
  <div class="position-relative mb-3" data-aos="fade-up">
    <i class="bi bi-search position-absolute top-50 translate-middle-y text-muted" style="left:1rem;"></i>
    <input type="text" id="searchInput" class="form-control form-control-lg ps-5 rounded-3xl-custom shadow-sm"
           placeholder="Tìm theo tên món, nguyên liệu, khẩu vị... (vd: phở, cay, bún, healthy)">
  </div>

  <!-- Category Pills -->
  <div class="d-flex flex-nowrap gap-2 overflow-auto pb-2 mb-3" id="categoryPills" data-aos="fade-up">
    <button class="chip-filter active" data-value="all">🍽️ Tất Cả</button>
    <!-- các nút danh mục còn lại do js/pages/kham-pha.js vẽ từ backend (js/core/categories.js) -->
  </div>

  <!-- Advanced filters toggle + sort -->
  <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-3" data-aos="fade-up">
    <button class="btn btn-outline-secondary rounded-3 d-inline-flex align-items-center gap-2" type="button"
            data-bs-toggle="collapse" data-bs-target="#filtersPanel">
      <i class="bi bi-sliders"></i> Bộ Lọc Nâng Cao <i class="bi bi-chevron-down"></i>
    </button>
    <div class="d-flex align-items-center gap-2">
      <span class="small text-muted">Sắp xếp:</span>
      <select id="sortSelect" class="form-select form-select-sm rounded-3" style="width:auto;">
        <option value="recommended">Được Đề Xuất</option>
        <option value="price-asc">Giá Thấp → Cao</option>
        <option value="price-desc">Giá Cao → Thấp</option>
        <option value="rating">Đánh Giá Cao Nhất</option>
        <option value="time">Nấu Nhanh Nhất</option>
        <option value="calories">Ít Calo Nhất</option>
      </select>
    </div>
  </div>

  <!-- Advanced Filters Panel -->
  <div class="collapse mb-4" id="filtersPanel">
    <div class="card border-0 shadow-sm rounded-3xl-custom p-4">
      <div class="row g-4">
        <div class="col-sm-6 col-lg-4">
          <label class="form-label small fw-bold text-uppercase text-muted">💰 Mức Giá</label>
          <select id="filterPrice" class="form-select">
            <option value="all">Tất cả mức giá</option>
            <option value="under-30k">Dưới 30.000đ</option>
            <option value="30k-60k">30k - 60k</option>
            <option value="60k-150k">60k - 150k</option>
            <option value="above-150k">Trên 150.000đ</option>
          </select>
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label small fw-bold text-uppercase text-muted">🔥 Khẩu Vị</label>
          <select id="filterTaste" class="form-select">
            <option value="all">Mọi khẩu vị</option>
            <option value="cay">Cay nồng 🌶️</option>
            <option value="thanh-dam">Thanh đạm 🍃</option>
            <option value="dam-da">Đậm đà 🍲</option>
            <option value="chua-cay">Chua cay 🍋</option>
            <option value="beo-ngay">Béo ngậy 🧀</option>
            <option value="ngot">Ngọt bùi 🍯</option>
          </select>
        </div>
        <div class="col-sm-6 col-lg-4">
          <label class="form-label small fw-bold text-uppercase text-muted">🌍 Vùng Miền</label>
          <select id="filterRegion" class="form-select">
            <option value="all">Tất cả vùng miền</option>
            <option value="Bắc">Miền Bắc 🏯</option>
            <option value="Trung">Miền Trung 🌅</option>
            <option value="Nam">Miền Nam 🌴</option>
            <option value="Quốc tế">Quốc Tế 🌐</option>
          </select>
        </div>
      </div>
      <div class="mt-3">
        <label class="form-label small fw-bold text-uppercase text-muted">🥗 Chế Độ Ăn</label>
        <div class="d-flex flex-wrap gap-2" id="dietaryButtons">
          <button class="chip-filter chip-sm active" data-value="all">Tất Cả</button>
          <button class="chip-filter chip-sm" data-value="normal">Bình Thường</button>
          <button class="chip-filter chip-sm" data-value="vegetarian">Ăn Chay 🌱</button>
          <button class="chip-filter chip-sm" data-value="eat-clean">Eat Clean 🥑</button>
          <button class="chip-filter chip-sm" data-value="low-carb">Low-Carb 🥩</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Results count -->
  <div class="d-flex justify-content-between align-items-center small text-muted border-top pt-3 mb-4" data-aos="fade-up">
    <span id="resultsCountText">Hiển thị 0 món ăn</span>
    <button class="btn btn-link btn-sm text-decoration-none fw-semibold" id="clearFiltersBtn" style="display:none;">Xóa tất cả bộ lọc</button>
  </div>

  <!-- Empty state -->
  <div class="text-center py-5 d-none" id="emptyState">
    <div style="font-size:4rem;">🍽️</div>
    <h3 class="fw-bold mt-2" id="emptyTitle">Không tìm thấy món ăn phù hợp!</h3>
    <p class="text-muted small mx-auto" style="max-width:420px;" id="emptyDesc">Thử điều chỉnh từ khóa tìm kiếm hoặc nới lỏng bộ lọc để có thêm lựa chọn.</p>
    <button class="btn btn-brand rounded-3 d-none" id="emptyBackToAllBtn">Xem Toàn Bộ Thực Đơn</button>
  </div>

  <!-- Food Grid -->
  <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4" id="foodGrid" data-aos="fade-up"></div>
</div>
"""

EXTRA_SCRIPT = """<script src="js/pages/kham-pha.js"></script>"""

if __name__ == "__main__":
    html = page(
        "Khám Phá Ẩm Thực | Hôm Nay Bạn Muốn Ăn Gì?",
        "Tìm kiếm, lọc theo bữa ăn, ngân sách, khẩu vị, vùng miền và lưu các món ăn yêu thích của bạn.",
        BODY, EXTRA_SCRIPT, page_css='<link href="css/pages/explore.css" rel="stylesheet">', gated=True
    )
    with open(os.path.join(OUT_DIR, "kham-pha.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("kham-pha.html:", len(html), "ky tu")
