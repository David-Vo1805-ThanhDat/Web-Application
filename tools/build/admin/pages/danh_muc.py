# -*- coding: utf-8 -*-
"""Trang Danh mục & thẻ (frontend/admin/danh-muc.html) — Figma "05 · Danh mục & thẻ". Nội dung đổ bởi js/pages/danh-muc.js."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from layout import admin_page, icon, page_header, skel_list

actions = f"""<button class="btn btn-primary" type="button" id="addCategory">{icon("plus")}Thêm danh mục</button>"""

def chip_card(box, title, sub_id, add_id, add_label):
    return f"""<section class="card card-stack">
          <div class="card-titles"><h2 class="card-title">{title}</h2><p class="card-sub" id="{sub_id}">…</p></div>
          <div class="pill-set" id="{box}"></div>
          <button class="btn-soft" type="button" id="{add_id}">{icon("plus")}{add_label}</button>
        </section>"""

BODY = f"""
      {page_header("Nội dung / Danh mục &amp; thẻ", "Danh mục &amp; thẻ", "Quản lý danh mục món ăn, vùng miền, khẩu vị và thẻ hiển thị", actions)}

      <div class="taxo-layout">
        <div class="taxo-main">
          <section class="card card-stack">
            <div class="card-titles"><h2 class="card-title">Danh mục món ăn</h2><p class="card-sub" id="catSub">…</p></div>
            <div class="cat-list" id="catList">{skel_list(5)}</div>
          </section>
          <section class="card card-stack">
            <div class="card-titles"><h2 class="card-title">Vùng miền</h2><p class="card-sub" id="regSub">…</p></div>
            <div class="region-grid" id="regionList"></div>
          </section>
        </div>
        <div class="taxo-side">
          {chip_card("tasteList", "Khẩu vị", "tasteSub", "addTaste", "Thêm khẩu vị")}
          {chip_card("dietList", "Chế độ ăn", "dietSub", "addDiet", "Thêm chế độ ăn")}
          {chip_card("tagList", "Thẻ hiển thị (tags)", "tagSub", "addTag", "Thêm thẻ mới")}
        </div>
      </div>
"""

if __name__ == "__main__":
    admin_page("danh-muc.html", "Danh mục & thẻ", "danh-muc.html", BODY, page_css="taxonomy.css", page_js="danh-muc.js")
