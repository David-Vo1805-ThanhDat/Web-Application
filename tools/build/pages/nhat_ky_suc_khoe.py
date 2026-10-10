# -*- coding: utf-8 -*-
"""Sinh trang Nhật Ký Sức Khỏe (nhat-ky-suc-khoe.html). Trang cần đăng nhập
(gated=True) — ghi nhận cân nặng theo thời gian, tự tính lại BMI, xem xu
hướng tuần/tháng/năm, và đối chiếu với các món ăn gần đây đã chọn (vòng quay
/ hộp quà bí ẩn). Xem js/health.js."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))  # tools/build (nơi có generate.py)
from generate import OUT_DIR, page

BODY = """
<section class="section">
  <div class="container" style="max-width:52rem;">
    <div class="page-head">
      <h1>Nhật Ký Sức Khỏe 🕘</h1>
      <p>Ghi nhận cân nặng theo thời gian, theo dõi BMI thay đổi và đối chiếu với món đã ăn gần đây.</p>
    </div>

    <!-- Chưa có hồ sơ sức khỏe -->
    <div class="panel text-center py-5 d-none" id="logEmptyState">
      <div class="fs-1 mb-2">🩺</div>
      <h2 class="h5 fw-bold mb-2">Bạn chưa có hồ sơ sức khỏe</h2>
      <p class="text-muted small mx-auto mb-3" style="max-width:26rem;">
        Nhập chiều cao, cân nặng, tuổi ở trang Tài Khoản trước để mình tính BMI mỗi lần bạn ghi nhật ký.
      </p>
      <a href="tai-khoan.html#health-profile" class="btn btn-brand"><i class="bi bi-heart-pulse"></i> Thiết lập hồ sơ sức khỏe</a>
    </div>

    <!-- Đã có hồ sơ -->
    <div id="logMain">
      <div class="panel mb-4">
        <div class="row text-center g-2">
          <div class="col-4">
            <div class="small text-muted">Cân nặng gần nhất</div>
            <div class="fw-bold fs-5" id="lsWeight">—</div>
          </div>
          <div class="col-4">
            <div class="small text-muted">BMI</div>
            <div class="fw-bold fs-5" id="lsBMI">—</div>
            <span class="badge" id="lsBMICat">—</span>
          </div>
          <div class="col-4">
            <div class="small text-muted">So với mốc trước</div>
            <div class="fw-bold fs-5" id="lsDelta">—</div>
          </div>
        </div>
      </div>

      <div class="panel mb-4">
        <h2 class="panel-title mb-3"><i class="bi bi-clipboard2-pulse"></i> Ghi nhận cân nặng hôm nay</h2>
        <form id="logForm" class="row g-2 align-items-end">
          <div class="col-6 col-sm-4">
            <label class="form-label small" for="logDate">Ngày</label>
            <input type="date" class="form-control" id="logDate" required>
          </div>
          <div class="col-6 col-sm-4">
            <label class="form-label small" for="logWeight">Cân nặng (kg)</label>
            <input type="number" class="form-control" id="logWeight" min="30" max="250" step="0.1" required>
          </div>
          <div class="col-sm-4">
            <button type="submit" class="btn btn-brand w-100"><i class="bi bi-plus-lg"></i> Ghi Nhận</button>
          </div>
        </form>
      </div>

      <div class="panel mb-4">
        <div class="panel-head">
          <h2 class="panel-title mb-0"><i class="bi bi-graph-up"></i> Xu hướng cân nặng</h2>
          <div class="seg" id="trendSwitch" role="group" aria-label="Xem xu hướng theo">
            <button type="button" data-period="week" aria-pressed="true">Tuần</button>
            <button type="button" data-period="month" aria-pressed="false">Tháng</button>
            <button type="button" data-period="year" aria-pressed="false">Năm</button>
          </div>
        </div>
        <div class="trend-chart" id="trendChart"></div>
        <p class="text-muted small mb-0 mt-2">Chỉ tính trên các mốc bạn đã ghi nhận trong trình duyệt này — chưa có dữ liệu thì chưa vẽ được nhé.</p>
      </div>

      <div class="panel mb-4">
        <h2 class="panel-title mb-3"><i class="bi bi-journal-text"></i> Nhật ký chi tiết</h2>
        <div id="logList"></div>
      </div>

      <div class="panel mb-4">
        <h2 class="panel-title mb-3"><i class="bi bi-clock-history"></i> Món ăn gần đây đã chọn</h2>
        <div class="d-flex flex-column gap-2" id="foodHistoryList"></div>
      </div>
    </div>
  </div>
</section>
"""

EXTRA_SCRIPT = """<script src="js/pages/nhat-ky-suc-khoe.js"></script>"""

if __name__ == "__main__":
    html = page(
        "Nhật Ký Sức Khỏe | Hôm Nay Bạn Muốn Ăn Gì?",
        "Ghi nhận cân nặng theo thời gian, theo dõi BMI thay đổi theo tuần/tháng/năm và đối chiếu với món ăn gần đây đã chọn.",
        BODY, EXTRA_SCRIPT, gated=True, chatbot=True
    )
    with open(os.path.join(OUT_DIR, "nhat-ky-suc-khoe.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("nhat-ky-suc-khoe.html:", len(html), "ky tu")
