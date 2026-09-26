# -*- coding: utf-8 -*-
"""Trang Nhật ký hoạt động (frontend/admin/nhat-ky.html) — Figma "Nhật ký hoạt động". Đổ dữ liệu bởi js/pages/nhat-ky.js."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from layout import admin_page, icon, page_header, skel_cards

actions = f"""<button class="btn btn-ghost" type="button" id="exportBtn">{icon("download")}Xuất nhật ký</button>"""

BODY = f"""
      {page_header("Hệ thống / Nhật ký hoạt động", "Nhật ký hoạt động", "Toàn bộ thao tác của quản trị viên và sự kiện hệ thống", actions)}

      <section class="card filter-card">
        <div class="filter-row">
          <label class="input-icon grow">{icon("search")}<input type="search" id="fQ" placeholder="Tìm theo hành động, người thực hiện…" aria-label="Tìm nhật ký"></label>
          <div class="select fixed-170"><select id="fType" aria-label="Loại"></select>{icon("chev")}</div>
          <div class="select fixed-200"><select id="fActor" aria-label="Người thực hiện"></select>{icon("chev")}</div>
          <div class="select fixed-150"><select id="fDays" aria-label="Khoảng thời gian">
            <option value="1">Hôm nay</option><option value="7" selected>7 ngày qua</option><option value="30">30 ngày qua</option><option value="0">Tất cả</option></select>{icon("chev")}</div>
          <button class="filter-btn" type="button" id="clearFilters" aria-label="Xoá bộ lọc">{icon("filter")}</button>
        </div>
      </section>

      <div id="logList">{skel_cards(4)}</div>
      <div class="empty" id="logEmpty" hidden>
        <span class="empty-icon">{icon("clock")}</span>
        <h2 class="empty-title">Không có sự kiện nào</h2>
        <p class="empty-desc">Không tìm thấy hoạt động khớp với bộ lọc hiện tại.</p>
      </div>
      <div class="table-foot"><span class="foot-info" id="footInfo"></span><div id="pager"></div></div>
"""

if __name__ == "__main__":
    admin_page("nhat-ky.html", "Nhật ký hoạt động", "nhat-ky.html", BODY, page_css="audit.css", page_js="nhat-ky.js")
