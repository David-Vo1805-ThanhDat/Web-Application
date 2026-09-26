# -*- coding: utf-8 -*-
"""Trang Cài đặt hệ thống (frontend/admin/cai-dat.html) — Figma "Cài đặt hệ thống". Đổ dữ liệu bởi js/pages/cai-dat.js."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from layout import admin_page, icon, page_header, skel_list

actions = f"""<button class="btn btn-primary" type="button" id="saveBtn">{icon("save")}Lưu thay đổi</button>"""


def head(ic, title, sub, sub_id=None):
    s = f' id="{sub_id}"' if sub_id else ""
    return f"""<div class="card-head"><span class="card-head-icon">{icon(ic)}</span><div class="card-titles"><h2 class="card-title">{title}</h2><p class="card-sub"{s}>{sub}</p></div></div>"""


def toggle(key, title, sub=""):
    small = f"<small>{sub}</small>" if sub else ""
    return f"""<div class="toggle-row"><div class="toggle-text"><b>{title}</b>{small}</div><label class="toggle"><input type="checkbox" data-set="{key}" aria-label="{title}"><span class="track"></span></label></div>"""


BODY = f"""
      {page_header("Hệ thống / Cài đặt", "Cài đặt hệ thống", "Cấu hình chung, tài khoản quản trị và thông báo", actions)}

      <div class="settings-layout">
        <div class="settings-main">
          <section class="card card-stack">
            {head("globe", "Thông tin chung", "Tên nền tảng và liên hệ hiển thị công khai")}
            <div class="form-grid cols-2">
              <div class="field"><label for="sName">Tên nền tảng</label><input class="input" id="sName" data-set="general.platformName"></div>
              <div class="field"><label for="sTag">Khẩu hiệu</label><input class="input" id="sTag" data-set="general.tagline"></div>
              <div class="field"><label for="sMail">Email liên hệ</label><label class="input-icon">{icon("mail")}<input id="sMail" type="email" data-set="general.contactEmail"></label></div>
              <div class="field"><label for="sTz">Múi giờ mặc định</label><div class="select"><select id="sTz" data-set="general.timezone"><option>GMT+7 — Asia/Ho_Chi_Minh</option><option>GMT+8 — Asia/Singapore</option><option>GMT+9 — Asia/Tokyo</option></select>{icon("chev")}</div></div>
            </div>
            {toggle("general.maintenance", "Chế độ bảo trì", "Tạm ẩn ứng dụng người dùng, chỉ admin truy cập được")}
          </section>

          <section class="card card-stack">
            {head("shield", "Tài khoản quản trị", "…", "adminSub")}
            <div class="admin-list" id="adminList">{skel_list(2)}</div>
            <button class="btn-soft" type="button" id="inviteBtn">{icon("plus")}Mời quản trị viên mới</button>
          </section>

          <section class="card card-stack">
            {head("lock", "Bảo mật", "Yêu cầu đăng nhập cho quản trị viên")}
            {toggle("security.twoFactor", "Xác thực hai lớp (2FA)", "Bắt buộc với mọi tài khoản quản trị")}
            {toggle("security.autoLogout", "Tự động đăng xuất sau 30 phút", "Áp dụng khi không thao tác trên trình duyệt")}
            {toggle("security.ipRestrict", "Giới hạn đăng nhập theo IP nội bộ", "Chỉ cho phép đăng nhập từ mạng công ty")}
          </section>
        </div>

        <div class="settings-side">
          <section class="card card-stack">
            {head("bell", "Thông báo", "Kênh nhận cảnh báo hệ thống")}
            {toggle("notify.pendingReview", "Email khi có đánh giá chờ duyệt")}
            {toggle("notify.newUser", "Email khi có người dùng mới")}
            {toggle("notify.weeklyReport", "Email báo cáo tuần")}
            {toggle("notify.inApp", "Thông báo trong ứng dụng")}
          </section>

          <section class="card card-stack">
            <h2 class="card-title">Sao lưu dữ liệu</h2>
            <div class="kv-list"><div class="kv-row"><span>Sao lưu gần nhất</span><b id="bkLast">—</b></div><div class="kv-row"><span>Tần suất</span><b id="bkFreq">—</b></div></div>
            <button class="btn btn-ghost" type="button" id="backupBtn">Sao lưu ngay</button>
          </section>

          <section class="card card-stack card-warn">
            <div class="card-titles"><h2 class="card-title">Vùng nguy hiểm</h2><p class="card-sub">Các thao tác không thể hoàn tác</p></div>
            <button class="btn btn-danger" type="button" id="resetBtn">Xoá toàn bộ dữ liệu demo</button>
          </section>
        </div>
      </div>
"""

if __name__ == "__main__":
    admin_page("cai-dat.html", "Cài đặt hệ thống", "cai-dat.html", BODY, page_css="settings.css", page_js="cai-dat.js")
