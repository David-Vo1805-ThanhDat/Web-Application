# -*- coding: utf-8 -*-
"""Trang Thống kê & báo cáo (frontend/admin/thong-ke.html) — Figma "Thống kê & báo cáo". Đổ dữ liệu bởi js/pages/thong-ke.js."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from layout import admin_page, icon, page_header, skel_rows

STATS = [("newUsers", "blue", "users", "Người dùng mới"), ("spins", "purple", "wheel", "Lượt quay &amp; mở hộp"),
         ("favorites", "rose", "heart", "Lượt yêu thích mới"), ("decideRate", "green", "pulse", "Tỉ lệ chốt món")]
cards = "".join(f"""<div class="card stat-card"><span class="tint tint-{t}">{icon(ic)}</span><span class="stat-label">{lb}</span><span class="stat-value" data-stat="{k}">—</span><span class="stat-note" data-note="{k}">&nbsp;</span></div>""" for k, t, ic, lb in STATS)

actions = f"""<div class="seg" id="range" role="group" aria-label="Khoảng thời gian">
      <button type="button" data-range="7">7 ngày</button><button type="button" class="is-active" data-range="30">30 ngày</button><button type="button" data-range="quy">Quý này</button></div>
    <button class="btn btn-ghost" type="button" id="customBtn">{icon("cal")}Chọn khoảng ngày</button>
    <button class="btn btn-soft-orange" type="button" id="pdfBtn">{icon("download")}Xuất PDF</button>
    <button class="btn btn-primary" type="button" id="csvBtn">{icon("download")}Xuất CSV</button>"""

BODY = f"""
      {page_header("Tổng quan / Thống kê &amp; báo cáo", "Thống kê &amp; báo cáo", "Phân tích toàn diện hoạt động người dùng và món ăn", actions)}

      <div class="stat-row">{cards}</div>

      <section class="card card-stack">
        <div class="card-titles"><h2 class="card-title">Tăng trưởng người dùng &amp; lượt quay</h2><p class="card-sub" id="rangeText">30 ngày qua</p></div>
        <div id="lineChart"></div>
        <div class="chart-legend"><span class="legend-item"><span class="legend-dot dot-orange"></span>Người dùng mới</span><span class="legend-item"><span class="legend-dot dot-purple"></span>Lượt quay &amp; mở hộp</span></div>
      </section>

      <div class="two-col">
        <section class="card card-stack"><div class="card-titles"><h2 class="card-title">Lượt quay theo bữa ăn</h2><p class="card-sub" id="mealSub">…</p></div><div id="mealBars"></div></section>
        <section class="card card-stack"><div class="card-titles"><h2 class="card-title">Món theo vùng miền</h2><p class="card-sub" id="regionSub">…</p></div><div id="regionBars"></div></section>
      </div>

      <section class="card card-stack">
        <div class="card-titles"><h2 class="card-title">Hiệu suất theo món ăn</h2><p class="card-sub">Xếp hạng theo lượt quay trúng trong kỳ</p></div>
        <div class="table-scroll"><table class="data-table plain" id="perfTable">
          <thead><tr><th>Món ăn</th><th class="num">Lượt xem</th><th class="num">Lượt quay</th><th class="num">Yêu thích</th><th class="num">Tỉ lệ chốt</th><th class="num">Đánh giá</th></tr></thead>
          <tbody id="perfBody">{skel_rows(5, 6)}</tbody></table></div>
      </section>
"""

if __name__ == "__main__":
    admin_page("thong-ke.html", "Thống kê & báo cáo", "thong-ke.html", BODY, page_css="stats.css", page_js="thong-ke.js")
