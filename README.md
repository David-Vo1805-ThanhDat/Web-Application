# 🍜 Hôm Nay Ăn Gì?

Website gợi ý món ăn ngẫu nhiên theo bữa ăn, ngân sách, khẩu vị và chế độ ăn — giải quyết câu hỏi "Trưa nay ăn gì?" trong vài giây. Đây là đồ án môn học Web Application (Demo 2026), viết bằng **HTML5 + CSS3 + Bootstrap 5 + JavaScript thuần** (không cần build, không cần server).

## Tính năng

- **Vòng quay may mắn** (Canvas) luôn xoay nhẹ khi chưa quay, bấm vào là quay thật từ đúng góc đang xoay. Kèm **3 hộp bí ẩn**, hiệu ứng confetti và modal kết quả. Trang chủ cho chọn bữa (sáng/trưa/ăn vặt/tối) để vòng quay và danh sách gợi ý đi theo, mặc định theo giờ hiện tại.
- **Chọn món cùng cả nhóm** (trang Gợi ý ngay): trước khi quay, cả nhóm thấy hết các món và tick chọn hoặc bỏ bớt món không ai muốn. Có thêm tab "Cả nhóm đề cử": mỗi người chọn một món, món nào nhiều người chọn sẽ có nhiều ô hơn (dễ trúng hơn), kết quả ghi rõ người đề cử và có nút sao chép để gửi vào nhóm chat.
- **Gợi ý theo giờ**: tự nhận biết bữa sáng / trưa / xế chiều / tối / ăn đêm dựa trên giờ hiện tại.
- **Khám phá 31 món ăn** Việt Nam & quốc tế với tìm kiếm, lọc (bữa ăn, giá, khẩu vị, chế độ ăn, danh mục, vùng miền) và sắp xếp (đề xuất, giá, đánh giá, thời gian nấu, calo).
- **Chi tiết món ăn**: nguyên liệu, các bước nấu, dinh dưỡng, quán ăn gợi ý.
- **Món yêu thích** lưu bằng `localStorage`, có huy hiệu đếm trên thanh điều hướng.
- Giao diện responsive, có hỗ trợ bàn phím và chế độ giảm chuyển động.

## Chạy thử

Không cần cài đặt gì. Mở [index.html](index.html) bằng trình duyệt là dùng được.

Nếu muốn chạy qua server cục bộ (khuyên dùng để tránh một số giới hạn của `file://`):

```bash
# trong thư mục site_html
python -m http.server 8000
# rồi mở http://localhost:8000
```

> Cần có Internet: Bootstrap, Bootstrap Icons, AOS, canvas-confetti, Google Fonts được tải từ CDN, và ảnh món ăn lấy từ Unsplash.

## Các trang

| File | Nội dung |
| --- | --- |
| [index.html](index.html) | Trang chủ: hero (tiêu đề, gợi ý nhanh 1 món, thẻ vòng quay kèm chọn bữa), dải món chạy ngang, gợi ý theo bữa, bento danh mục, cách hoạt động |
| [goi-y.html](goi-y.html) | Gợi ý ngay, hai bước: **1. Chọn món** (bên trái) theo tiêu chí, tick tối đa 12 món, hoặc tab cả nhóm đề cử (`goi-y.html#nhom` mở thẳng tab này); **2. Quay để chốt** (bên phải, dính khi cuộn) bằng vòng quay hoặc hộp bí ẩn. Trên điện thoại vòng quay hiện trước và có thanh quay cố định ở đáy màn hình |
| [kham-pha.html](kham-pha.html) | Danh sách món, tìm kiếm/lọc/sắp xếp, tab "Yêu thích" |
| [chi-tiet-mon-an.html](chi-tiet-mon-an.html) | Chi tiết một món, nhận `?id=<id món>` |
| [gioi-thieu.html](gioi-thieu.html) | Giới thiệu dự án và nhóm |
| [lien-he.html](lien-he.html) | Form liên hệ / góp ý |

Tham số URL hữu ích: `kham-pha.html?tab=favorites`, `kham-pha.html?category=mon-nuoc`, `chi-tiet-mon-an.html?id=pho-bo-ha-noi`.

## Cấu trúc thư mục

```
site_html/
├── index.html, goi-y.html, kham-pha.html,
│   chi-tiet-mon-an.html, gioi-thieu.html, lien-he.html   ← 6 trang HTML (được sinh tự động)
├── css/style.css          ← giao diện chung (biến màu, navbar, thẻ món, modal, ...)
├── data/data.js           ← dữ liệu 31 món ăn (biến toàn cục `allFoods`)
├── js/
│   ├── data-utils.js      ← lọc/tìm/sắp xếp, random, bữa ăn hiện tại, định dạng giá, favorites
│   ├── main.js            ← dùng chung mọi trang: navbar, thẻ món, modal kết quả, toast
│   ├── wheel.js           ← vòng quay Canvas: createWheel(canvas, foods, onWinner, onStart, {exact, minItems})
│   ├── effects.js         ← hiệu ứng khi cuộn, chỉ dành cho trang chủ (xem bên dưới)
│   └── dice.js            ← 3 hộp bí ẩn
├── assets/images/         ← (đang trống, ảnh hiện dùng link Unsplash)
├── generate.py            ← khung dùng chung: <head>, navbar, footer, toast, modal, scripts
└── gen_*.py               ← mỗi file sinh ra một trang HTML tương ứng
```

### Chuyển động

Không có hiệu ứng nào phản ứng theo việc di chuyển chuột. Chuyển động gồm:

| Hiệu ứng | Nằm ở | Cách hoạt động |
| --- | --- | --- |
| Vòng quay xoay nhẹ | [js/wheel.js](js/wheel.js), mọi trang có vòng quay | Xoay liên tục khi chưa quay (~8°/giây). Tự dừng khi vòng quay ra khỏi màn hình hoặc tab bị ẩn. Bấm vào thì quay thật, bắt đầu từ đúng góc đang xoay |
| Thẻ hiện dần khi cuộn | [js/effects.js](js/effects.js), chỉ trang chủ | Phần tử có `data-reveal` trượt vào lần lượt (so le 90ms). Nội dung sinh bằng JS gọi `FX.stagger(container)` sau khi render |
| Dải món chạy ngang | Trang chủ (CSS) | Hai hàng chạy ngược chiều, dừng khi rê chuột vào |
| Thanh tiến độ cuộn | [js/effects.js](js/effects.js), chỉ trang chủ | Vạch ớt mỏng ở đầu trang |

Khi người dùng bật "giảm chuyển động" của hệ điều hành: vòng quay đứng yên (vẫn quay khi bấm, nhưng nhanh hơn), nội dung hiện ngay và dải món dừng lại (vẫn cuộn tay được).

### Thứ tự nhúng script

Các trang phải nhúng script đúng thứ tự vì chúng dùng biến/hàm toàn cục của nhau:

1. Bootstrap bundle → AOS → canvas-confetti (CDN)
2. `data/data.js` (khai báo `allFoods`)
3. `js/data-utils.js`
4. `js/main.js`
5. `js/wheel.js` / `js/dice.js` (chỉ trang nào dùng)

## Dữ liệu món ăn

Mỗi món trong [data/data.js](data/data.js) có dạng:

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

Để thêm món: thêm một object vào mảng `allFoods` với `id` duy nhất — trang khám phá, vòng quay và trang chi tiết sẽ tự nhận.

## Sinh lại các trang HTML

Các file `.html` được tạo bởi các script Python (chỉ dùng thư viện chuẩn, cần Python 3). Mỗi script tự tìm thư mục của chính nó nên chạy được từ bất kỳ đâu. Chỉ cần chạy lại khi sửa navbar/footer/bố cục trong `generate.py` hoặc `gen_*.py`; sửa CSS/JS/dữ liệu thì không cần.

```bash
python gen_index.py
python gen_goi_y.py
python gen_kham_pha.py
python gen_chi_tiet.py
python gen_gioi_thieu.py
python gen_lien_he.py
```

## Hệ thiết kế

Giao diện sáng và ấm: nền kem, cam là màu chính (gợi món nóng, kích thích thèm ăn), navy cho chữ, xanh lá chỉ để chấm phá. Toàn bộ token nằm ở đầu [css/style.css](css/style.css).

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
- **Chữ:** Inter cho toàn bộ trang (hỗ trợ đầy đủ dấu tiếng Việt), tải từ Google Fonts.
- **Vòng quay** (`js/wheel.js`): các ô cam, kem vàng, xanh ngọc, hồng đỏ, navy, đào; viền cam gradient. Màu nằm ở đầu file.
- **Thanh điều hướng** co gọn theo bề rộng (ẩn biểu tượng, khẩu hiệu, nút "Gợi Ý Ngay" khi hẹp) để không bao giờ ngắt chữ.
- **Tên biến cũ** (`--brand-*`, `--lam-*`, `--su`, `--paper`, `--ink`...) được giữ lại để các trang cũ chạy đúng; giá trị đã được ánh xạ sang bảng màu mới.
- **Các lớp Bootstrap** `bg-white`, `bg-light`, `text-dark` được ánh xạ về token trong phần 3 của `style.css`.
- **Thẻ món ăn** (`renderFoodCard` trong `js/main.js`) dùng chung ở mọi trang.
- Tôn trọng `prefers-reduced-motion` và có viền focus rõ cho bàn phím.

## Nhóm phát triển

| Vai trò | Phụ trách |
| --- | --- |
| Người A — Frontend | UI/UX, HTML/CSS, Bootstrap, AOS.js |
| Người B — Logic & Data | Data schema, lọc/tìm kiếm/random |
| Người C — Nội dung | Trang chi tiết, Giới thiệu, Liên hệ |

## Công nghệ

Bootstrap 5.3.3 · Bootstrap Icons 1.11.3 · AOS 2.3.4 · canvas-confetti 1.9.3 · Google Fonts (Inter) · Canvas API · localStorage
