# -*- coding: utf-8 -*-
"""Trang Quán ăn gợi ý (frontend/admin/quan-an.html) — Figma "Quán ăn gợi ý". Đổ dữ liệu bởi js/pages/quan-an.js."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from layout import admin_page, icon, page_header, skel_rows

STATS = [("total", "orange", "store", "Tổng số quán"), ("cities", "blue", "pin", "Thành phố phủ sóng"), ("nofood", "rose", "bowl", "Món chưa có quán")]
cards = "".join(f"""<div class="card stat-card"><span class="tint tint-{t}">{icon(ic)}</span><span class="stat-label">{lb}</span><span class="stat-value" data-stat="{k}">—</span><span class="stat-note" data-note="{k}">&nbsp;</span></div>""" for k, t, ic, lb in STATS)

actions = f"""<button class="btn btn-primary" type="button" id="addBtn">{icon("plus")}Thêm quán ăn</button>"""

BODY = f"""
      {page_header("Nội dung / Quán ăn gợi ý", "Quán ăn gợi ý", '<span id="sub">…</span>', actions)}

      <div class="stat-row cols-3">{cards}</div>

      <section class="card filter-card">
        <div class="filter-row">
          <label class="input-icon grow">{icon("search")}<input type="search" id="fQ" placeholder="Tìm theo tên quán, địa chỉ…" aria-label="Tìm quán ăn"></label>
          <div class="select fixed-180"><select id="fFood" aria-label="Món ăn"></select>{icon("chev")}</div>
          <div class="select fixed-170"><select id="fCity" aria-label="Thành phố"></select>{icon("chev")}</div>
          <button class="filter-btn" type="button" id="clearFilters" aria-label="Xoá bộ lọc">{icon("filter")}</button>
        </div>
      </section>

      <section class="table-card" id="tableCard">
        <div class="table-scroll" id="tableScroll">
          <table class="data-table" id="table">
            <thead><tr><th>Quán ăn</th><th>Món liên kết</th><th>Địa chỉ</th><th>Thành phố</th><th>Giá tham khảo</th><th class="col-actions">Thao tác</th></tr></thead>
            <tbody id="body">{skel_rows(6, 6)}</tbody>
          </table>
        </div>
        <div class="empty" id="empty" hidden>
          <span class="empty-icon">{icon("store")}</span>
          <h2 class="empty-title">Không tìm thấy quán ăn</h2>
          <p class="empty-desc">Không có quán nào khớp với bộ lọc hiện tại.</p>
        </div>
      </section>

      <div class="table-foot"><span class="foot-info" id="footInfo"></span><div id="pager"></div></div>
"""

if __name__ == "__main__":
    admin_page("quan-an.html", "Quán ăn gợi ý", "quan-an.html", BODY, page_css="restaurants.css", page_js="quan-an.js")
