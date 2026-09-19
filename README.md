# 🍜 Hôm Nay Bạn Muốn Ăn Gì?

Đồ án môn Web — Website gợi ý món ăn ngẫu nhiên theo bữa ăn, ngân sách, khẩu vị và chế độ ăn, giúp người dùng quyết định "hôm nay ăn gì" chỉ trong vài giây.

> Ghi chú: repo này ban đầu tạo từ template "DOM Manipulation & Event Handling" — đã đổi sang dự án thật của nhóm.

## 🎯 Ý tưởng

Mỗi ngày, việc quyết định ăn gì tốn không ít thời gian. Website này giải quyết đúng vấn đề đó bằng công cụ gợi ý ngẫu nhiên có tiêu chí, kết hợp giao diện đẹp và hiệu ứng động mượt mà.

## 🛠️ Công nghệ

**Giai đoạn 1 (hiện tại) — Frontend tối thiểu 5 trang:**

- HTML5 + CSS3 thuần
- Bootstrap 5 (grid, component nền, responsive)
- JavaScript thuần (vanilla JS) — random, lọc, validate form
- AOS.js — hiệu ứng xuất hiện khi cuộn trang
- Dữ liệu tạm trong `js/data.js` (chưa có database)

**Giai đoạn 2 (cuối kỳ) — Web hoàn chỉnh:**

- Backend: PHP
- Database: MySQL (dự kiến)
- Chuyển header/footer sang `include()`, dữ liệu chuyển vào database, thêm trang quản trị

## 👥 Thành viên & phân công (giai đoạn 5 trang)

| Thành viên  | Phụ trách                                                    |
| ----------- | ------------------------------------------------------------ |
| **Người A** | Trang chủ, Trang liên hệ, thiết lập chung (Bootstrap theme, CSS biến màu, Navbar/Footer, AOS) |
| **Người B** | Trang Gợi ý & Khám phá món ăn (tính năng lõi: random + lọc bằng JavaScript) |
| **Người C** | Trang chi tiết món ăn, Trang tin tức / cẩm nang ẩm thực      |

## 📄 5 trang bắt buộc nộp thầy (giai đoạn hiện tại)

1. Trang chủ — `index.html`
2. Trang Gợi ý & Khám phá món ăn — `goi-y-kham-pha.html`
3. Trang chi tiết món ăn — `chi-tiet-mon-an.html`
4. Trang tin tức / cẩm nang ẩm thực — `tin-tuc.html`
5. Trang liên hệ — `lien-he.html`

## 🚧 Trạng thái hiện tại

Đang dựng 5 trang HTML/CSS/JS/Bootstrap để nộp và demo cho giảng viên (điều kiện để được viết PHP ở giai đoạn sau).

## 📂 Cấu trúc thư mục

```
/index.html
/goi-y-kham-pha.html
/chi-tiet-mon-an.html
/tin-tuc.html
/lien-he.html
/css/style.css        → CSS dùng chung (biến màu, font, tuỳ biến Bootstrap)
/js/data.js            → Dữ liệu món ăn + tin tức mẫu
/js/main.js            → Logic random, lọc, xử lý form
/assets/images/        → Hình ảnh
```

⚠️ Lưu ý: vì chưa dùng PHP, Navbar và Footer phải **copy giống hệt nhau** ở cả 5 file HTML. Đến giai đoạn viết PHP sẽ gộp lại bằng `include 'header.php'` để tránh lặp code.

## 🔀 Git workflow (giai đoạn 3 ngày)

- Nhánh `main` — code ổn định.
- Nhánh riêng cho từng người: `feature/nguoi-a`, `feature/nguoi-b`, `feature/nguoi-c`.
- Commit & push tối thiểu 2 lần/ngày, pull code của nhau vào cuối ngày để tránh conflict — đặc biệt chú ý file `css/style.css` và Navbar/Footer vì cả 3 người cùng dùng chung.
