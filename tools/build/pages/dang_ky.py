# -*- coding: utf-8 -*-
"""Sinh trang đăng ký (dang-ky.html). Đăng ký là THẬT: tạo tài khoản ở backend (js/pages/dang-ky.js gọi
backend/api/auth) rồi đăng nhập luôn; yêu cầu mật khẩu ≥ 6 ký tự."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))  # tools/build (nơi có generate.py)
from generate import OUT_DIR, page, auth_side_bg, auth_hook, AUTH_BG_SCRIPT

BODY = """
<section class="auth-section">
  <div class="auth-shell">
    <div class="auth-side">
      """ + auth_side_bg() + auth_hook(
          ["Còn Chần Chừ", "Gì Nữa Đây?"],
          "Đói thì đừng nghĩ nhiều, bấm cái là có ngay 🔥"
      ) + """
    </div>
    <div class="auth-form-panel">
      <div class="auth-card">
        <h1>Đăng ký</h1>
        <form id="registerForm" novalidate>
          <div class="mb-3">
            <label class="form-label" for="regName">Tên hiển thị</label>
            <input type="text" class="form-control" id="regName" placeholder="Ví dụ: Lan Anh" required>
          </div>
          <div class="mb-3">
            <label class="form-label" for="regEmail">Email</label>
            <input type="email" class="form-control" id="regEmail" placeholder="ban@email.com" required>
          </div>
          <div class="mb-3">
            <label class="form-label" for="regPassword">Mật khẩu</label>
            <input type="password" class="form-control" id="regPassword" placeholder="Ít nhất 6 ký tự" required minlength="6">
          </div>
          <div class="mb-3">
            <label class="form-label" for="regPassword2">Nhập lại mật khẩu</label>
            <input type="password" class="form-control" id="regPassword2" placeholder="••••••••" required minlength="6">
          </div>
          <button type="submit" class="btn btn-brand btn-lg w-100">Tạo tài khoản</button>
        </form>
        <p class="auth-switch">Đã có tài khoản? <a href="dang-nhap.html">Đăng nhập</a></p>
        <p class="auth-switch"><a href="index.html"><i class="bi bi-arrow-left"></i> Về trang chủ</a></p>
      </div>
    </div>
  </div>
</section>
"""

EXTRA_SCRIPT = AUTH_BG_SCRIPT + """<script src="js/pages/dang-ky.js"></script>"""

if __name__ == "__main__":
    html = page(
        "Đăng Ký | Hôm Nay Ăn Gì?",
        "Tạo tài khoản miễn phí để quay vòng quay may mắn, lọc món theo khẩu vị và ngân sách, hoặc chọn món cùng cả nhóm.",
        BODY, EXTRA_SCRIPT, navbar_mode="public"
    )
    with open(os.path.join(OUT_DIR, "dang-ky.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("dang-ky.html:", len(html), "ky tu")
