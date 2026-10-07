# 🍜 Hôm Nay Ăn Gì?

Website gợi ý món ăn ngẫu nhiên theo bữa ăn, ngân sách, khẩu vị và chế độ ăn — giải quyết câu hỏi "Trưa nay ăn gì?" trong vài giây. Đây là đồ án môn học Web Application (Demo 2026), viết bằng **HTML5 + CSS3 + Bootstrap 5 + JavaScript thuần** (trang tĩnh, dùng script Python để sinh HTML).

Vào web lần đầu sẽ thấy **trang giới thiệu công khai** ([index.html](frontend/.html)) với poster món ăn chạy ngang; phải **đăng nhập/đăng ký** (xem mục bên dưới) mới vào được **Trang Chủ** thật và các trang còn lại (Gợi ý ngay, Khám phá, Chi tiết, Giới thiệu, Liên hệ).

## Tính năng

- **Trang ngoài công khai** ([index.html](frontend/.html)): poster món ăn chạy ngang, giới thiệu tính năng, ba bước bắt đầu, cảm nhận người dùng và lời gọi đăng ký — ai cũng xem được, không cần đăng nhập.
- **Đăng nhập / Đăng ký thật** ([dang-nhap.html](frontend/user/dang-nhap.html), [dang-ky.html](frontend/user/dang-ky.html)): tài khoản nằm ở backend PHP (mật khẩu băm, phiên PHP); vai trò người dùng / quản trị do server quyết định. Đăng nhập xong tự vào đúng giao diện (Trang chủ hoặc Bảng quản trị).
- **Vòng quay may mắn** (Canvas) luôn xoay nhẹ khi chưa quay, bấm vào là quay thật từ đúng góc đang xoay. Kèm hiệu ứng confetti và modal kết quả. Trang chủ cho chọn bữa (sáng/trưa/ăn vặt/tối) để vòng quay và danh sách gợi ý đi theo, mặc định theo giờ hiện tại.
- **Chọn món cùng cả nhóm** (trang Gợi ý ngay): trước khi quay, cả nhóm thấy hết các món và tick chọn hoặc bỏ bớt món không ai muốn. Có thêm tab "Cả nhóm đề cử": mỗi người tự gõ tên một món mình muốn ăn (món gì cũng được, không cần có sẵn trong thực đơn) — món nào được nhiều người gõ sẽ có nhiều ô hơn (dễ trúng hơn). Quay/mở hộp trúng món nào thì hiện tên món + ai đề cử, kèm 2 lựa chọn "Chưa vừa lòng" (quay/mở tiếp) hoặc "Chính nó rồi" (chốt).
- **Hộp quà bí ẩn** (thay cho đập niêu/hộp bí ẩn kiểu cũ): có bao nhiêu món đang so tài thì có bấy nhiêu hộp quà (tự vẽ 100% bằng CSS/SVG, không dùng ảnh chụp nên luôn sắc nét), bấm hộp nào thì hộp đó phóng to giữa màn hình, nền tối lại lấy tiêu điểm, hộp rung háo hức rồi nắp bật tung (kèm âm thanh mở hộp tổng hợp bằng Web Audio, không cần file âm thanh ngoài) toé sáng ấm rồi mới hiện món trúng. Hộp đã mở thì không mở lại được (không hồi phục), nhưng hộp khác vẫn mở tiếp được nếu cả nhóm chưa ưng món vừa ra; có nút "Đổi hộp mới" khi muốn làm mới toàn bộ.
- **Theo tiêu chí** (trang Gợi ý ngay): quay trúng món nào thì hiện thẻ kết quả đầy đủ (ảnh, công thức, quán ăn...) như trước; nếu bấm "Quay lại" thì món đó bị loại khỏi vòng quay/hộp trong phiên đang xem (mờ đi trong danh sách), tránh trúng lại đúng món vừa từ chối.
- **Gợi ý theo giờ**: tự nhận biết bữa sáng / trưa / xế chiều / tối / ăn đêm dựa trên giờ hiện tại.
- **Khám phá 31 món ăn** Việt Nam & quốc tế với tìm kiếm, lọc (bữa ăn, giá, khẩu vị, chế độ ăn, danh mục, vùng miền) và sắp xếp (đề xuất, giá, đánh giá, thời gian nấu, calo).
- **Chi tiết món ăn**: nguyên liệu, các bước nấu, dinh dưỡng, quán ăn gợi ý (mỗi quán có link "Chỉ đường"), và khu **"Nấu thử món này"**: người dùng đã nấu thử phản hồi **từng nguyên liệu** (vừa đủ / nên giảm / nên tăng), vị sau khi nấu, độ khó, thời gian và có hợp khẩu vị không — để biết công thức và định lượng có chuẩn không. Số tổng hợp ("82% thấy vừa đủ", "Nhiều người giảm bớt…") chỉ hiện khi đã có từ 5 lượt nấu thử. Ghi chú riêng của từng người chỉ quản trị viên đọc. (Đã thay khu đánh giá sao + nhận xét cũ. Cần backend có API `recipe.*` — xem `backend/HANDOFF.md` mục P0; chưa có thì khu này tự ẩn.)
- **Âm thanh vòng quay**: tiếng "tách" mỗi khi một ô đi qua mũi tên (thưa dần khi vòng quay chậm lại) và "ting-ting" khi dừng, tạo bằng Web Audio nên không cần file âm thanh. Có nút loa cạnh vòng quay để tắt/bật; lựa chọn được nhớ trên thiết bị (tắt loa cũng tắt tiếng pháo giấy).
- **Liên kết Google Maps**: ở hộp thoại kết quả quay và trang chi tiết có nút "Tìm quán trên Google Maps" — mở Google Maps với ô tìm kiếm đã tự điền đúng tên món. Google Maps tự dùng vị trí của người dùng nên **không cần xin quyền vị trí trước**; nút phụ "Ưu tiên quán gần vị trí của tôi" chỉ xin quyền khi người dùng chủ động bấm (bị từ chối thì vẫn mở Maps bình thường).
- **Danh mục món ăn theo backend**: bộ lọc Khám phá, ô bento Trang chủ, nhãn thẻ món đọc danh sách danh mục từ backend (`allCategories`, xem `backend/HANDOFF.md` mục 15); chưa có thì dùng 7 danh mục mặc định.
- **Món yêu thích, hồ sơ sức khỏe, nhật ký, thực đơn tuần, nhóm bạn** lưu theo tài khoản trên server (đăng nhập ở máy khác vẫn còn); `localStorage` chỉ là bản sao để trang chạy nhanh. Có huy hiệu đếm món yêu thích trên thanh điều hướng.
- Giao diện responsive, có hỗ trợ bàn phím và chế độ giảm chuyển động.

## Chạy thử

Web cần **backend PHP**: món ăn, đăng nhập và dữ liệu người dùng đều do [backend/](backend/README.md) cấp — mở thẳng file `.html` (`file://`) sẽ chỉ thấy thông báo lỗi kết nối. Hai cách chạy:

1. **XAMPP** (khuyên dùng): đổi cổng Apache nếu cổng 80 bị chiếm, trỏ `DocumentRoot` vào thư mục dự án, bấm Start, mở `http://localhost:8080/frontend/` (theo cổng bạn đặt). Chi tiết ở [backend/README.md](backend/README.md).
2. **Không cần Apache** (để thử nhanh): chạy ở thư mục gốc dự án

```bash
C:\xampp\php\php.exe -S 127.0.0.1:8099 -t .
# rồi mở http://127.0.0.1:8099/frontend/
```

Tài khoản mẫu: quản trị `admin@homnayangi.vn` / `admin123`; người dùng `nguyenvana@gmail.com` / `123456`; hoặc tự đăng ký (mật khẩu ≥ 6 ký tự).

### Đăng nhập / đăng ký

- Đăng nhập/đăng ký gọi `backend/api/auth` ([js/core/backend.js](frontend/user/js/core/backend.js)); server trả vai trò và tạo phiên PHP. Trình duyệt chỉ lưu tên/email/vai trò trong `localStorage` (khoá `hom_nay_an_gi_user`, xem [js/core/auth.js](frontend/user/js/core/auth.js)) để vẽ giao diện — **quyền truy cập luôn do server kiểm tra lại** ở mỗi lời gọi API.
- 6 trang "cần đăng nhập" tự chặn ngay trong `<head>` (script chặn do `tools/build/generate.py` chèn khi gọi `page(..., gated=True)`): chưa đăng nhập thì chuyển về `dang-nhap.html?next=<trang đang định vào>`, đăng nhập xong quay lại đúng trang đó.
- **Đồng bộ dữ liệu người dùng** ([js/core/sync.js](frontend/user/js/core/sync.js)): sau khi đăng nhập, yêu thích / hồ sơ sức khỏe / nhật ký / lịch sử món / thực đơn tuần / nhóm bạn được kéo từ server xuống; mỗi lần trang ghi các dữ liệu này, tự đẩy lên server sau ~0,3 giây. Đăng xuất sẽ gửi nốt thay đổi còn chờ rồi xoá dữ liệu người dùng khỏi trình duyệt (máy dùng chung không lộ dữ liệu). Nếu server chưa có gì mà trình duyệt đang có dữ liệu từ trước thì dữ liệu đó được chuyển lên tài khoản một lần.
- Nút "Đăng xuất" nằm trong menu người dùng trên navbar (chỉ hiện khi đã đăng nhập).
- **Liên hệ & góp ý** (trang ngoài) gửi vào backend; quản trị viên xem/phản hồi ở trang "Đánh giá & góp ý". **Đánh giá món** viết ở trang chi tiết món (cần đăng nhập), hiện công khai và tính vào điểm món sau khi quản trị viên duyệt.

## Cấu trúc thư mục

```
hom-nay-an-gi/
├── frontend/                    ← mọi thứ chạy trên trình duyệt (deploy thư mục này; index.html ở đây chuyển vào user/)
│   ├── user/                    ← WEB NGƯỜI DÙNG
│   │   ├── *.html               ← các trang (file SINH RA bởi tools/build/pages, đừng sửa tay)
│   │   ├── css/
│   │   │   ├── base/            ← tokens.css (màu, font), base.css (nền tảng, ghi đè Bootstrap), responsive.css, motion.css
│   │   │   ├── components/      ← buttons, navbar, footer, sections, food-card, chips, wheel, modal-result, gift-box
│   │   │   └── pages/           ← home, goi-y, landing, auth, account, health, detail, explore (thứ tự nạp: CSS_FILES trong tools/build/generate.py)
│   │   ├── js/
│   │   │   ├── core/            ← data-utils (lọc/tìm/random), health (BMI, thực đơn tuần, nhật ký), main (navbar, thẻ món, modal), auth (đăng nhập demo)
│   │   │   ├── widgets/         ← wheel (vòng quay Canvas), mystery-box (hộp quà), effects (hiệu ứng cuộn)
│   │   │   └── pages/           ← logic riêng của từng trang (goi-y.js, kham-pha.js, ...)
│   │   └── assets/
│   ├── admin/                   ← BẢNG QUẢN TRỊ, có css/ js/ assets/ riêng (xem mục "Bảng quản trị" bên dưới)
├── backend/                     ← PHP + MySQL trên máy tính (xem backend/README.md): api/ → src/{Controllers,Services,Repositories} → storage. Người làm backend đọc [backend/HANDOFF.md](backend/HANDOFF.md)
│   ├── data/foods/              ← dữ liệu món ăn GỐC (mỗi danh mục 1 file JSON + _order.json) — chỉ dùng để khởi tạo CSDL lần đầu
│   ├── scripts/                 ← export_seed.js (sinh data/seed), seed/ (bộ sinh dữ liệu mẫu), import_json_to_mysql.php
│   ├── api/                     ← endpoint PHP: admin/ (bảng quản trị), auth/ (đăng nhập), user/ (dữ liệu người dùng), public/ (món ăn, góp ý, đánh giá công khai)
│   ├── src/  config/  database/ ← mã nguồn chia lớp, cấu hình, schema.sql (MySQL)
│   └── data/seed/               ← dữ liệu mẫu khởi tạo CSDL (sinh bằng scripts/export_seed.js)
├── tools/
│   ├── build/                   ← build.py chạy tất cả; generate.py (khung dùng chung); pages/*.py (mỗi file sinh một trang)
│   ├── tests/                   ← kiểm thử tự động Playwright (node tools/tests/<tên>.js)
│   └── node_modules/            ← playwright (chỉ để chạy tests)
└── archive/                     ← file cũ giữ lại phòng cần khôi phục (giới thiệu/liên hệ cũ, style.css cũ)
```

## Bảng quản trị (admin)

Đăng nhập bằng `admin@homnayangi.vn` / `admin123` ở trang đăng nhập — tự chuyển vào bảng quản trị (`frontend/admin/dashboard.html`). Thiết kế theo file Figma "Admin Web"; toàn bộ dữ liệu lấy từ backend PHP và lưu trên MySQL của máy tính. Số liệu tính từ dữ liệu thật của dự án.

```
frontend/admin/
├── *.html                       ← 11 trang (SINH RA bởi tools/build/admin, đừng sửa tay):
│                                  dashboard, thong-ke, mon-an, mon-an-sua (?id= / ?new=1), danh-muc,
│                                  quan-an, cong-thuc (chất lượng công thức: phản hồi nấu thử), nguoi-dung, danh-gia (góp ý liên hệ), cai-dat, nhat-ky
├── css/
│   ├── base/                    ← tokens.css (màu/kích thước --ad-*), base.css
│   ├── layout/                  ← shell, sidebar, topbar, page-header, mobile (drawer + thanh tab dưới)
│   ├── components/              ← buttons, cards, badges, forms, table, modal, toast, charts, lists...
│   └── pages/                   ← mỗi trang một file (foods, food-edit, taxonomy, users, restaurants, reviews, stats, settings, audit, dashboard)
├── js/
│   ├── core/                    ← config, api (Api.call → backend PHP), dom, format, download, audit-types, layout (sidebar, tìm nhanh, đăng xuất)
│   ├── components/              ← toast, modal, pagination, table (chọn nhiều), charts (tự vẽ), dropdown
│   └── pages/                   ← logic từng trang
└── assets/icons/                ← icon SVG lấy từ Figma
```

- **Dữ liệu**: admin KHÔNG chứa dữ liệu nào. Mọi trang chỉ gọi `Api.call('<hành động>', {tham số})` → API PHP ở [backend/](backend/README.md) (danh sách hành động ở đó). Không có backend thì trang báo lỗi kết nối rõ ràng.
- **Quyền**: trang admin chặn ngay trong `<head>` (chưa đăng nhập → trang đăng nhập; không phải admin → trang chủ) và **server kiểm tra quyền admin cho từng lời gọi API** (không phải admin → 403).
- **Đặt lại dữ liệu demo**: Cài đặt → Vùng nguy hiểm → "Xoá toàn bộ dữ liệu demo".
- Kiểm thử: `node tools/tests/run.js admin-overflow` (lỗi console + tràn ngang ở 4 độ rộng), `node tools/tests/run.js admin-e2e-http` (luồng đăng nhập/lưu món/hết phiên); chụp màn hình: `node tools/tests/admin-shot.js <trang.html> <ảnh.png> [rộng cao]` (cần server đang chạy).

### Chuyển động

Không có hiệu ứng nào phản ứng theo việc di chuyển chuột. Chuyển động gồm:

| Hiệu ứng | Nằm ở | Cách hoạt động |
| --- | --- | --- |
| Vòng quay xoay nhẹ | [js/widgets/wheel.js](frontend/user/js/widgets/wheel.js), mọi trang có vòng quay | Xoay liên tục khi chưa quay (~8°/giây). Tự dừng khi vòng quay ra khỏi màn hình hoặc tab bị ẩn. Bấm vào thì quay thật, bắt đầu từ đúng góc đang xoay |
| Thẻ hiện dần khi cuộn | [js/widgets/effects.js](frontend/user/js/widgets/effects.js), trang ngoài + trang chủ | Phần tử có `data-reveal` trượt vào lần lượt (so le 90ms). Nội dung sinh bằng JS gọi `FX.stagger(container)` sau khi render |
| Dải món/poster chạy ngang | Trang ngoài + trang chủ (CSS) | Hai hàng chạy ngược chiều, dừng khi rê chuột vào |
| Thanh tiến độ cuộn | [js/widgets/effects.js](frontend/user/js/widgets/effects.js), trang ngoài + trang chủ | Vạch ớt mỏng ở đầu trang |

Khi người dùng bật "giảm chuyển động" của hệ điều hành: vòng quay đứng yên (vẫn quay khi bấm, nhưng nhanh hơn), nội dung hiện ngay và dải món/poster dừng lại (vẫn cuộn tay được).

### Thứ tự nhúng script

Các trang phải nhúng script đúng thứ tự vì chúng dùng biến/hàm toàn cục của nhau (khung này do `scripts_block()` trong `tools/build/generate.py` sinh ra):

1. Bootstrap bundle → AOS → canvas-confetti (CDN)
2. `../../backend/api/public/foods.php` (backend phát ra `const allFoods = [...]`; nếu không tải được sẽ hiện thanh báo lỗi đỏ)
3. `js/core/data-utils.js` → `js/core/health.js` → `js/core/main.js` → `js/core/backend.js` → `js/core/sync.js` → `js/core/auth.js`
4. `js/widgets/*.js` (chỉ trang nào dùng: wheel, mystery-box, effects)
5. `js/pages/<trang>.js` (logic riêng của trang)

## Dữ liệu món ăn

Món ăn do **backend** quản lý: thêm/sửa/ẩn/xoá ở Bảng quản trị (trang Món ăn) và có hiệu lực ngay trên web người dùng, vì mọi trang nạp `allFoods` từ `backend/api/public/foods.php` (chỉ món đang "hiển thị"). [backend/data/foods/](backend/data/foods/) (mỗi danh mục một file JSON) chỉ là **dữ liệu khởi tạo**: `node backend/scripts/export_seed.js` gộp chúng thành `backend/data/seed/`, rồi backend nạp vào `backend/storage/` lần chạy đầu — sửa file gốc không làm đổi dữ liệu đang chạy trừ khi xoá `backend/storage/`. Mỗi món có dạng:

```js
{
  id: "pho-bo-ha-noi",
  name: "Phở Bò Hà Nội", englishName: "Hanoi Beef Noodle Soup", description: "...",
  category: "mon-nuoc",            // mon-nuoc | com | cuon-tron | an-vat | lau-nuong | chay | trang-mieng
  mealType: ["sang", "trua"],      // sang | trua | toi | an-vat
  price: 55000, priceRange: "30k - 60k",
  taste: ["thanh-dam"], dietary: ["normal"],
  region: "Bắc",                   // Bắc | Trung | Nam | Quốc tế
  cookTimeMinutes: 45, calories: 480, rating: 4.9, reviewCount: 128,
  image: "https://...", tags: ["Phổ biến"], popular: true,
  nutrition: { protein: 32, carbs: 65, fat: 12 },
  ingredients: [{ name: "Bánh phở tươi", amount: "200g" }],
  instructions: ["..."],
  suggestedRestaurants: [{ name, address, city, priceEstimate }]
}
```

Thêm món: dùng Bảng quản trị → Món ăn → "Thêm món mới", dữ liệu được lưu vào MySQL. Muốn thêm vào seed: thêm object có `id` duy nhất vào file JSON của danh mục trong `backend/data/foods/`, thêm `id` vào `_order.json`, chạy lại `export_seed.js`; seed dùng cho database mới hoặc thao tác chủ động đặt lại demo.

## Build (sinh lại dữ liệu và các trang HTML)

Các file `.html` được sinh bởi script Python (chỉ dùng thư viện chuẩn, cần Python 3). Từ thư mục gốc dự án:

```bash
python tools/build/build.py                  # build mọi trang (người dùng + admin)
python tools/build/pages/kham_pha.py         # chỉ build một trang
node backend/scripts/export_seed.js           # sinh lại seed, dùng cho database mới hoặc thao tác đặt lại demo
```

Sửa nội dung/khung một trang → sửa `tools/build/pages/<trang>.py` (khung HTML) hoặc `frontend/user/js/pages/<trang>.js` (logic), rồi build lại. Khung chung (head, navbar, footer, danh sách CSS) nằm ở `tools/build/generate.py`.

## Kiểm thử

Test chạy với backend PHP thật: `run.js` dựng `php -S` với thư mục dữ liệu **tạm** cho từng test (không đụng dữ liệu thật) rồi tắt.

```bash
node tools/tests/run.js                  # chạy tất cả
node tools/tests/run.js backend-api      # (test nằm ở backend/tests/) 109 kiểm tra API (phân quyền, số liệu, CRUD, đăng ký, góp ý, đánh giá, dữ liệu người dùng)
node tools/tests/run.js links health     # chỉ chạy vài test: rà liên kết, luồng hồ sơ sức khỏe...
```
Các test giao diện: links, responsive, health, food-detail, explore-filters, gift-box, gift-box-group, nav-scrollspy, **user-sync** (đồng bộ 2 trình duyệt), **user-offline** (mất kết nối backend), **categories** (danh mục động), **wheel-sound-maps** (âm thanh vòng quay + Google Maps), **admin-overflow**, **admin-e2e-http**, **admin-states** (trạng thái đang tải/lỗi của admin), **cook-feedback** + **admin-recipes** (phản hồi nấu thử — chạy bằng bản giả lập trong `tools/tests/recipe-mock.js` vì backend chưa có API; `REAL_API=1` để chạy với backend thật). Cần đã build (`python tools/build/build.py`).

## Hệ thiết kế

Giao diện sáng và ấm: nền kem, cam là màu chính (gợi món nóng, kích thích thèm ăn), navy cho chữ, xanh lá chỉ để chấm phá. Toàn bộ token nằm ở đầu [css/base/tokens.css](css/base/tokens.css).

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `--bg` | `#FFF9F1` | Nền trang (kem ấm) |
| `--surface` / `--surface-2` | `#FFFFFF` / `#FFF6EA` | Thẻ, panel / ô nhập, nền nhạt |
| `--text` / `--text-2` / `--text-3` | `#1F2A44` / `#4A5470` / `#687189` | Chữ chính, phụ, mờ (navy) |
| `--orange-500/600/700` | `#F97316` / `#EA580C` / `#C2410C` | Màu chính, liên kết, mục đang chọn |
| `--grad` | cam đậm → cam sáng | Nút chính, mục đang chọn, số bước |
| `--la` | `#15A34A` | Chấm phá xanh lá (chỉ số "100%", tick) |
| `--navy` | `#1F2A44` | Chân trang, phần đầu trang Giới thiệu |

- **Trang chủ:** phần đầu (thanh điều hướng + hero hai cột với thẻ "Vòng quay may mắn") theo thiết kế gốc; các phần bên dưới (dải món chạy ngang, gợi ý theo bữa, bento danh mục, ba bước, băng kêu gọi) giữ nguyên bố cục, chỉ đổi màu theo nền mới.
- **Thanh điều hướng có 2 kiểu** (`navbar(mode)` trong `tools/build/generate.py`): `"app"` — menu đầy đủ + chip tên người dùng, dùng cho 6 trang cần đăng nhập; `"public"` — chỉ logo và hai nút Đăng nhập/Đăng ký, dùng cho trang ngoài và trang đăng nhập/đăng ký.
- **Trang ngoài** dùng chung khung `.hero`/`.steps`/`.cta-band` với trang chủ nhưng thêm dải **poster món ăn** lớn hơn (`.poster-strip`, cùng cơ chế chạy ngang với dải món ở trang chủ) và các thẻ `.feature-card` / `.quote-card`.
- **Trang đăng nhập/đăng ký** dùng bố cục 2 cột `.auth-shell`: thẻ form trắng bên trái, mảng gradient cam giới thiệu bên phải.
- **Chữ:** Inter cho toàn bộ trang (hỗ trợ đầy đủ dấu tiếng Việt), tải từ Google Fonts.
- **Vòng quay** (`js/widgets/wheel.js`): các ô cam, kem vàng, xanh ngọc, hồng đỏ, navy, đào; viền cam gradient. Màu nằm ở đầu file.
- **Thanh điều hướng** co gọn theo bề rộng (ẩn biểu tượng, khẩu hiệu, nút "Gợi Ý Ngay" khi hẹp) để không bao giờ ngắt chữ.
- **Tên biến cũ** (`--brand-*`, `--lam-*`, `--su`, `--paper`, `--ink`...) được giữ lại để các trang cũ chạy đúng; giá trị đã được ánh xạ sang bảng màu mới.
- **Các lớp Bootstrap** `bg-white`, `bg-light`, `text-dark` được ánh xạ về token trong `css/base/base.css`.
- **Thẻ món ăn** (`renderFoodCard` trong `js/core/main.js`) dùng chung ở mọi trang.
- Tôn trọng `prefers-reduced-motion` và có viền focus rõ cho bàn phím.

## Nhóm phát triển

| Vai trò | Phụ trách |
| --- | --- |
| Người A — Frontend | UI/UX, HTML/CSS, Bootstrap, AOS.js |
| Người B — Logic & Data | Data schema, lọc/tìm kiếm/random |
| Người C — Nội dung | Trang chi tiết, Giới thiệu, Liên hệ |

## Công nghệ

Bootstrap 5.3.3 · Bootstrap Icons 1.11.3 · AOS 2.3.4 · canvas-confetti 1.9.3 · Google Fonts (Inter) · Canvas API · localStorage
