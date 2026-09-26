# -*- coding: utf-8 -*-
"""Trang Dashboard (frontend/admin/dashboard.html) — thiết kế Figma "02 · Dashboard" + "13 · Dashboard (Mobile)".
Khung HTML tĩnh; số liệu do js/pages/dashboard.js đổ vào từ Api.call('dashboard')."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from layout import admin_page, icon, page_header, skel_list

KPIS = [
    ("foods", "orange", "bowl", "Món ăn đang hiển thị", "mon-an.html", "b-orange"),
    ("users", "blue", "users", "Người dùng", "nguoi-dung.html", "b-green"),
    ("spins", "purple", "wheel", "Lượt quay & mở hộp", "thong-ke.html", "b-green"),
    ("favorites", "rose", "heart", "Lượt yêu thích", "thong-ke.html", "b-green"),
    ("rating", "amber", "star", "Đánh giá trung bình", "mon-an.html", "b-gray"),
    ("health", "green", "pulse", "Hồ sơ sức khỏe", "nguoi-dung.html", "b-blue"),
]


def kpi_cards():
    out = []
    for key, tone, ic, label, href, badge in KPIS:
        out.append(f"""<a class="card kpi" href="{href}" data-kpi="{key}">
        <div class="kpi-top"><span class="tint tint-{tone} kpi-icon">{icon(ic)}</span><span class="kpi-more">{icon("dots")}</span></div>
        <div class="kpi-body"><span class="kpi-label">{label}</span><span class="kpi-value" data-kpi-value>—</span></div>
        <span class="badge {badge}" data-kpi-note>&nbsp;</span>
      </a>""")
    return "\n      ".join(out)


MOBILE_KPIS = [("foods", "orange", "bowl", "Món ăn"), ("users", "blue", "users", "Người dùng"),
               ("spins", "purple", "wheel", "Lượt quay"), ("favorites", "rose", "heart", "Yêu thích")]


def mobile_kpis():
    return "\n      ".join(
        f'<div class="card m-kpi" data-mkpi="{k}"><span class="tint tint-{t} m-kpi-icon">{icon(ic)}</span><span class="m-kpi-label">{label}</span><span class="m-kpi-value" data-kpi-value>—</span></div>'
        for k, t, ic, label in MOBILE_KPIS)


actions = f"""<div class="seg" id="rangeSeg" role="group" aria-label="Khoảng thời gian">
      <button type="button" data-range="today">Hôm nay</button>
      <button type="button" data-range="7">7 ngày</button>
      <button type="button" data-range="30" class="is-active">30 ngày</button>
      <button type="button" data-range="90">90 ngày</button>
    </div>
    <button class="btn btn-ghost" type="button" id="pickDateBtn">{icon("cal")}Chọn ngày</button>
    <button class="btn btn-primary" type="button" id="exportBtn">{icon("download")}Xuất báo cáo</button>"""

BODY = f"""
      <div class="only-desktop">
      {page_header("Tổng quan / Dashboard", '<span id="greeting">Chào bạn</span>, <span data-admin-name>Quản trị viên</span>',
                   'Tình hình “Hôm Nay Ăn Gì?” <span id="rangeText">trong 30 ngày qua</span>, cập nhật lúc <span id="updatedAt">--:--</span>', actions)}
      </div>

      <div class="only-mobile m-greet">
        <p>Chào buổi chiều 👋</p>
        <h1 data-admin-name>Quản trị viên</h1>
      </div>

      <section class="kpi-row only-desktop" aria-label="Chỉ số chính">
      {kpi_cards()}
      </section>

      <section class="m-kpi-grid only-mobile" aria-label="Chỉ số chính">
      {mobile_kpis()}
      </section>

      <section class="dash-charts only-desktop">
        <article class="card card-stack" id="spinsCard">
          <div class="card-header"><div class="card-titles"><h2 class="card-title">Lượt quay &amp; mở hộp theo ngày</h2><p class="card-sub">7 ngày gần nhất, theo bữa ăn</p></div></div>
          <div id="spinsChart"><span class="skel skel-block"></span></div>
        </article>
        <article class="card card-stack" id="categoryCard">
          <div class="card-header"><div class="card-titles"><h2 class="card-title">Món theo danh mục</h2><p class="card-sub" id="categorySub">&nbsp;</p></div></div>
          <div class="donut-wrap" id="categoryDonut"></div>
          <div class="legend-list" id="categoryLegend"></div>
        </article>
      </section>

      <article class="card only-mobile" id="mSpinsCard">
        <div class="card-header"><h2 class="card-title m-title">Lượt quay 7 ngày</h2><span class="kpi-more">{icon("dots")}</span></div>
        <div id="mSpinsChart"></div>
      </article>

      <section class="dash-lists only-desktop">
        <article class="card card-stack">
          <div class="card-header"><div class="card-titles"><h2 class="card-title">Món được quay trúng nhiều nhất</h2><p class="card-sub">Theo lượt đánh giá</p></div></div>
          <div class="rank-list" id="topSpun">{skel_list(5)}</div>
        </article>
        <article class="card card-stack">
          <div class="card-header"><div class="card-titles"><h2 class="card-title">Món được yêu thích nhiều nhất</h2><p class="card-sub" id="favSub">2.036 lượt tim</p></div></div>
          <div id="topFav"></div>
        </article>
        <article class="card card-stack">
          <div class="card-header"><div class="card-titles"><h2 class="card-title">Hoạt động gần đây</h2><p class="card-sub">Nhật ký thao tác admin &amp; hệ thống</p></div>
            <a class="btn-link" href="nhat-ky.html">Xem tất cả</a></div>
          <div class="activity-list" id="recentActivity">{skel_list(5)}</div>
        </article>
      </section>

      <article class="card card-flush only-mobile m-list-card">
        <div class="m-list-head"><h2 class="card-title m-title">Món quay trúng nhiều nhất</h2><a class="m-link" href="thong-ke.html">Xem tất cả</a></div>
        <div id="mTopSpun"></div>
      </article>

      <article class="card card-notice only-mobile" id="needAction" hidden>
        <div class="card-header"><h2 class="card-title m-title" style="color:var(--ad-orange-700)">Cần xử lý</h2><span class="badge b-amber" id="needCount">&nbsp;</span></div>
        <p class="m-need-text" id="needText"></p>
      </article>
"""

if __name__ == "__main__":
    admin_page("dashboard.html", "Dashboard", "dashboard.html", BODY, page_css="dashboard.css", page_js="dashboard.js")
