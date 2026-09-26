# -*- coding: utf-8 -*-
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from generate import page

BODY = """
<!-- Hero -->
<section class="text-white py-5 py-sm-5 position-relative overflow-hidden" style="background:var(--navy);">
  <div class="container text-center position-relative" style="max-width:48rem;" data-aos="fade-up">
    <span class="badge bg-white bg-opacity-10 border border-white-50 text-warning px-3 py-2 rounded-pill mb-3">
      <i class="bi bi-people"></i> Đồ Án Cuối Kỳ — Web Application 2026
    </span>
    <h1 class="fw-black display-5 mt-2">Về Dự Án <span style="color:var(--amber-400);">Hôm Nay Ăn Gì?</span></h1>
    <p class="text-white-50 mt-3">
      Ý tưởng xuất phát từ nỗi đau thực tế của sinh viên và dân văn phòng — mỗi ngày mất 15-30 phút chỉ để thống nhất
      "hôm nay ăn gì". Chúng mình xây dựng công cụ giải quyết đúng vấn đề đó!
    </p>
  </div>
</section>

<!-- Project Stats -->
<section class="container py-5" style="max-width:64rem;">
  <div class="row row-cols-2 row-cols-sm-4 g-3 g-sm-4" data-aos="fade-up">
    <div class="col"><div class="bg-white rounded-3xl-custom border p-3 p-sm-4 text-center shadow-sm h-100 stat-card">
      <div class="stat-icon" style="background:linear-gradient(135deg,#f97316,#f59e0b);">🍜</div>
      <div class="fw-black fs-4 text-gradient-food" id="statFoodCount">0+</div>
      <div class="small text-muted">Món ăn đặc sắc</div></div></div>
    <div class="col"><div class="bg-white rounded-3xl-custom border p-3 p-sm-4 text-center shadow-sm h-100 stat-card">
      <div class="stat-icon" style="background:linear-gradient(135deg,#3b82f6,#06b6d4);">🗺️</div>
      <div class="fw-black fs-4" style="color:var(--accent);">4</div>
      <div class="small text-muted">Vùng ẩm thực</div></div></div>
    <div class="col"><div class="bg-white rounded-3xl-custom border p-3 p-sm-4 text-center shadow-sm h-100 stat-card">
      <div class="stat-icon" style="background:linear-gradient(135deg,#10b981,#14b8a6);">⚡</div>
      <div class="fw-black fs-4" style="color:var(--la);">5s</div>
      <div class="small text-muted">Giây quyết định</div></div></div>
    <div class="col"><div class="bg-white rounded-3xl-custom border p-3 p-sm-4 text-center shadow-sm h-100 stat-card">
      <div class="stat-icon" style="background:linear-gradient(135deg,#f43f5e,#ec4899);">😋</div>
      <div class="fw-black fs-4" style="color:#e11d48;">100%</div>
      <div class="small text-muted">Hài lòng no nê</div></div></div>
  </div>
</section>

<!-- Team Members -->
<section class="container py-4" style="max-width:64rem;">
  <div class="text-center mb-4" data-aos="fade-up">
    <span class="badge bg-brand-subtle-custom text-brand-emphasis-custom px-3 py-1 rounded-pill small fw-bold text-uppercase">Nhóm Phát Triển</span>
    <h2 class="fw-extrabold mt-2">Những Người Đứng Sau Dự Án 👥</h2>
    <p class="text-muted small mb-0">Mỗi người một vai trò, cùng nhau xây dựng sản phẩm hoàn chỉnh trong thời hạn 3 ngày demo.</p>
  </div>

  <div class="row row-cols-1 row-cols-md-3 g-4" data-aos="fade-up">
    <div class="col">
      <div class="bg-white rounded-3xl-custom border overflow-hidden shadow-sm h-100 team-card">
        <div class="p-4 text-white" style="background:linear-gradient(to right,#8b5cf6,#7c3aed);">
          <div class="d-flex align-items-center gap-3">
            <div class="team-avatar">🎨</div>
            <div><h3 class="h5 fw-black mb-0">Người A</h3><p class="small text-white-50 mb-0">Frontend Developer &amp; UI/UX Designer</p></div>
          </div>
        </div>
        <div class="p-4">
          <ul class="list-unstyled d-flex flex-column gap-2 small mb-3">
            <li><i class="bi bi-palette text-muted"></i> Thiết kế giao diện (UI/UX)</li>
            <li><i class="bi bi-layers text-muted"></i> Responsive Layout cho mọi thiết bị</li>
            <li><i class="bi bi-stars text-muted"></i> Hiệu ứng cuộn trang với AOS.js</li>
            <li><i class="bi bi-code-slash text-muted"></i> Xây dựng giao diện HTML/CSS/Bootstrap</li>
          </ul>
          <blockquote class="border-start border-3 ps-3 small fst-italic text-muted mb-0" style="border-color:var(--brand-400) !important; background:var(--brand-50); border-radius:0 .75rem .75rem 0; padding:.5rem .75rem;">
            "Giao diện đẹp không chỉ để nhìn — mà để người dùng cảm thấy vui khi dùng mỗi ngày."
          </blockquote>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="bg-white rounded-3xl-custom border overflow-hidden shadow-sm h-100 team-card">
        <div class="p-4 text-white bg-gradient-brand">
          <div class="d-flex align-items-center gap-3">
            <div class="team-avatar">⚙️</div>
            <div><h3 class="h5 fw-black mb-0">Người B</h3><p class="small text-white-50 mb-0">Logic Developer, Data &amp; QA</p></div>
          </div>
        </div>
        <div class="p-4">
          <ul class="list-unstyled d-flex flex-column gap-2 small mb-3">
            <li><i class="bi bi-database text-muted"></i> Xây dựng data.js với 31+ món ăn</li>
            <li><i class="bi bi-code-slash text-muted"></i> Logic Filter / Search / Random</li>
            <li><i class="bi bi-bug text-muted"></i> Testing &amp; QA các tính năng</li>
            <li><i class="bi bi-git text-muted"></i> Deploy &amp; Git Workflow</li>
          </ul>
          <blockquote class="border-start border-3 ps-3 small fst-italic text-muted mb-0" style="border-color:var(--brand-400) !important; background:var(--brand-50); border-radius:0 .75rem .75rem 0; padding:.5rem .75rem;">
            "Dữ liệu tốt là nền tảng của mọi sản phẩm thông minh — rác vào thì rác ra!"
          </blockquote>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="bg-white rounded-3xl-custom border overflow-hidden shadow-sm h-100 team-card">
        <div class="p-4 text-white" style="background:linear-gradient(to right,#0ea5e9,#0369a1);">
          <div class="d-flex align-items-center gap-3">
            <div class="team-avatar">📝</div>
            <div><h3 class="h5 fw-black mb-0">Người C</h3><p class="small text-white-50 mb-0">Nội Dung &amp; Trang Chi Tiết</p></div>
          </div>
        </div>
        <div class="p-4">
          <ul class="list-unstyled d-flex flex-column gap-2 small mb-3">
            <li><i class="bi bi-file-text text-muted"></i> Nội dung trang Giới thiệu &amp; Liên hệ</li>
            <li><i class="bi bi-card-list text-muted"></i> Trang Chi Tiết Món Ăn</li>
            <li><i class="bi bi-chat-square-text text-muted"></i> Biên tập mô tả, công thức món ăn</li>
            <li><i class="bi bi-clipboard-check text-muted"></i> Kiểm thử nội dung &amp; báo cáo</li>
          </ul>
          <blockquote class="border-start border-3 ps-3 small fst-italic text-muted mb-0" style="border-color:var(--brand-400) !important; background:var(--brand-50); border-radius:0 .75rem .75rem 0; padding:.5rem .75rem;">
            "Nội dung rõ ràng, dễ hiểu chính là cầu nối giữa sản phẩm và người dùng."
          </blockquote>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Tech Stack -->
<section class="container py-4" style="max-width:64rem;">
  <div class="rounded-3xl-custom p-4 p-sm-5 text-white" style="background:var(--navy);" data-aos="fade-up">
    <h2 class="h4 fw-extrabold text-center text-warning mb-4">🛠️ Công Nghệ Được Sử Dụng</h2>
    <div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 g-3">
      <div class="col"><div class="tech-card"><div class="fs-3 mb-1">🌐</div><div class="fw-bold small">HTML5</div><div class="text-white-50" style="font-size:.7rem;">Cấu trúc trang</div></div></div>
      <div class="col"><div class="tech-card"><div class="fs-3 mb-1">🎨</div><div class="fw-bold small">CSS3</div><div class="text-white-50" style="font-size:.7rem;">Giao diện &amp; hiệu ứng</div></div></div>
      <div class="col"><div class="tech-card"><div class="fs-3 mb-1">🅱️</div><div class="fw-bold small">Bootstrap 5</div><div class="text-white-50" style="font-size:.7rem;">Layout &amp; component</div></div></div>
      <div class="col"><div class="tech-card"><div class="fs-3 mb-1">⚡</div><div class="fw-bold small">JavaScript (ES6)</div><div class="text-white-50" style="font-size:.7rem;">Xử lý logic, tương tác</div></div></div>
      <div class="col"><div class="tech-card"><div class="fs-3 mb-1">✨</div><div class="fw-bold small">AOS.js</div><div class="text-white-50" style="font-size:.7rem;">Animate On Scroll</div></div></div>
      <div class="col"><div class="tech-card"><div class="fs-3 mb-1">🎡</div><div class="fw-bold small">Canvas API</div><div class="text-white-50" style="font-size:.7rem;">Vòng quay may mắn</div></div></div>
      <div class="col"><div class="tech-card"><div class="fs-3 mb-1">🎉</div><div class="fw-bold small">canvas-confetti</div><div class="text-white-50" style="font-size:.7rem;">Hiệu ứng ăn mừng</div></div></div>
      <div class="col"><div class="tech-card"><div class="fs-3 mb-1">🎯</div><div class="fw-bold small">Bootstrap Icons</div><div class="text-white-50" style="font-size:.7rem;">Bộ icon giao diện</div></div></div>
    </div>
    <p class="text-center small text-white-50 mt-4 mb-0">
      Giai đoạn 2 (cuối kỳ): nâng cấp Backend bằng <strong class="text-white">PHP + MySQL</strong> để lưu dữ liệu động và xử lý phía server.
    </p>
  </div>
</section>

<!-- FAQ -->
<section class="container py-5" style="max-width:48rem;">
  <div class="text-center mb-4" data-aos="fade-up">
    <h2 class="fw-extrabold">Câu Hỏi Thường Gặp ❓</h2>
    <p class="text-muted small mb-0">Giải đáp những thắc mắc phổ biến nhất về website và dự án.</p>
  </div>
  <div class="accordion" id="faqAccordion" data-aos="fade-up">
    <div class="accordion-item rounded-3xl-custom mb-2 border">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed rounded-3xl-custom" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
          Dữ liệu món ăn trong website có chính xác không?
        </button>
      </h2>
      <div id="faq1" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
        <div class="accordion-body small text-muted">
          Dữ liệu 31+ món ăn trong website được nhóm nghiên cứu và tổng hợp từ nhiều nguồn ẩm thực uy tín tại Việt Nam.
          Giai đoạn demo dùng dữ liệu mock tĩnh,
          phiên bản cuối kỳ sẽ kết nối cơ sở dữ liệu MySQL qua PHP.
        </div>
      </div>
    </div>
    <div class="accordion-item rounded-3xl-custom mb-2 border">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed rounded-3xl-custom" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
          Vòng quay may mắn hoạt động như thế nào?
        </button>
      </h2>
      <div id="faq2" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
        <div class="accordion-body small text-muted">
          Vòng quay sử dụng thuật toán ngẫu nhiên dựa trên bộ lọc tiêu chí bạn chọn (bữa ăn, ngân sách, khẩu vị, chế độ ăn).
          Chỉ những món đáp ứng đủ tiêu chí mới xuất hiện trên vòng quay — đảm bảo kết quả luôn phù hợp với mong muốn của bạn.
        </div>
      </div>
    </div>
    <div class="accordion-item rounded-3xl-custom mb-2 border">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed rounded-3xl-custom" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
          Tôi có thể lưu món ăn yêu thích ở đâu?
        </button>
      </h2>
      <div id="faq3" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
        <div class="accordion-body small text-muted">
          Nhấn biểu tượng ❤️ trên bất kỳ thẻ món ăn nào để lưu vào danh sách yêu thích. Dữ liệu được lưu cục bộ trong
          trình duyệt (localStorage) — không cần đăng nhập và hoạt động offline. Xem lại tại trang Khám Phá &gt; Tab "Đã Lưu Yêu Thích".
        </div>
      </div>
    </div>
    <div class="accordion-item rounded-3xl-custom mb-2 border">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed rounded-3xl-custom" type="button" data-bs-toggle="collapse" data-bs-target="#faq4">
          Website có hỗ trợ tìm kiếm theo nguyên liệu không?
        </button>
      </h2>
      <div id="faq4" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
        <div class="accordion-body small text-muted">
          Có! Thanh tìm kiếm trên trang Khám Phá cho phép bạn tìm theo tên món ăn, tên nguyên liệu (ví dụ: "bò", "tôm",
          "đậu hũ"), khẩu vị hay mô tả món ăn. Kết quả được cập nhật ngay khi bạn gõ chữ.
        </div>
      </div>
    </div>
    <div class="accordion-item rounded-3xl-custom mb-2 border">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed rounded-3xl-custom" type="button" data-bs-toggle="collapse" data-bs-target="#faq5">
          Kế hoạch phát triển tiếp theo của dự án là gì?
        </button>
      </h2>
      <div id="faq5" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
        <div class="accordion-body small text-muted">
          Sau giai đoạn demo 5 trang, nhóm sẽ tiếp tục: (1) Viết Backend bằng PHP + MySQL, (2) Trang đăng nhập/đăng ký,
          (3) Lưu yêu thích &amp; lịch sử chọn món theo tài khoản, (4) Trang quản trị (thêm/sửa/xoá món ăn), (5) Hoàn thiện báo cáo đồ án cuối kỳ.
        </div>
      </div>
    </div>
  </div>
</section>
"""

EXTRA_SCRIPT = """<style>
.stat-card,.team-card{transition:.2s;}
.stat-card:hover,.team-card:hover{transform:translateY(-3px);box-shadow:0 10px 24px rgba(0,0,0,.08);}
.stat-icon{width:3.2rem;height:3.2rem;border-radius:1rem;display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin:0 auto .6rem;color:#fff;}
.team-avatar{width:4rem;height:4rem;border-radius:1rem;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:2rem;border:1px solid rgba(255,255,255,.3);}
.tech-card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:1rem;padding:1rem;}
.bg-brand-subtle-custom{background:var(--brand-50);}
.text-brand-emphasis-custom{color:var(--brand-700);}
</style>
<script>
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('statFoodCount').textContent = allFoods.length + '+';
});
</script>"""

if __name__ == "__main__":
    html = page(
        "Giới Thiệu Dự Án | Hôm Nay Bạn Muốn Ăn Gì?",
        "Câu chuyện, đội ngũ phát triển và công nghệ đứng sau website gợi ý món ăn Hôm Nay Bạn Muốn Ăn Gì?",
        BODY, EXTRA_SCRIPT
    )
    with open(os.path.join(HERE, "gioi-thieu.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("gioi-thieu.html:", len(html), "ky tu")
