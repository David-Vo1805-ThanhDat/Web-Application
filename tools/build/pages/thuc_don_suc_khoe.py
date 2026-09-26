# -*- coding: utf-8 -*-
"""Sinh trang Thực Đơn Sức Khỏe (thuc-don-suc-khoe.html). Trang cần đăng nhập
(gated=True) — dựa trên hồ sơ sức khỏe đã lưu ở Tài Khoản (chiều cao/cân
nặng/tuổi/mức vận động/mục tiêu), tính BMI + nhu cầu calo rồi tự xếp thực đơn
7 ngày sao cho tổng calo mỗi ngày sát mục tiêu. Xem js/health.js."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))  # tools/build (nơi có generate.py)
from generate import OUT_DIR, page

BODY = """
<section class="section">
  <div class="container" style="max-width:64rem;">
    <div class="page-head">
      <h1>Thực Đơn Sức Khỏe 📅</h1>
      <p>Thực đơn 7 ngày tự động, canh đúng lượng calo bạn cần dựa trên hồ sơ sức khỏe của bạn.</p>
    </div>

    <!-- Chưa có hồ sơ sức khỏe -->
    <div class="panel text-center py-5 d-none" id="planEmptyState">
      <div class="fs-1 mb-2">🩺</div>
      <h2 class="h5 fw-bold mb-2">Bạn chưa có hồ sơ sức khỏe</h2>
      <p class="text-muted small mx-auto mb-3" style="max-width:28rem;">
        Nhập chiều cao, cân nặng, tuổi và mục tiêu một lần ở trang Tài Khoản để mình tính BMI
        và lượng calo phù hợp, rồi xếp thực đơn cả tuần cho bạn.
      </p>
      <a href="tai-khoan.html#health-profile" class="btn btn-brand"><i class="bi bi-heart-pulse"></i> Thiết lập hồ sơ sức khỏe</a>
    </div>

    <!-- Đã có hồ sơ -->
    <div id="planMain">
      <div class="panel mb-4">
        <div class="row text-center g-2" id="planSummary">
          <div class="col-6 col-sm-3 border-end">
            <div class="small text-muted">BMI</div>
            <div class="fw-bold fs-5" id="psBMI">—</div>
            <span class="badge" id="psBMICat">—</span>
          </div>
          <div class="col-6 col-sm-3 border-end">
            <div class="small text-muted">Nhu cầu/ngày</div>
            <div class="fw-bold fs-5" id="psTDEE">—</div>
          </div>
          <div class="col-6 col-sm-3 border-end">
            <div class="small text-muted">Mục tiêu calo/ngày</div>
            <div class="fw-bold fs-5" style="color:var(--accent);" id="psTarget">—</div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="small text-muted">Mục tiêu</div>
            <div class="fw-bold fs-5" id="psGoal">—</div>
          </div>
        </div>
        <div class="text-center mt-2">
          <a href="tai-khoan.html#health-profile" class="text-btn">Cập nhật hồ sơ sức khỏe</a>
        </div>
      </div>

      <div class="panel mb-4">
        <div class="row g-3 align-items-end">
          <div class="col-6 col-sm-4">
            <label class="form-label small fw-bold text-uppercase text-muted" for="planTaste">Khẩu vị</label>
            <select id="planTaste" class="form-select">
              <option value="all">Mọi khẩu vị</option>
              <option value="cay">Cay nồng 🌶️</option>
              <option value="thanh-dam">Thanh đạm 🍃</option>
              <option value="dam-da">Đậm đà 🍲</option>
              <option value="chua-cay">Chua cay 🍋</option>
              <option value="beo-ngay">Béo ngậy 🧀</option>
              <option value="ngot">Ngọt bùi 🍯</option>
            </select>
          </div>
          <div class="col-6 col-sm-4">
            <label class="form-label small fw-bold text-uppercase text-muted" for="planDietary">Chế độ ăn</label>
            <select id="planDietary" class="form-select">
              <option value="all">Bình thường + tất cả</option>
              <option value="normal">Bình Thường</option>
              <option value="vegetarian">Ăn Chay 🌱</option>
              <option value="eat-clean">Eat Clean 🥑</option>
              <option value="low-carb">Low-Carb 🥩</option>
            </select>
          </div>
          <div class="col-sm-4">
            <button type="button" class="btn btn-brand w-100" id="planRegenBtn"><i class="bi bi-magic"></i> Tạo Thực Đơn Tuần Mới</button>
          </div>
        </div>
        <p class="text-muted small mb-0 mt-2">Nếu không đủ món hợp bộ lọc, thực đơn sẽ tự nới lỏng bớt để luôn đủ 7 ngày.</p>
      </div>
      <div class="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-3" id="planGrid"></div>
    </div>
  </div>
</section>
"""

EXTRA_SCRIPT = """<script src="js/pages/thuc-don-suc-khoe.js"></script>"""

if __name__ == "__main__":
    html = page(
        "Thực Đơn Sức Khỏe | Hôm Nay Bạn Muốn Ăn Gì?",
        "Thực đơn 7 ngày tự động, canh đúng lượng calo bạn cần dựa trên chiều cao, cân nặng và mục tiêu sức khỏe.",
        BODY, EXTRA_SCRIPT, gated=True
    )
    with open(os.path.join(OUT_DIR, "thuc-don-suc-khoe.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("thuc-don-suc-khoe.html:", len(html), "ky tu")
