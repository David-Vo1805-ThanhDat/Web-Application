# -*- coding: utf-8 -*-
"""Trang Quản lý món ăn (frontend/admin/mon-an.html) — Figma "03 · Quản lý món ăn" (+ trạng thái trống ở "12 · Trạng thái phụ")."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from layout import admin_page, icon, page_header, skel_rows

actions = f"""<button class="btn btn-ghost" type="button" id="exportBtn">{icon("download")}Xuất CSV</button>
    <a class="btn btn-primary" href="mon-an-sua.html?new=1">{icon("plus")}Thêm món mới</a>"""

BODY = f"""
      {page_header("Nội dung / Món ăn", "Quản lý món ăn", '<span id="foodsSub">…</span>', actions)}

      <section class="card filter-card">
        <div class="filter-row">
          <label class="input-icon grow">{icon("search")}<input type="search" id="fQ" placeholder="Tìm theo tên món, ID…" aria-label="Tìm món ăn"></label>
          <div class="select fixed-180"><select id="fCategory" aria-label="Danh mục"></select>{icon("chev")}</div>
          <div class="select fixed-150"><select id="fMeal" aria-label="Bữa ăn"></select>{icon("chev")}</div>
          <div class="select fixed-170"><select id="fRegion" aria-label="Vùng miền"></select>{icon("chev")}</div>
          <div class="select fixed-170"><select id="fStatus" aria-label="Trạng thái">
            <option value="all">Trạng thái: Tất cả</option><option value="visible">Đang hiển thị</option><option value="hidden">Đang ẩn</option><option value="pending">Chờ duyệt</option></select>{icon("chev")}</div>
          <div class="dropdown"><button class="filter-btn" type="button" id="sortBtn" aria-label="Sắp xếp">{icon("filter")}</button>
            <div class="dropdown-menu dropdown-menu-right" id="sortMenu" hidden>
              <div class="dropdown-head">Sắp xếp theo</div>
              <button class="dropdown-item is-focus" type="button" data-sort="no">Mặc định (số thứ tự)</button>
              <button class="dropdown-item" type="button" data-sort="name">Tên A → Z</button>
              <button class="dropdown-item" type="button" data-sort="price">Giá tăng dần</button>
              <button class="dropdown-item" type="button" data-sort="rating">Đánh giá cao nhất</button>
            </div></div>
        </div>
      </section>

      <div class="bulk-bar" id="bulkBar" hidden>
        <div class="bulk-info"><input class="check" type="checkbox" id="bulkMaster" aria-label="Bỏ chọn tất cả"><span id="bulkText">Đã chọn 0 món</span></div>
        <div class="bulk-actions">
          <button class="btn btn-ghost" type="button" id="bulkHide">{icon("eye")}Ẩn</button>
          <button class="btn btn-danger" type="button" id="bulkDelete">{icon("trash")}Xoá</button>
        </div>
      </div>

      <section class="table-card" id="tableCard">
        <div class="table-scroll" id="tableScroll">
          <table class="data-table" id="foodsTable">
            <thead><tr>
              <th class="col-check"><input class="check" type="checkbox" data-check-all aria-label="Chọn tất cả"></th>
              <th class="col-index">#</th><th>Món ăn</th><th>Danh mục</th><th class="num">Giá</th><th class="num">Calo</th><th>Đánh giá</th><th>Trạng thái</th><th class="col-actions">Thao tác</th>
            </tr></thead>
            <tbody id="foodsBody">{skel_rows(8, 9)}</tbody>
          </table>
        </div>
        <div class="empty" id="foodsEmpty" hidden>
          <span class="empty-icon">{icon("inbox")}</span>
          <h2 class="empty-title">Chưa có món ăn nào phù hợp</h2>
          <p class="empty-desc">Không tìm thấy món ăn khớp với bộ lọc hiện tại. Hãy thử đổi danh mục hoặc xoá bớt điều kiện lọc.</p>
          <button class="btn btn-primary" type="button" id="clearFilters">{icon("x")}Xoá tất cả bộ lọc</button>
        </div>
      </section>

      <div class="table-foot"><span class="foot-info" id="footInfo"></span><div id="pager"></div></div>
"""

if __name__ == "__main__":
    admin_page("mon-an.html", "Quản lý món ăn", "mon-an.html", BODY, page_css="foods.css", page_js="mon-an.js")
