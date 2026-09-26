# -*- coding: utf-8 -*-
"""Trang Góp ý liên hệ (frontend/admin/danh-gia.html). Trước đây là "Đánh giá & góp ý"; phần đánh giá sao đã thay bằng
phản hồi nấu thử công thức (trang cong-thuc.html), nên trang này chỉ còn góp ý gửi từ form Liên hệ. Giữ tên file để đường dẫn cũ vẫn dùng được.
Đổ dữ liệu bởi js/pages/danh-gia.js."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from layout import admin_page, icon, page_header, skel_cards

STATS = [("total", "blue", "mail", "Tổng góp ý"), ("new", "amber", "clock", "Chưa phản hồi"), ("replied", "green", "check", "Đã phản hồi")]
cards = "".join(f"""<div class="card stat-card"><span class="tint tint-{t}">{icon(ic)}</span><span class="stat-label">{lb}</span><span class="stat-value" data-stat="{k}">—</span><span class="stat-note" data-note="{k}">&nbsp;</span></div>""" for k, t, ic, lb in STATS)

actions = f"""<button class="btn btn-ghost" type="button" id="exportBtn">{icon("download")}Xuất dữ liệu</button>"""

BODY = f"""
      {page_header("Cộng đồng / Góp ý liên hệ", "Góp ý liên hệ", '<span id="sub">…</span>', actions)}

      <div class="stat-row cols-3">{cards}</div>

      <div class="review-list" id="list">{skel_cards(3)}</div>
      <div class="empty" id="listEmpty" hidden>
        <span class="empty-icon">{icon("mail")}</span>
        <h2 class="empty-title">Chưa có góp ý nào</h2>
        <p class="empty-desc">Góp ý gửi từ form "Liên hệ &amp; Góp ý" trên web người dùng sẽ hiện ở đây.</p>
      </div>
      <div class="table-foot"><span class="foot-info" id="footInfo"></span><div id="pager"></div></div>
"""

if __name__ == "__main__":
    admin_page("danh-gia.html", "Góp ý liên hệ", "danh-gia.html", BODY, page_css="reviews.css", page_js="danh-gia.js")
