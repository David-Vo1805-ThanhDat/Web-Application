# -*- coding: utf-8 -*-
"""Trang Chất lượng công thức (frontend/admin/cong-thuc.html): tổng hợp phản hồi của người dùng sau khi NẤU THỬ
(từng nguyên liệu vừa đủ / nên giảm / nên tăng, vị, độ khó, hợp khẩu vị) để biết công thức nào cần chỉnh.
Hợp đồng API (recipe.quality.list / recipe.quality.get) ở backend/HANDOFF.md, mục P0. Đổ dữ liệu bởi js/pages/cong-thuc.js."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from layout import admin_page, icon, page_header, skel_rows

STATS = [("cooks", "green", "pulse", "Lượt nấu thử"), ("fit", "rose", "heart", "Hợp khẩu vị trung bình"), ("review", "amber", "warn", "Công thức cần xem lại")]
cards = "".join(f"""<div class="card stat-card"><span class="tint tint-{t}">{icon(ic)}</span><span class="stat-label">{lb}</span><span class="stat-value" data-stat="{k}">—</span><span class="stat-note" data-note="{k}">&nbsp;</span></div>""" for k, t, ic, lb in STATS)

BODY = f"""
      {page_header("Nội dung / Chất lượng công thức", "Chất lượng công thức", "Người dùng nấu thử rồi phản hồi từng nguyên liệu — xem công thức nào cần chỉnh lại", "")}

      <div class="card card-notice" id="notReady" hidden>
        <b>Backend chưa hỗ trợ tính năng này.</b> Trang sẽ tự hoạt động khi backend có các hành động <code>recipe.quality.list</code> và <code>recipe.quality.get</code> (xem <code>backend/HANDOFF.md</code>, mục P0).
      </div>

      <div id="recipesMain">
        <div class="stat-row cols-3">{cards}</div>

        <section class="card filter-card">
          <div class="filter-row">
            <label class="input-icon grow">{icon("search")}<input type="search" id="fQ" placeholder="Tìm theo tên món…" aria-label="Tìm món"></label>
            <div class="select fixed-200"><select id="fStatus" aria-label="Trạng thái">
              <option value="all">Trạng thái: Tất cả</option><option value="review">Cần xem lại</option><option value="ok">Ổn</option><option value="low-data">Chưa đủ dữ liệu</option></select>{icon("chev")}</div>
            <button class="filter-btn" type="button" id="clearFilters" aria-label="Xoá bộ lọc">{icon("filter")}</button>
          </div>
        </section>

        <section class="table-card" id="tableCard">
          <div class="table-scroll" id="tableScroll">
            <table class="data-table" id="recipeTable">
              <thead><tr><th>Món ăn</th><th class="num">Lượt nấu</th><th>Hợp khẩu vị</th><th>Nguyên liệu lệch nhiều nhất</th><th>Trạng thái</th><th class="col-actions">Thao tác</th></tr></thead>
              <tbody id="recipeBody">{skel_rows(6, 6)}</tbody>
            </table>
          </div>
          <div class="empty" id="recipeEmpty" hidden>
            <span class="empty-icon">{icon("pulse")}</span>
            <h2 class="empty-title">Chưa có món nào phù hợp</h2>
            <p class="empty-desc">Không có công thức nào khớp với bộ lọc hiện tại.</p>
            <button class="btn btn-primary" type="button" id="emptyClear">{icon("x")}Xoá bộ lọc</button>
          </div>
        </section>

        <div class="table-foot"><span class="foot-info" id="footInfo"></span><div id="pager"></div></div>
      </div>
"""

if __name__ == "__main__":
    admin_page("cong-thuc.html", "Chất lượng công thức", "cong-thuc.html", BODY, page_css="recipes.css", page_js="cong-thuc.js")
