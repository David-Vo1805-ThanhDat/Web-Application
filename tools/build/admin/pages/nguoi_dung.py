# -*- coding: utf-8 -*-
"""Trang Quản lý người dùng (frontend/admin/nguoi-dung.html) — Figma "Quản lý người dùng". Dữ liệu đổ bởi js/pages/nguoi-dung.js."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from layout import admin_page, icon, page_header, skel_rows

STATS = [("total", "blue", "users", "Tổng người dùng"), ("active", "green", "pulse", "Hoạt động hôm nay"),
         ("health", "amber", "heart", "Có hồ sơ sức khỏe"), ("locked", "rose", "lock", "Đã khoá")]
cards = "".join(f"""<div class="card stat-card"><span class="tint tint-{t}">{icon(ic)}</span><span class="stat-label">{lb}</span><span class="stat-value" data-stat="{k}">—</span><span class="stat-note" data-note="{k}">&nbsp;</span></div>""" for k, t, ic, lb in STATS)

actions = f"""<button class="btn btn-ghost" type="button" id="exportBtn">{icon("download")}Xuất danh sách</button>"""

BODY = f"""
      {page_header("Cộng đồng / Người dùng", "Quản lý người dùng", '<span id="usersSub">…</span>', actions)}

      <div class="stat-row">{cards}</div>

      <section class="card filter-card">
        <div class="filter-row">
          <label class="input-icon grow">{icon("search")}<input type="search" id="fQ" placeholder="Tìm theo tên hoặc email…" aria-label="Tìm người dùng"></label>
          <div class="select fixed-180"><select id="fStatus" aria-label="Trạng thái">
            <option value="all">Trạng thái: Tất cả</option><option value="active">Đang hoạt động</option><option value="unverified">Chưa xác thực</option><option value="locked">Tạm khoá</option></select>{icon("chev")}</div>
          <div class="select fixed-170"><select id="fRole" aria-label="Vai trò">
            <option value="all">Vai trò: Tất cả</option><option value="member">Thành viên</option><option value="moderator">Điều hành viên</option></select>{icon("chev")}</div>
          <div class="select fixed-180"><select id="fSort" aria-label="Sắp xếp">
            <option value="new">Sắp xếp: Mới nhất</option><option value="name">Tên A → Z</option><option value="favorites">Yêu thích nhiều nhất</option></select>{icon("chev")}</div>
          <button class="filter-btn" type="button" id="clearFilters" aria-label="Xoá bộ lọc">{icon("filter")}</button>
        </div>
      </section>

      <section class="table-card" id="tableCard">
        <div class="table-scroll" id="tableScroll">
          <table class="data-table" id="usersTable">
            <thead><tr>
              <th class="col-check"><input class="check" type="checkbox" data-check-all aria-label="Chọn tất cả"></th>
              <th>Người dùng</th><th>Ngày tham gia</th><th>Yêu thích</th><th>Hồ sơ SK</th><th>Vai trò</th><th>Trạng thái</th><th class="col-actions">Thao tác</th>
            </tr></thead>
            <tbody id="usersBody">{skel_rows(7, 8)}</tbody>
          </table>
        </div>
        <div class="empty" id="usersEmpty" hidden>
          <span class="empty-icon">{icon("users")}</span>
          <h2 class="empty-title">Không tìm thấy người dùng</h2>
          <p class="empty-desc">Không có người dùng nào khớp với bộ lọc hiện tại.</p>
        </div>
      </section>

      <div class="table-foot"><span class="foot-info" id="footInfo"></span><div id="pager"></div></div>
"""

if __name__ == "__main__":
    admin_page("nguoi-dung.html", "Quản lý người dùng", "nguoi-dung.html", BODY, page_css="users.css", page_js="nguoi-dung.js")
