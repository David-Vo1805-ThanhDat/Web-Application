# -*- coding: utf-8 -*-
"""Trang Sửa/Thêm món ăn (frontend/admin/mon-an-sua.html) — Figma "04 · Sửa món ăn".
?id=<id món> để sửa, ?new=1 để thêm món mới. Form dựng động bởi js/pages/mon-an-sua.js."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from layout import admin_page, icon

BODY = f"""
      <div class="page-header">
        <div class="page-header-text">
          <a class="back-link" href="mon-an.html" id="backLink">{icon("arrowl")}Quay lại danh sách món ăn</a>
          <h1 id="pageTitle">Sửa món ăn</h1>
          <p class="subtitle" id="pageSub">…</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost" type="button" id="previewBtn">{icon("eye")}Xem trước</button>
          <button class="btn-link" type="button" id="draftBtn">Lưu nháp</button>
          <button class="btn btn-primary" type="button" id="publishBtn">{icon("check")}Lưu &amp; xuất bản</button>
        </div>
      </div>

      <form class="edit-layout" id="foodForm" novalidate>
        <div class="edit-main">
          <section class="card card-stack">
            <div class="card-titles"><h2 class="card-title">Thông tin cơ bản</h2><p class="card-sub">Tên món, mô tả và phân loại chính</p></div>
            <div class="form-grid cols-2">
              <div class="field"><label for="fName">Tên món (Tiếng Việt) <span class="req">*</span></label><input class="input" id="fName" maxlength="120" required><span class="field-error" data-err="name" hidden></span></div>
              <div class="field"><label for="fEn">Tên tiếng Anh</label><input class="input" id="fEn" maxlength="120"></div>
              <div class="field span-all"><label for="fDesc">Mô tả món ăn <span class="req">*</span></label><textarea class="textarea" id="fDesc" rows="3" required></textarea><span class="field-error" data-err="description" hidden></span></div>
            </div>
            <div class="form-grid">
              <div class="field"><label for="fCategory">Danh mục <span class="req">*</span></label><div class="select"><select id="fCategory"></select>{icon("chev")}</div></div>
              <div class="field"><label for="fRegion">Vùng miền</label><div class="select"><select id="fRegion"></select>{icon("chev")}</div></div>
              <div class="field"><label for="fTime">Thời gian nấu</label><div class="input-unit"><input class="input" type="number" min="0" id="fTime"><span class="unit">phút</span></div></div>
            </div>
          </section>

          <section class="card card-stack">
            <div class="card-titles"><h2 class="card-title">Phân loại &amp; khẩu vị</h2><p class="card-sub">Ảnh hưởng tới bộ lọc và gợi ý ngẫu nhiên</p></div>
            <div class="field"><span class="field-label">Bữa ăn phù hợp</span><div class="chip-set" id="mealChips"></div></div>
            <div class="field"><span class="field-label">Khẩu vị</span><div class="chip-set" id="tasteChips"></div></div>
            <div class="field"><span class="field-label">Chế độ ăn</span><div class="chip-set" id="dietChips"></div></div>
            <div class="field"><span class="field-label">Thẻ hiển thị</span><div class="chip-set" id="tagChips"></div></div>
          </section>

          <section class="card card-stack">
            <div class="card-titles"><h2 class="card-title">Giá &amp; dinh dưỡng</h2></div>
            <div class="form-grid">
              <div class="field"><label for="fPrice">Giá (đ) <span class="req">*</span></label><input class="input" type="number" min="0" step="1000" id="fPrice" required><span class="field-error" data-err="price" hidden></span></div>
              <div class="field"><label for="fPriceRange">Khoảng giá hiển thị</label><input class="input" id="fPriceRange" placeholder="VD: 30k - 60k"></div>
              <div class="field"><label for="fCalories">Calories</label><div class="input-unit"><input class="input" type="number" min="0" id="fCalories"><span class="unit">kcal</span></div></div>
              <div class="field"><label for="fProtein">Đạm (protein)</label><div class="input-unit"><input class="input" type="number" min="0" id="fProtein"><span class="unit">g</span></div></div>
              <div class="field"><label for="fCarbs">Tinh bột (carbs)</label><div class="input-unit"><input class="input" type="number" min="0" id="fCarbs"><span class="unit">g</span></div></div>
              <div class="field"><label for="fFat">Chất béo (fat)</label><div class="input-unit"><input class="input" type="number" min="0" id="fFat"><span class="unit">g</span></div></div>
            </div>
          </section>

          <section class="card card-stack">
            <div class="card-titles"><h2 class="card-title">Nguyên liệu</h2></div>
            <div class="row-list" id="ingredientList"></div>
            <button class="btn-link add-link" type="button" id="addIngredient">{icon("plus")}Thêm nguyên liệu</button>
          </section>

          <section class="card card-stack">
            <div class="card-titles"><h2 class="card-title">Các bước nấu</h2></div>
            <div class="row-list" id="stepList"></div>
            <button class="btn-link add-link" type="button" id="addStep">{icon("plus")}Thêm bước</button>
          </section>

          <section class="card card-stack">
            <div class="card-titles"><h2 class="card-title">Quán ăn gợi ý</h2></div>
            <div class="restaurant-list" id="restaurantList"></div>
            <button class="btn-link add-link" type="button" id="addRestaurant">{icon("plus")}Thêm quán ăn</button>
          </section>
        </div>

        <aside class="edit-side">
          <section class="card card-stack">
            <h2 class="card-title">Ảnh món ăn</h2>
            <div id="imageBox"></div>
            <input type="file" id="fileInput" accept="image/png,image/jpeg,image/webp" hidden>
            <div class="field"><label for="fImage">Hoặc dán liên kết ảnh</label><input class="input" id="fImage" placeholder="https://…"></div>
          </section>

          <section class="card card-stack">
            <h2 class="card-title">Trạng thái xuất bản</h2>
            <div class="toggle-row"><div class="toggle-text"><b>Hiển thị công khai</b><small>Người dùng có thể thấy món này</small></div>
              <label class="toggle"><input type="checkbox" id="tgPublic" aria-label="Hiển thị công khai"><span class="track"></span></label></div>
            <div class="toggle-row"><div class="toggle-text"><b>Đánh dấu “Phổ biến”</b><small>Ưu tiên xuất hiện trong gợi ý</small></div>
              <label class="toggle"><input type="checkbox" id="tgPopular" aria-label="Đánh dấu Phổ biến"><span class="track"></span></label></div>
            <div class="kv-list">
              <div class="kv-row"><span>Trạng thái</span><span class="badge b-green" id="statusBadge">Đang hiển thị</span></div>
              <div class="kv-row"><span>Người tạo</span><b id="createdBy">—</b></div>
              <div class="kv-row"><span>Ngày tạo</span><b id="createdAt">—</b></div>
            </div>
          </section>

          <section class="card card-stack" id="perfCard">
            <div class="card-titles"><h2 class="card-title">Hiệu suất món ăn</h2><p class="card-sub">Chỉ đọc — tổng hợp từ hệ thống</p></div>
            <div class="kv-list">
              <div class="kv-row"><span>Lượt xem chi tiết</span><b id="pViews">—</b></div>
              <div class="kv-row"><span>Lượt quay trúng</span><b id="pSpins">—</b></div>
              <div class="kv-row"><span>Lượt yêu thích</span><b id="pFavs">—</b></div>
              <div class="kv-row"><span>Đánh giá trung bình</span><b id="pRating">—</b></div>
            </div>
          </section>
        </aside>
      </form>
"""

if __name__ == "__main__":
    admin_page("mon-an-sua.html", "Sửa món ăn", "mon-an.html", BODY, page_css="food-edit.css", page_js="mon-an-sua.js")
