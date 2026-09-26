# -*- coding: utf-8 -*-
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))  # tools/build (nơi có generate.py)
from generate import OUT_DIR, page, result_modal_block

BODY = """
<section class="container py-4 py-lg-5 dock-space">
  <div class="page-head">
    <h1 id="goiYTitle">Hôm nay ăn gì đây?</h1>
    <p id="goiYSubtitle">Lọc theo ý bạn rồi quay để chốt. Vòng quay luôn xoay nhẹ, bấm vào là quay thật.</p>
  </div>

  <div class="row g-4 align-items-start">

    <!-- Bước 2: quay (bên phải trên máy tính, dính khi cuộn; trên điện thoại hiện trước) -->
    <div class="col-lg-5 order-1 order-lg-2">
      <div class="tool-wheel">
        <div class="panel wheel-panel">
          <div class="panel-head">
            <h2 class="panel-title"><span class="panel-num">2</span> Quay để chốt</h2>
            <div class="seg" id="modeSwitch" role="group" aria-label="Cách chọn ngẫu nhiên">
              <button type="button" id="modeWheelBtn" aria-pressed="true">Vòng quay</button>
              <button type="button" id="modeBoxBtn" aria-pressed="false">Hộp bí ẩn</button>
            </div>
          </div>

          <div id="wheelStage">
            <div class="wheel-wrapper">
              <div class="wheel-pointer" aria-hidden="true"></div>
              <div class="wheel-ring">
                <canvas id="wheelCanvas" width="560" height="560" role="img" aria-label="Vòng quay chọn món ăn. Bấm để quay."></canvas>
              </div>
            </div>
            <button type="button" class="btn btn-brand btn-lg mt-3" id="spinWheelBtn">Quay chọn món</button>
          </div>

          <div id="boxStage" class="d-none">
            <p class="hint mb-2">Có bao nhiêu món thì bấy nhiêu hộp. Bấm vào một hộp bất kỳ để mở — hộp mở rồi thì thôi, không mở lại được, nhưng hộp khác vẫn mở tiếp được nếu chưa ưng món.</p>
            <div class="box-grid" id="boxGrid"></div>
            <button type="button" class="text-btn" id="resetBoxesBtn"><i class="bi bi-arrow-repeat"></i> Đổi hộp mới</button>
          </div>

          <p class="spin-note" id="spinNote" aria-live="polite"></p>
        </div>
      </div>
    </div>

    <!-- Bước 1: chọn món -->
    <div class="col-lg-7 order-2 order-lg-1">
      <div class="panel picker">
        <div class="panel-head">
          <h2 class="panel-title"><span class="panel-num">1</span> Chọn món</h2>
          <div class="seg" role="tablist" aria-label="Cách chọn món">
            <button type="button" role="tab" id="tabCriteria" aria-selected="true" aria-controls="panelCriteria">Theo tiêu chí</button>
            <button type="button" role="tab" id="tabGroup" aria-selected="false" aria-controls="panelGroup">Cả nhóm đề cử</button>
          </div>
        </div>

        <!-- Tab 1: lọc theo tiêu chí rồi tick chọn món -->
        <div id="panelCriteria" role="tabpanel" aria-labelledby="tabCriteria">
          <div class="filter-bar">
            <div>
              <label for="filterMeal">Bữa ăn</label>
              <select class="form-select" id="filterMeal">
                <option value="all">Tất cả</option>
                <option value="sang">Sáng</option>
                <option value="trua">Trưa</option>
                <option value="toi">Tối</option>
                <option value="an-vat">Ăn vặt</option>
              </select>
            </div>
            <div>
              <label for="filterPrice">Ngân sách</label>
              <select class="form-select" id="filterPrice">
                <option value="all">Tất cả</option>
                <option value="under-30k">Dưới 30k</option>
                <option value="30k-60k">30k - 60k</option>
                <option value="60k-150k">60k - 150k</option>
                <option value="above-150k">Trên 150k</option>
              </select>
            </div>
            <div>
              <label for="filterTaste">Khẩu vị</label>
              <select class="form-select" id="filterTaste">
                <option value="all">Tất cả</option>
                <option value="cay">Cay</option>
                <option value="ngot">Ngọt</option>
                <option value="thanh-dam">Thanh đạm</option>
                <option value="beo-ngay">Béo ngậy</option>
              </select>
            </div>
            <div>
              <label for="filterDietary">Chế độ ăn</label>
              <select class="form-select" id="filterDietary">
                <option value="all">Tất cả</option>
                <option value="vegetarian">Chay</option>
                <option value="eat-clean">Eat-clean</option>
                <option value="low-carb">Low-carb</option>
              </select>
            </div>
          </div>

          <div class="pick-toolbar">
            <div class="pick-count" id="pickCount" aria-live="polite"></div>
            <div class="d-flex gap-3">
              <button type="button" class="text-btn" id="randomPickBtn"><i class="bi bi-shuffle"></i> Chọn ngẫu nhiên 8 món</button>
              <button type="button" class="text-btn" id="clearPickBtn">Bỏ chọn hết</button>
            </div>
          </div>
          <div class="pick-grid" id="pickGrid"></div>
        </div>

        <!-- Tab 2: mỗi người đề cử một món -->
        <div id="panelGroup" role="tabpanel" aria-labelledby="tabGroup" hidden>
          <p class="hint">Mỗi người tự gõ tên một món mình muốn ăn (món gì cũng được, không cần có sẵn trong thực đơn). Món nào được nhiều người gõ sẽ chiếm nhiều ô hơn trên vòng quay, nên dễ trúng hơn.</p>
          <div class="people" id="people"></div>
          <div class="d-flex flex-wrap gap-2 mt-3">
            <button type="button" class="btn btn-outline-brand" id="addPersonBtn"><i class="bi bi-person-plus"></i> Thêm người</button>
            <button type="button" class="btn btn-outline-brand" id="fillRandomBtn"><i class="bi bi-dice-5"></i> Chọn giúp người chưa chọn</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Thanh quay cố định ở đáy màn hình điện thoại -->
<div class="spin-dock" id="spinDock">
  <span id="dockInfo"></span>
  <button type="button" class="btn btn-brand" id="dockSpinBtn">Quay chọn món</button>
</div>

<!-- Kết quả rút gọn: dùng khi cả nhóm tự gõ tên món (không có ảnh/dữ liệu món thật) -->
<div class="modal fade simple-result-modal" id="simpleResultModal" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered modal-sm">
    <div class="modal-content">
      <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-3" data-bs-dismiss="modal" aria-label="Đóng"></button>
      <div class="simple-result-banner">
        <div class="simple-result-confetti" aria-hidden="true"></div>
        <div class="simple-result-emoji-wrap"><span class="simple-result-emoji" aria-hidden="true">🎉</span></div>
      </div>
      <div class="modal-body text-center px-4 pb-4 pt-0">
        <p class="simple-result-kicker d-none" id="simpleResultNominator"></p>
        <h3 class="simple-result-name" id="simpleResultName"></h3>
        <div class="d-flex flex-column flex-sm-row gap-2 justify-content-center mt-4">
          <button type="button" class="btn btn-outline-brand rounded-pill" id="simpleResultRejectBtn"><i class="bi bi-arrow-counterclockwise"></i> Chưa vừa lòng</button>
          <button type="button" class="btn btn-brand rounded-pill" id="simpleResultAcceptBtn"><i class="bi bi-check-lg"></i> Chính nó rồi</button>
        </div>
      </div>
    </div>
  </div>
</div>
""" + result_modal_block()

EXTRA_SCRIPT = """<script src="js/widgets/sound.js"></script>
<script src="js/widgets/wheel.js"></script>
<script src="js/widgets/mystery-box.js"></script>
<script src="js/pages/goi-y.js"></script>"""

if __name__ == "__main__":
    html = page(
        "Gợi Ý Ngay | Hôm Nay Ăn Gì?",
        "Chọn món cho cả nhóm: mỗi người đề cử một món rồi quay vòng quay để chốt, hoặc lọc theo bữa, ngân sách và khẩu vị.",
        BODY, EXTRA_SCRIPT, gated=True
    )
    with open(os.path.join(OUT_DIR, "goi-y.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("goi-y.html:", len(html), "ky tu")
