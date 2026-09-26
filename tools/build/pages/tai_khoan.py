# -*- coding: utf-8 -*-
"""Sinh trang Tài khoản & cài đặt (tai-khoan.html). Trang này cần đăng nhập
(gated=True) — xem tên/email đang dùng, đổi tên hiển thị (hiện chỉ đổi trong trình duyệt,
chờ backend có API cập nhật hồ sơ — xem backend/HANDOFF.md), nhập hồ sơ sức khỏe (lưu theo tài khoản
trên server, xem js/core/sync.js) và xoá món yêu thích + đăng xuất."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))  # tools/build (nơi có generate.py)
from generate import OUT_DIR, page

BODY = """
<section class="section">
  <div class="container acct-container">
    <div class="page-head">
      <h1>Tài khoản của tôi</h1>
      <p>Xem thông tin tài khoản, hồ sơ sức khỏe và chỉnh vài cài đặt cơ bản.</p>
    </div>

    <div class="panel mb-4">
      <div class="acct-profile">
        <span class="nav-user-avatar acct-avatar" id="acctAvatar"></span>
        <div>
          <div class="fw-bold fs-5" id="acctName"></div>
          <div class="text-muted small" id="acctEmail"></div>
        </div>
      </div>
      <div class="row text-center bg-light rounded-3 py-2 my-3 border">
        <div class="col border-end">
          <div class="small text-muted">Món yêu thích</div>
          <div class="fw-bold" id="acctFavCount">0</div>
        </div>
        <div class="col">
          <div class="small text-muted">Dùng thử từ</div>
          <div class="fw-bold" id="acctSince">—</div>
        </div>
      </div>
      <p class="auth-note mb-0"><i class="bi bi-info-circle"></i> Thông tin tài khoản chỉ lưu trên trình duyệt này, chưa có server thật để đồng bộ nhiều thiết bị.</p>
    </div>

    <div class="panel mb-4">
      <h2 class="panel-title mb-3"><i class="bi bi-gear"></i> Cài đặt</h2>
      <form id="nameForm" class="mb-4">
        <label class="form-label" for="nameInput">Tên hiển thị</label>
        <div class="d-flex flex-column flex-sm-row gap-2">
          <input type="text" class="form-control" id="nameInput" required>
          <button type="submit" class="btn btn-brand">Lưu</button>
        </div>
      </form>
      <label class="form-label">Email</label>
      <p class="text-muted small mb-0" id="acctEmail2"></p>
      <p class="text-muted small">Hiện chưa hỗ trợ đổi email.</p>
    </div>

    <div class="panel mb-4" id="health-profile">
      <h2 class="panel-title mb-1"><i class="bi bi-heart-pulse"></i> Hồ sơ sức khỏe</h2>
      <p class="text-muted small mb-3">Dùng để tính BMI và gợi ý lượng calo phù hợp cho trang Thực Đơn Sức Khỏe.</p>
      <form id="healthForm">
        <div class="row g-3 mb-3">
          <div class="col-6 col-sm-3">
            <label class="form-label small" for="hpHeight">Chiều cao (cm)</label>
            <input type="number" class="form-control" id="hpHeight" min="100" max="250" required>
          </div>
          <div class="col-6 col-sm-3">
            <label class="form-label small" for="hpWeight">Cân nặng (kg)</label>
            <input type="number" class="form-control" id="hpWeight" min="30" max="250" step="0.1" required>
          </div>
          <div class="col-6 col-sm-3">
            <label class="form-label small" for="hpAge">Tuổi</label>
            <input type="number" class="form-control" id="hpAge" min="10" max="100" required>
          </div>
          <div class="col-6 col-sm-3">
            <label class="form-label small" for="hpGender">Giới tính</label>
            <select class="form-select" id="hpGender">
              <option value="nam">Nam</option>
              <option value="nu">Nữ</option>
            </select>
          </div>
        </div>
        <div class="row g-3 mb-3">
          <div class="col-sm-6">
            <label class="form-label small" for="hpActivity">Mức vận động</label>
            <select class="form-select" id="hpActivity"></select>
          </div>
          <div class="col-sm-6">
            <label class="form-label small" for="hpGoal">Mục tiêu</label>
            <select class="form-select" id="hpGoal"></select>
          </div>
        </div>
        <button type="submit" class="btn btn-brand"><i class="bi bi-save"></i> Lưu hồ sơ</button>
      </form>

      <div class="health-summary d-none mt-4" id="healthSummary">
        <div class="row text-center bg-light rounded-3 py-3 border g-2">
          <div class="col-6 col-sm-3 border-end">
            <div class="small text-muted">BMI</div>
            <div class="fw-bold fs-5" id="hsBMI">—</div>
            <span class="badge" id="hsBMICat">—</span>
          </div>
          <div class="col-6 col-sm-3 border-end">
            <div class="small text-muted">Nhu cầu/ngày</div>
            <div class="fw-bold fs-5" id="hsTDEE">—</div>
          </div>
          <div class="col-6 col-sm-3 border-end">
            <div class="small text-muted">Mục tiêu calo</div>
            <div class="fw-bold fs-5" style="color:var(--accent);" id="hsTarget">—</div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="small text-muted">Mục tiêu</div>
            <div class="fw-bold fs-5" id="hsGoal">—</div>
          </div>
        </div>
        <a href="thuc-don-suc-khoe.html" class="btn btn-outline-brand w-100 mt-3"><i class="bi bi-calendar-week"></i> Xem Thực Đơn Sức Khỏe</a>
      </div>
      <p class="auth-note mt-3 mb-0"><i class="bi bi-info-circle"></i> Công cụ tham khảo cho vui dựa trên công thức phổ biến (Mifflin-St Jeor), không thay thế tư vấn dinh dưỡng hay y tế chuyên môn.</p>
    </div>

    <div class="panel acct-danger">
      <h2 class="panel-title mb-2 text-danger"><i class="bi bi-exclamation-triangle"></i> Vùng nguy hiểm</h2>
      <p class="text-muted small">Xoá hết món yêu thích đã lưu và đăng xuất khỏi trình duyệt này. Không thể hoàn tác.</p>
      <button type="button" class="btn btn-outline-brand" id="clearDataBtn"><i class="bi bi-trash3"></i> Xoá dữ liệu &amp; đăng xuất</button>
    </div>
  </div>
</section>
"""

EXTRA_SCRIPT = """<script src="js/pages/tai-khoan.js"></script>"""

if __name__ == "__main__":
    html = page(
        "Tài Khoản Của Tôi | Hôm Nay Ăn Gì?",
        "Xem thông tin tài khoản, chỉnh tên hiển thị, hồ sơ sức khỏe và món yêu thích.",
        BODY, EXTRA_SCRIPT, gated=True
    )
    with open(os.path.join(OUT_DIR, "tai-khoan.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("tai-khoan.html:", len(html), "ky tu")
