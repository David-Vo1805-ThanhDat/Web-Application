# -*- coding: utf-8 -*-
"""Khung dùng chung của giao diện ADMIN: <head>, sprite icon, sidebar, topbar, thanh tab
di động và danh sách CSS/JS nạp cho mọi trang admin. Mỗi trang admin (tools/build/admin/pages/*.py)
chỉ cung cấp phần thân + CSS/JS riêng của nó qua admin_page().

Thư mục đích: frontend/admin/ (HTML phẳng, cùng cấp với css/, js/, assets/ của admin)."""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
ADMIN_DIR = os.path.join(ROOT, "frontend", "admin")
ICON_DIR = os.path.join(ADMIN_DIR, "assets", "icons")

# Thứ tự nạp CSS: token -> layout -> component (luật sau thắng luật trước khi cùng độ ưu tiên).
CSS_FILES = [
    "base/tokens.css", "base/base.css",
    "layout/shell.css", "layout/sidebar.css", "layout/topbar.css", "layout/page-header.css", "layout/mobile.css",
    "components/icon.css", "components/buttons.css", "components/cards.css", "components/badges.css",
    "components/forms.css", "components/toolbar.css", "components/table.css", "components/pagination.css",
    "components/tabs.css", "components/modal.css", "components/toast.css", "components/empty.css",
    "components/charts.css", "components/lists.css", "components/dropdown.css", "components/skeleton.css",
]

# JS nạp trước JS riêng của từng trang. Admin KHÔNG chứa dữ liệu: mọi dữ liệu lấy từ backend PHP qua js/core/api.js.
JS_FILES = [
    "js/core/config.js", "js/core/dom.js", "js/core/format.js", "js/core/download.js", "js/core/audit-types.js",
    "js/core/api.js",
    "js/components/toast.js", "js/components/modal.js", "js/components/pagination.js",
    "js/components/table.js", "js/components/charts.js", "js/components/dropdown.js",
    "js/core/layout.js",
]

NAV = [
    ("Tổng quan", [("dashboard.html", "grid", "Dashboard", None),
                   ("thong-ke.html", "chart", "Thống kê & báo cáo", None)]),
    ("Nội dung", [("mon-an.html", "bowl", "Món ăn", "foods"),
                  ("danh-muc.html", "tag", "Danh mục & thẻ", None),
                  ("quan-an.html", "store", "Quán ăn gợi ý", "restaurants"),
                  ("cong-thuc.html", "pulse", "Chất lượng công thức", "recipesToReview")]),
    ("Cộng đồng", [("nguoi-dung.html", "users", "Người dùng", None),
                   ("danh-gia.html", "mail", "Góp ý liên hệ", "feedbackNew")]),
    ("Hệ thống", [("cai-dat.html", "gear", "Cài đặt", None),
                  ("nhat-ky.html", "clock", "Nhật ký hoạt động", None)]),
]

MOBILE_TABS = [("dashboard.html", "grid", "Dashboard"), ("mon-an.html", "bowl", "Món ăn"),
               ("thong-ke.html", "chart", "Thống kê"), ("nguoi-dung.html", "users", "Người dùng")]


def sprite():
    """Gộp mọi icon trong assets/icons thành 1 sprite <symbol id="i-<tên>"> chèn đầu <body>."""
    parts = []
    for name in sorted(os.listdir(ICON_DIR)):
        if not name.endswith(".svg"):
            continue
        svg = open(os.path.join(ICON_DIR, name), encoding="utf-8").read()
        vb = re.search(r'viewBox="([^"]+)"', svg).group(1)
        inner = re.sub(r"^.*?<svg[^>]*>", "", svg, flags=re.S)
        inner = re.sub(r"</svg>\s*$", "", inner).strip()
        inner = re.sub(r'\sid="[^"]*"', "", inner)
        parts.append(f'<symbol id="i-{name[:-4]}" viewBox="{vb}" fill="none">{inner}</symbol>')
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' + "".join(parts) + "</svg>"


def icon(name, cls=""):
    c = ("ic " + cls).strip()
    return f'<svg class="{c}" aria-hidden="true"><use href="#i-{name}"/></svg>'


def _sidebar(active):
    out = []
    for group, items in NAV:
        out.append(f'<div class="nav-group-label">{group}</div>')
        for href, ic, label, badge in items:
            cls = "nav-item is-active" if href == active else "nav-item"
            b = f'<span class="nav-badge" data-count="{badge}" hidden></span>' if badge else ""
            out.append(f'<a class="{cls}" href="{href}">{icon(ic)}<span class="nav-label">{label}</span>{b}</a>')
    return "\n".join(out)


def _mobile_tabs(active):
    tabs = []
    for href, ic, label in MOBILE_TABS:
        cls = "tab is-active" if href == active else "tab"
        tabs.append(f'<a class="{cls}" href="{href}">{icon(ic)}<span>{label}</span></a>')
    tabs.append(f'<button class="tab" type="button" data-open-drawer>{icon("more")}<span>Thêm</span></button>')
    return "".join(tabs)


GUARD = """<script>
(function () {
  try {
    var u = JSON.parse(localStorage.getItem('hom_nay_an_gi_user') || 'null');
    var page = location.pathname.split('/').pop() || 'dashboard.html';
    if (!u) { location.replace('../user/dang-nhap.html?next=' + encodeURIComponent('../admin/' + page)); }
    else if (u.role !== 'admin') { location.replace('../user/trang-chu.html'); }
  } catch (e) { location.replace('../user/dang-nhap.html'); }
})();
</script>"""


def admin_page(filename, title, active, body, page_css=None, page_js=None):
    """Sinh 1 trang admin vào frontend/admin/<filename>.
    active: tên file trong menu cần tô sáng. page_css/page_js: tên file trong css/pages/, js/pages/."""
    css = "\n".join(f'<link href="css/{f}" rel="stylesheet">' for f in CSS_FILES)
    if page_css:
        css += f'\n<link href="css/pages/{page_css}" rel="stylesheet">'
    js = "\n".join(f'<script src="{f}"></script>' for f in JS_FILES)
    if page_js:
        js += f'\n<script src="js/pages/{page_js}"></script>'
    html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
{GUARD}
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex,nofollow">
<title>{title} | Quản trị Hôm Nay Ăn Gì?</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
{css}
</head>
<body class="admin is-loading">
{sprite()}
<div class="app">
  <aside class="sidebar" id="sidebar" aria-label="Điều hướng quản trị">
    <div class="sidebar-scroll">
      <a class="brand" href="dashboard.html">
        <span class="brand-mark">{icon("bowl")}</span>
        <span class="brand-text"><b>Hôm Nay Ăn Gì?</b><small>Bảng quản trị</small></span>
      </a>
      <nav class="nav">
{_sidebar(active)}
      </nav>
    </div>
    <div class="admin-profile">
      <span class="avatar avatar-orange" data-admin-initials>QT</span>
      <span class="admin-profile-text"><b data-admin-name>Quản trị viên</b><small>Super admin</small></span>
      <button class="icon-plain" type="button" id="logoutBtn" aria-label="Đăng xuất">{icon("logout")}</button>
    </div>
  </aside>
  <div class="sidebar-backdrop" data-close-drawer></div>

  <div class="main">
    <header class="topbar">
      <div class="search-box" id="globalSearch">
        {icon("search")}
        <input type="search" id="globalSearchInput" placeholder="Tìm món, người dùng, quán ăn…" autocomplete="off" aria-label="Tìm kiếm">
        <kbd>Ctrl K</kbd>
        <div class="search-results" id="globalSearchResults" hidden></div>
      </div>
      <div class="topbar-right">
        <span class="topbar-date" id="topbarDate">Thứ Năm, 24/09/2026</span>
        <div class="dropdown" id="notifWrap">
          <button class="icon-btn has-dot" type="button" id="notifBtn" aria-label="Thông báo">{icon("bell")}</button>
          <div class="dropdown-menu dropdown-menu-right" id="notifMenu" hidden></div>
        </div>
        <a class="icon-btn" href="../user/trang-chu.html" title="Xem web người dùng" aria-label="Xem web người dùng">{icon("eye")}</a>
      </div>
    </header>
    <header class="mobile-topbar">
      <button class="icon-btn icon-btn-soft" type="button" data-open-drawer aria-label="Mở menu">{icon("menu")}</button>
      <a class="mobile-brand" href="dashboard.html"><span class="brand-mark brand-mark-sm">{icon("bowl")}</span><b>Bảng quản trị</b></a>
      <button class="icon-btn icon-btn-soft has-dot" type="button" id="notifBtnMobile" aria-label="Thông báo">{icon("bell")}</button>
    </header>
    <main class="content" id="content">
      <div class="load-error" id="loadError" role="alert" hidden><span><b>Không tải được dữ liệu.</b> <span id="loadErrorMsg"></span></span><button class="btn btn-ghost" type="button" id="loadErrorRetry">Thử lại</button></div>
{body}
    </main>
  </div>
  <nav class="bottom-tabs" aria-label="Điều hướng nhanh">{_mobile_tabs(active)}</nav>
</div>
<div class="toast-stack" id="toastStack" aria-live="polite"></div>
{js}
</body>
</html>
"""
    os.makedirs(ADMIN_DIR, exist_ok=True)
    with open(os.path.join(ADMIN_DIR, filename), "w", encoding="utf-8") as f:
        f.write(html)
    print("admin/" + filename + ":", len(html), "ky tu")


def skel_rows(rows, cols):
    """Các dòng khung chờ cho <tbody> (thay bằng dữ liệu thật khi JS render)."""
    row = '<tr class="skel-row">' + "".join('<td><span class="skel"></span></td>' for _ in range(cols)) + "</tr>"
    return row * rows


def skel_list(n):
    """Danh sách khung chờ (hàng có chấm tròn + 1 dòng)."""
    return '<div class="skel-item"><span class="skel skel-circle"></span><span class="skel skel-line"></span></div>' * n


def skel_cards(n):
    return '<div class="skel skel-card"></div>' * n


def page_header(crumb, title, subtitle, actions=""):
    """Khối tiêu đề trang: breadcrumb + h1 + mô tả + cụm nút bên phải."""
    return f"""<div class="page-header">
  <div class="page-header-text">
    <p class="crumb">{crumb}</p>
    <h1>{title}</h1>
    <p class="subtitle">{subtitle}</p>
  </div>
  <div class="page-actions">{actions}</div>
</div>"""
