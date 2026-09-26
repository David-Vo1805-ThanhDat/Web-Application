# -*- coding: utf-8 -*-
"""Sinh trang đăng nhập (dang-nhap.html). Đăng nhập là THẬT: gọi backend/api/auth (xem js/core/backend.js và
js/pages/dang-nhap.js); trình duyệt chỉ nhớ tên/email/vai trò server trả về (xem js/core/auth.js)."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))  # tools/build (nơi có generate.py)
from generate import OUT_DIR, page, auth_side_bg, auth_hook, AUTH_BG_SCRIPT

BODY = """
<section class="auth-section">
  <div class="auth-shell">
    <div class="auth-side">
      """ + auth_side_bg() + auth_hook(
          ["Bao Lâu Rồi", "Bạn Chưa Quay?"],
          "Vòng quay, quán ngon và cả hội bạn đang đợi bạn đó 👀"
      ) + """
    </div>
    <div class="auth-form-panel">
      <div class="auth-card">
        <h1>Đăng nhập</h1>
        <p class="auth-note"><i class="bi bi-shield-check"></i> <span>Một tài khoản dùng chung cho người dùng và quản trị viên. Đăng nhập xong, hệ thống tự nhận diện vai trò và đưa bạn thẳng vào đúng giao diện — Trang chủ hoặc Bảng quản trị.</span></p>
        <form id="loginForm" novalidate>
          <div class="mb-3">
            <label class="form-label" for="loginEmail">Email</label>
            <input type="email" class="form-control" id="loginEmail" placeholder="ban@email.com" required>
          </div>
          <div class="mb-3">
            <label class="form-label" for="loginPassword">Mật khẩu</label>
            <input type="password" class="form-control" id="loginPassword" placeholder="••••••••" required>
          </div>
          <div class="form-check mb-3">
            <input class="form-check-input" type="checkbox" id="loginRemember" checked>
            <label class="form-check-label small" for="loginRemember">Ghi nhớ đăng nhập trên trình duyệt này</label>
          </div>
          <button type="submit" class="btn btn-brand btn-lg w-100">Đăng nhập</button>
        </form>
        <p class="auth-switch">Chưa có tài khoản? <a href="dang-ky.html">Đăng ký ngay</a></p>
        <p class="auth-switch"><a href="index.html"><i class="bi bi-arrow-left"></i> Về trang chủ</a></p>
      </div>
    </div>
  </div>
</section>
"""

EXTRA_SCRIPT = AUTH_BG_SCRIPT + """<script src="js/pages/dang-nhap.js"></script>"""

if __name__ == "__main__":
    html = page(
        "Đăng Nhập | Hôm Nay Ăn Gì?",
        "Đăng nhập để quay vòng quay may mắn, lọc món theo khẩu vị và ngân sách, hoặc chọn món cùng cả nhóm.",
        BODY, EXTRA_SCRIPT, navbar_mode="public"
    )
    with open(os.path.join(OUT_DIR, "dang-nhap.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("dang-nhap.html:", len(html), "ky tu")
