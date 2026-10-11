# 🍜 Hôm Nay Ăn Gì?

Website gợi ý món ăn: vòng quay may mắn, hộp quà bí ẩn, chọn món cùng cả nhóm, khám phá thực đơn theo danh mục, thực đơn và nhật ký sức khỏe, trợ lý **FoodBot** (AI Gemini), bảng quản trị món/quán/người dùng.

- **Frontend:** HTML + CSS + Bootstrap 5 + JavaScript thuần. Trang HTML được **sinh bằng Python** (`tools/build/`).
- **Backend:** PHP 8 (chạy trên Apache của XAMPP) + **MySQL** — nguồn dữ liệu duy nhất.
- **Repo nhóm:** https://github.com/David-Vo1805-ThanhDat/Web-Application (nhánh `main`).

> Cập nhật tài liệu: **11/10/2026**. Tình trạng bàn giao, việc còn dở và yêu cầu cho backend: xem [backend/HANDOFF.md](backend/HANDOFF.md). Chi tiết API/backend: [backend/README.md](backend/README.md).

---

## Mục lục

1. [Tính năng](#1-tính-năng)
2. [Phần mềm cần cài](#2-phần-mềm-cần-cài)
3. [Cài đặt lần đầu (từng bước)](#3-cài-đặt-lần-đầu-từng-bước)
4. [Chạy dự án hằng ngày](#4-chạy-dự-án-hằng-ngày)
5. [Các trang và tài khoản](#5-các-trang-và-tài-khoản)
6. [Cấu trúc thư mục](#6-cấu-trúc-thư-mục)
7. [Sửa giao diện và build](#7-sửa-giao-diện-và-build)
8. [Kiểm thử tự động](#8-kiểm-thử-tự-động)
9. [Kiểm tra database bằng MySQL](#9-kiểm-tra-database-bằng-mysql)
10. [Sao lưu và khôi phục dữ liệu](#10-sao-lưu-và-khôi-phục-dữ-liệu)
11. [Lỗi thường gặp](#11-lỗi-thường-gặp)
12. [Đưa code lên GitHub](#12-đưa-code-lên-github)
13. [Ai làm phần nào và nhật ký thay đổi](#13-ai-làm-phần-nào-và-nhật-ký-thay-đổi)

---

## 1. Tính năng

**Web người dùng** (`frontend/user/`)
- Trang giới thiệu (chưa đăng nhập): lướt thẻ món kiểu "thích / bỏ qua", giới thiệu tính năng, email/fanpage ở hộp thoại "Góp ý & liên hệ" (khách chưa đăng nhập chỉ xem được cách liên hệ, muốn gửi góp ý phải đăng nhập).
- Hộp thoại **Góp ý & liên hệ** (mọi trang, mở từ menu tài khoản hoặc chân trang): người đã đăng nhập chỉ chọn chủ đề + nhập nội dung, tên/email lấy từ tài khoản; lưu vào bảng `feedback`.
- Đăng ký / đăng nhập bằng **email + mật khẩu** hoặc **"Tiếp tục với Google"**.
- Trang chủ, **Gợi ý ngay** (vòng quay, hộp quà, chọn cùng cả nhóm), **Khám phá** (lọc theo danh mục dạng thẻ hình, giá, khẩu vị, vùng miền), **Chi tiết món** (nguyên liệu, cách nấu, dinh dưỡng, quán gợi ý, **"Nấu thử món này"**: sau khi nấu, báo từng nguyên liệu vừa đủ / nên giảm / nên tăng, vị, độ khó, thời gian, có hợp khẩu vị không — đủ 5 người nấu thử thì hiện thống kê).
- **Thực đơn sức khỏe**, **Nhật ký sức khỏe**, **Tài khoản & cài đặt** (đổi tên, **đổi ảnh đại diện**, hồ sơ sức khỏe).
- **FoodBot**: có ở trang giới thiệu + 5 trang sau đăng nhập; **chỉ trò chuyện với người đã đăng nhập** (khách được mời tạo tài khoản bằng câu dễ thương).
- **Nhạc nền** (nút bật/tắt góc dưới trái), món yêu thích, tất cả dữ liệu tài khoản lưu trên server.

**Bảng quản trị** (`frontend/admin/`, 11 trang): tổng quan, thống kê, món ăn (thêm/sửa/ẩn, tải ảnh), danh mục & thẻ, quán ăn, chất lượng công thức, người dùng (khoá/mở), góp ý liên hệ, cài đặt (sao lưu SQL), nhật ký hoạt động.

---

## 2. Phần mềm cần cài

| Phần mềm | Dùng để | Ghi chú |
| --- | --- | --- |
| **XAMPP** (PHP 8.1+) | Apache chạy web + PHP | PHP cần bật `pdo_mysql`, `curl`, `mbstring` (XAMPP bật sẵn) |
| **MySQL 8** (MySQL Installer: Server + Workbench) | Database | Có thể dùng MariaDB của XAMPP, nhưng nhóm đang dùng MySQL 8 |
| **Python 3** | Sinh lại file HTML (`tools/build/build.py`) | Chỉ cần khi sửa giao diện |
| **Node.js 18+** | Chạy test tự động | `npm install --prefix tools` để cài Playwright |
| **Google Chrome** | Test giao diện (Playwright dùng Chrome thật) | |
| **Git** | Lấy / đẩy code | |

Đường dẫn mặc định dùng trong tài liệu: PHP `C:\xampp\php\php.exe`, MySQL client `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`.

---

## 3. Cài đặt lần đầu (từng bước)

### Bước 1 — Lấy code
```powershell
cd C:\Users\<ten-ban>\Downloads
git clone https://github.com/David-Vo1805-ThanhDat/Web-Application.git hom-nay-an-gi
cd hom-nay-an-gi
```

### Bước 2 — Tạo database và nạp dữ liệu
File SQL có dữ liệu **không nằm trên GitHub** — xin file sao lưu (`.sql`) từ Phong/Đạt. Mở **MySQL Command Line Client** (hoặc PowerShell):
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```
Trong dấu nhắc `mysql>`:
```sql
CREATE DATABASE IF NOT EXISTS hom_nay_an_gi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hom_nay_an_gi;
SOURCE C:/duong/dan/toi/file-sao-luu.sql;
```
> Dùng dấu `/` trong đường dẫn của lệnh `SOURCE`. Trong **PowerShell không dùng được dấu `<`** (kiểu `mysql ... < file.sql`) — hãy dùng `SOURCE` như trên, hoặc MySQL Workbench: *File → Open SQL Script → chọn file → bấm ⚡ Execute*.
>
> Chưa có file dữ liệu: `SOURCE C:/.../backend/database/schema.sql;` tạo database **rỗng** (đủ bảng nhưng không có món, không có tài khoản admin — chỉ dùng để thử).

### Bước 3 — Chạy migration (database tạo trước 11/10/2026)
Mỗi máy chạy **một lần, đúng thứ tự** (database tạo mới từ `schema.sql` bản hiện tại thì đã có sẵn, bỏ qua bước này):
```sql
USE hom_nay_an_gi;
SOURCE C:/.../backend/database/migrations/2026-10-11-google-login.sql;
SOURCE C:/.../backend/database/migrations/2026-10-11-user-avatar.sql;
SOURCE C:/.../backend/database/migrations/2026-10-12-recipe-feedback.sql;
```
Kiểm tra: `SHOW COLUMNS FROM users WHERE Field IN ('google_id', 'avatar');` phải ra **2 dòng**, `SHOW TABLES LIKE 'recipe_feedback';` phải ra **1 dòng**.
⚠️ Thiếu cột nào thì **đăng nhập / đăng ký sẽ lỗi** (code mới đọc/ghi 2 cột này). Thiếu bảng `recipe_feedback` thì "Nấu thử món này", chuông thông báo và Dashboard admin lỗi.

### Bước 4 — Mật khẩu MySQL của máy mình
Mở `backend/config/config.php`, sửa mật khẩu ở dòng `'password' => ...` (mặc định `'123456'`) cho đúng mật khẩu `root` MySQL máy bạn — **chỉ sửa trên máy, không commit** (xem [mục 12](#12-đưa-code-lên-github)). Cách khác: đặt biến môi trường Windows `DB_PASSWORD` (và nếu cần `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`).

### Bước 5 — File khoá bí mật `backend/.env`
```powershell
Copy-Item backend\.env.example backend\.env
notepad backend\.env
```
Điền:
```ini
GEMINI_API_KEY=...          # FoodBot (lấy ở https://aistudio.google.com/apikey)
GOOGLE_CLIENT_ID=...        # Đăng nhập bằng Google (cách lấy: backend/README.md → "Đăng nhập bằng Google")
GOOGLE_CLIENT_SECRET=...
```
- Thiếu `GEMINI_API_KEY` → FoodBot báo "chưa sẵn sàng"; thiếu `GOOGLE_*` → nút Google báo "chưa được bật". Phần còn lại vẫn chạy.
- `backend/.env` đã nằm trong `.gitignore` — **không bao giờ** điền khoá thật vào `.env.example` (file đó được đưa lên GitHub).

### Bước 6 — Trỏ Apache vào thư mục project
XAMPP Control Panel → dòng Apache → **Config → Apache (httpd.conf)**:
```apache
Listen 8080                                   # cổng; máy nào cổng 80 trống thì để 80
ServerName localhost:8080
DocumentRoot "C:\Users\<ten-ban>\Downloads\hom-nay-an-gi"
<Directory "C:\Users\<ten-ban>\Downloads\hom-nay-an-gi">
    ...
    AllowOverride All                         # BẮT BUỘC: backend/.htaccess chặn truy cập mã nguồn và file .env
```
Lưu → **Stop** rồi **Start** Apache.

### Bước 7 — Mở web
- Web người dùng: **http://localhost:8080/frontend/** (tự chuyển vào `user/index.html`)
- Bảng quản trị: **http://localhost:8080/frontend/admin/dashboard.html**

---

## 4. Chạy dự án hằng ngày

1. Bật **MySQL** (dịch vụ Windows `MySQL80` — thường tự chạy; kiểm tra: `Win + R` → `services.msc`).
2. Mở **XAMPP Control Panel** → **Start** Apache.
3. Mở **http://localhost:8080/frontend/** → nhấn **Ctrl + F5** sau khi sửa code để trình duyệt tải bản mới.

**Chạy không cần Apache** (thử nhanh, chỉ trên máy mình):
```powershell
cd C:\Users\<ten-ban>\Downloads\hom-nay-an-gi
C:\xampp\php\php.exe -S 127.0.0.1:8099 -t .
# mở http://127.0.0.1:8099/frontend/  — để cửa sổ này mở, Ctrl + C để tắt
```
> `php -S` **không đọc `.htaccess`**: đừng dùng cách này để cho người khác truy cập qua mạng (lộ file `.env`). Đăng nhập Google qua `php -S` cần khai thêm redirect URI `http://127.0.0.1:8099/backend/api/auth/google-callback.php` ở Google Cloud.

---

## 5. Các trang và tài khoản

**Tài khoản**
| Loại | Đăng nhập | Ghi chú |
| --- | --- | --- |
| Quản trị (super) | `admin@homnayangi.vn` / `admin123` | Đăng nhập xong tự vào bảng quản trị. **Admin chỉ đăng nhập bằng mật khẩu** (nút Google từ chối email admin) |
| Người dùng | Tự **Đăng ký** (mật khẩu ≥ 6 ký tự) hoặc **Tiếp tục với Google** | Google: email phải nằm trong *Test users* của OAuth app khi app ở chế độ Testing |

Mật khẩu chỉ lưu dạng **mã băm** (`password_hash`), không xem lại được — quên thì đặt lại (xem [mục 9.7](#97-đặt-lại-mật-khẩu-làm-tay)).

**Trang người dùng** — `http://localhost:8080/frontend/user/<trang>`
| Trang | File | Cần đăng nhập |
| --- | --- | --- |
| Giới thiệu, liên hệ | `index.html` | Không |
| Đăng nhập / Đăng ký | `dang-nhap.html`, `dang-ky.html` | Không |
| Trang chủ | `trang-chu.html` | Có |
| Gợi ý ngay (vòng quay, hộp quà, cả nhóm) | `goi-y.html` | Có |
| Khám phá (`?tab=favorites` = món đã lưu, `?category=com` = lọc danh mục) | `kham-pha.html` | Có |
| Chi tiết món | `chi-tiet-mon-an.html?id=pho-bo-ha-noi` | Có |
| Thực đơn sức khỏe / Nhật ký sức khỏe | `thuc-don-suc-khoe.html`, `nhat-ky-suc-khoe.html` | Có |
| Tài khoản & cài đặt (đổi tên, ảnh đại diện, hồ sơ sức khỏe) | `tai-khoan.html` | Có |

**Trang quản trị** — `http://localhost:8080/frontend/admin/<trang>`: `dashboard`, `thong-ke`, `mon-an`, `mon-an-sua` (`?id=` / `?new=1`), `danh-muc`, `quan-an`, `cong-thuc`, `nguoi-dung`, `danh-gia` (góp ý liên hệ), `cai-dat`, `nhat-ky` (đều đuôi `.html`).

---

## 6. Cấu trúc thư mục

```
hom-nay-an-gi/
├── README.md                     ← tài liệu này
├── frontend/                     ← mọi thứ chạy trên trình duyệt
│   ├── index.html                ← cửa vào, chuyển tới user/index.html
│   ├── user/                     ← WEB NGƯỜI DÙNG: 10 trang .html (SINH RA từ tools/build — đừng sửa tay)
│   │   ├── css/{base,components,pages}/   (chatbot.css, music.css, chips.css, navbar.css, auth.css, explore.css...)
│   │   └── js/
│   │       ├── core/             ← backend.js (gọi API), auth.js (đăng nhập, avatar), sync.js, main.js, categories.js...
│   │       ├── widgets/          ← chatbot.js (FoodBot), bg-music.js (nhạc nền), wheel.js, mystery-box.js...
│   │       └── pages/            ← logic từng trang + auth-google.js (nút Google)
│   ├── admin/                    ← BẢNG QUẢN TRỊ: 11 trang .html (SINH RA từ tools/build/admin)
│   ├── image/                    ← hình đã THU NHỎ dùng trên web (logo-256, chat-bot-192, kham-pha/*-192...; admin/ = ảnh riêng của bảng quản trị)
│   └── audio/                    ← nhac-nen.mp3 + .htaccess (trình duyệt giữ file nhạc 7 ngày)
├── backend/
│   ├── api/                      ← endpoint PHP (chỉ thư mục này mở ra web)
│   │   ├── auth/                 ← index.php (login/register/me/logout), bootstrap.php, google.php, google-callback.php
│   │   ├── public/               ← foods.php (allFoods + allCategories), index.php (góp ý...)
│   │   ├── user/                 ← state.get/save, profile.update (tên + ảnh đại diện)
│   │   ├── admin/                ← 33 hành động của bảng quản trị
│   │   └── chat/                 ← FoodBot (chỉ người đã đăng nhập)
│   ├── src/                      ← Controllers / Services / Repositories / Storage (MySqlStore) / Core (Router, Session)
│   ├── config/                   ← config.php (MySQL), chatbot.php, google.php
│   ├── database/
│   │   ├── schema.sql            ← cấu trúc 22 bảng
│   │   └── migrations/           ← file nâng cấp database cũ (chạy 1 lần, theo thứ tự ngày)
│   ├── prompts/foodbot.txt       ← lời dặn cho FoodBot
│   ├── tests/                    ← test backend (API, MySQL, chatbot, Google, avatar)
│   ├── .env.example              ← MẪU khoá bí mật (đưa lên GitHub, để trống)
│   ├── .env                      ← khoá thật của máy mình (KHÔNG đưa lên GitHub)
│   ├── README.md                 ← chi tiết backend
│   └── HANDOFF.md                ← bàn giao, việc còn dở, yêu cầu cho backend
├── tools/
│   ├── build/                    ← build.py, generate.py (khung chung), pages/*.py (trang người dùng), admin/
│   ├── tests/                    ← test giao diện Playwright
│   └── node_modules/             ← Playwright (cài bằng npm, không đưa lên GitHub)
├── archive/, Web-Application/    ← bản sao lưu cũ (nhóm quyết định giữ lại)
```

---

## 7. Sửa giao diện và build

| Muốn sửa | Sửa ở đâu | Cần build? |
| --- | --- | --- |
| Chữ, bố cục HTML một trang người dùng | `tools/build/pages/<trang>.py` | **Có** |
| Phần chung: `<head>`, thanh menu, chân trang, khối FoodBot, nút Google, danh sách CSS/JS | `tools/build/generate.py` | **Có** |
| Trang quản trị | `tools/build/admin/` | **Có** |
| CSS | `frontend/user/css/...` (sửa thẳng) | Không |
| JavaScript | `frontend/user/js/...` (sửa thẳng) | Không |
| Hình | thêm bản thu nhỏ vào `frontend/image/` rồi tham chiếu `../image/...` | tuỳ chỗ dùng |

⚠️ **Không sửa trực tiếp file `.html`** trong `frontend/user/` hay `frontend/admin/` — lần build sau sẽ **ghi đè mất**.

Build (chạy ở thư mục gốc project):
```powershell
python tools/build/build.py                  # sinh lại TẤT CẢ: 10 trang người dùng + 11 trang admin + frontend/index.html
python tools/build/pages/kham_pha.py         # chỉ sinh lại 1 trang người dùng
python tools/build/admin/pages/dashboard.py  # chỉ sinh lại 1 trang admin
```
Bật FoodBot cho một trang: thêm `chatbot=True` vào lời gọi `page(...)` trong file `.py` của trang đó.

---

## 8. Kiểm thử tự động

Cài một lần: `npm install --prefix tools` (Playwright). Tất cả test chạy ở thư mục gốc project, dùng **database tạm `hnag_test_*`** hoặc server giả lập — **không làm bẩn dữ liệu thật**.

| Lệnh | Kiểm tra gì | Kết quả gần nhất (12/10/2026) |
| --- | --- | --- |
| `node backend/tests/run-mysql.js` | 109 kiểm tra API + 12 kiểm tra MySQL trên database tạm (Phong) | 105 đạt / 4 lỗi¹ |
| `node backend/tests/run-mysql.js database-ui` | như trên + test giao diện hai trình duyệt | |
| `node backend/tests/chatbot-api.js` | FoodBot với Gemini giả lập (An) | 29/29 |
| `node backend/tests/google-login.js` | Đăng nhập Google với Google giả lập + database tạm (Đạt) | 17/17 |
| `node backend/tests/user-avatar.js` | Ảnh đại diện: API + giao diện (Đạt) | 18/18 |
| `node backend/tests/feedback-modal.js` | Hộp thoại Góp ý & liên hệ: giao diện + lưu bảng `feedback` (Đạt) | 11/11 |
| `node backend/tests/recipe-feedback.js` | "Nấu thử món này": 5 API `recipe.*` + giao diện trang chi tiết món và trang admin Công thức (Đạt) | 51/51 |

¹ Lỗi do **dữ liệu, không phải code**: test đăng nhập bằng `nguyenvana@gmail.com` / `123456` nhưng mật khẩu tài khoản mẫu này trong database máy Đạt đã bị đổi, nên đăng nhập hỏng kéo theo các kiểm tra sau (lỗi thứ 4 "hoạt động hôm nay" cũng vậy). Đặt lại mật khẩu mẫu về `123456` (mục 9.7) thì đạt **109/109** — đã thử trên bản sao database 11/10 và 12/10.

Kiểm tra cú pháp nhanh:
```powershell
C:\xampp\php\php.exe -l backend\src\Services\AuthService.php   # file PHP
node --check frontend\user\js\widgets\chatbot.js               # file JS
```

---

## 9. Kiểm tra database bằng MySQL

Mở **MySQL Workbench** (hoặc `mysql -u root -p`), chạy trước:
```sql
USE hom_nay_an_gi;
```
> Cột `avatar` và `foods.image` chứa ảnh dạng chuỗi rất dài — luôn dùng `LEFT(...)` / `LENGTH(...)` thay vì `SELECT *` để Workbench không bị đơ.

### 9.1 Tổng quan
```sql
SHOW TABLES;                                        -- 22 bảng
SELECT (SELECT COUNT(*) FROM foods)       AS mon_an,
       (SELECT COUNT(*) FROM users)       AS nguoi_dung,
       (SELECT COUNT(*) FROM admins)      AS quan_tri,
       (SELECT COUNT(*) FROM restaurants) AS quan_an,
       (SELECT COUNT(*) FROM feedback)    AS gop_y,
       (SELECT COUNT(*) FROM audit_logs)  AS nhat_ky;
-- Kiểm tra đã chạy đủ migration (phải ra 2 dòng: google_id, avatar)
SHOW COLUMNS FROM users WHERE Field IN ('google_id', 'avatar');
```

### 9.2 Người dùng và quản trị viên
```sql
-- Quản trị viên (super = quản trị chính, moderator = điều hành viên)
SELECT id, name, email, role FROM admins;

-- 20 người dùng mới nhất
SELECT id, name, email, role, status, joined_at, last_active_at
FROM users ORDER BY joined_at DESC LIMIT 20;

-- Tìm một tài khoản
SELECT id, name, email, status, google_id IS NOT NULL AS dang_nhap_google, avatar IS NOT NULL AS co_anh
FROM users WHERE email = 'ban@gmail.com';

-- Theo trạng thái: active / unverified / locked
SELECT status, COUNT(*) AS so_nguoi FROM users GROUP BY status;
```

### 9.3 Đăng nhập bằng Google
```sql
-- Ai đã đăng nhập / liên kết bằng Google
SELECT id, name, email, joined_at, last_active_at FROM users
WHERE google_id IS NOT NULL ORDER BY joined_at DESC;

-- Đếm theo cách đăng nhập
SELECT IF(google_id IS NULL, 'Email + mật khẩu', 'Google') AS cach_dang_nhap, COUNT(*) AS so_tai_khoan
FROM users GROUP BY cach_dang_nhap;

-- Lịch sử đăng ký / liên kết Google
SELECT created_at, actor, text FROM audit_logs WHERE text LIKE '%Google%' ORDER BY id DESC;
```

### 9.4 Ảnh đại diện
```sql
-- Ai đã đặt ảnh (đầu chuỗi phải là data:image/jpeg;base64,... ; kích thước < 150 KB)
SELECT id, name, email, LEFT(avatar, 30) AS dau_anh, ROUND(LENGTH(avatar) / 1024, 1) AS kich_thuoc_kb
FROM users WHERE avatar IS NOT NULL;

SELECT IF(avatar IS NULL, 'Chưa có ảnh', 'Đã có ảnh') AS trang_thai, COUNT(*) AS so_nguoi
FROM users GROUP BY trang_thai;
```
Xem ảnh thật: `SELECT avatar FROM users WHERE email = '...';` → copy giá trị → dán vào thanh địa chỉ Chrome.

### 9.5 Món ăn, danh mục, quán
```sql
-- Món theo trạng thái (visible = đang hiện trên web, hidden = ẩn, pending = chờ duyệt)
SELECT status, COUNT(*) FROM foods GROUP BY status;

-- Danh sách món + nguồn ảnh (để rà ảnh sai món)
SELECT no, id, name, category_slug, status, LEFT(image, 60) AS anh FROM foods ORDER BY no;

-- Số món mỗi danh mục
SELECT c.slug, c.label, COUNT(f.id) AS so_mon
FROM categories c LEFT JOIN foods f ON f.category_slug = c.slug AND f.status = 'visible'
GROUP BY c.slug, c.label;

-- Quán gợi ý của một món
SELECT name, address, city, price_text FROM restaurants WHERE food_id = 'pho-bo-ha-noi';
```

### 9.6 Góp ý liên hệ, nhật ký, dữ liệu riêng người dùng
```sql
-- Góp ý mới nhất (status: new = chưa phản hồi, replied = đã phản hồi)
SELECT id, name, email, subject_label, status, LEFT(message, 60) AS noi_dung, created_at
FROM feedback ORDER BY created_at DESC LIMIT 20;

-- Nhật ký hoạt động gần nhất (đăng nhập admin, sửa món, khoá tài khoản...)
SELECT created_at, type, actor, text FROM audit_logs ORDER BY id DESC LIMIT 30;

-- "Nấu thử món này": số lượt và tỉ lệ hợp khẩu vị theo món
SELECT f.name, COUNT(r.id) AS luot_nau, ROUND(100 * AVG(r.fit)) AS phan_tram_hop, MAX(r.updated_at) AS moi_nhat
FROM recipe_feedback r JOIN foods f ON f.id = r.food_id GROUP BY f.id, f.name ORDER BY luot_nau DESC;

-- Phản hồi nấu thử mới nhất (ingredients/taste là JSON; note chỉ admin thấy)
SELECT r.updated_at, r.user_name, f.name AS mon, r.portions, r.fit, r.difficulty, r.time_actual, r.ingredients, r.note
FROM recipe_feedback r JOIN foods f ON f.id = r.food_id ORDER BY r.updated_at DESC LIMIT 20;

-- Món yêu thích / hồ sơ sức khỏe đã lưu của từng tài khoản
SELECT u.email, s.favorites, s.health_profile, s.updated_at
FROM user_state s JOIN users u ON u.id = s.user_id ORDER BY s.updated_at DESC;
```

### 9.7 Đặt lại mật khẩu (làm tay)
Chưa có chức năng "Quên mật khẩu". Tạo mã băm cho mật khẩu mới trong PowerShell:
```powershell
C:\xampp\php\php.exe -r "echo password_hash('MatKhauMoi123', PASSWORD_DEFAULT);"
```
Copy chuỗi `$2y$10$...` rồi:
```sql
UPDATE users  SET password_hash = 'dan_chuoi_vao_day' WHERE email = 'email_nguoi_dung@gmail.com';
-- tài khoản quản trị thì dùng bảng admins:
-- UPDATE admins SET password_hash = '...' WHERE email = '...';
```
⚠️ Luôn có `WHERE email = ...` — quên thì đổi mật khẩu **toàn bộ** người dùng. Phải ra `1 row affected`.

### 9.8 Ẩn món thử nghiệm (nếu không vào được trang admin)
Nên ẩn qua **Bảng quản trị → Món ăn**. Làm bằng SQL:
```sql
SELECT id, name, status FROM foods WHERE name LIKE '%test%';
UPDATE foods SET status = 'hidden' WHERE id IN ('mon-an-test-sieu-dam-da', 'mon-test-123-blabla');
```

---

## 10. Sao lưu và khôi phục dữ liệu

- **Sao lưu:** Bảng quản trị → **Cài đặt → Sao lưu** → tạo file `backend/storage/backups/mysql-*.sql` (đủ cấu trúc + dữ liệu). Thư mục `backend/storage/` không lên GitHub.
- **Gửi cho nhóm:** gửi file `.sql` đó (Drive/Zalo...) — ảnh món và ảnh đại diện tải lên qua web **chỉ nằm trong MySQL máy người tải**, phải sao lưu mới chia sẻ được.
- **Khôi phục vào máy khác:** tạo database trống rồi `SOURCE` file như [Bước 2](#bước-2--tạo-database-và-nạp-dữ-liệu); file sao lưu cũ hơn 11/10/2026 thì chạy thêm migration ([Bước 3](#bước-3--chạy-migration-database-tạo-trước-11102026)).
- Sao lưu bằng dòng lệnh: `& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u root -p hom_nay_an_gi --result-file=sao-luu.sql`

---

## 11. Lỗi thường gặp

| Hiện tượng | Nguyên nhân / cách xử lý |
| --- | --- |
| Thanh đỏ "Không tải được dữ liệu món ăn từ máy chủ" | MySQL chưa chạy, hoặc sai mật khẩu trong `backend/config/config.php` / `DB_PASSWORD` |
| Đăng nhập / đăng ký báo "Lỗi máy chủ" sau khi kéo code mới | Chưa chạy migration → [Bước 3](#bước-3--chạy-migration-database-tạo-trước-11102026) |
| Trang hiện nội dung cũ hoặc của project khác | Apache `DocumentRoot` trỏ sai thư mục ([Bước 6](#bước-6--trỏ-apache-vào-thư-mục-project)); hoặc nhấn Ctrl + F5 |
| Mở file `.html` bằng nhấp đúp (`file:///...`) không chạy | Phải mở qua `http://localhost:8080/...` |
| `Access denied for user 'root'` | Sai mật khẩu MySQL trong `config.php` |
| `mysql.exe` của XAMPP báo `caching_sha2_password could not be loaded` | Dùng client của MySQL 8: `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe` hoặc Workbench |
| Nút Google báo "chưa được bật" | Chưa có `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` trong `backend/.env` |
| Google báo `redirect_uri_mismatch` | *Authorized redirect URIs* phải đúng từng ký tự: `http://localhost:8080/backend/api/auth/google-callback.php` |
| Google báo "Access blocked … verification" | Email chưa có trong **Test users** của OAuth consent screen |
| FoodBot báo "chưa sẵn sàng" | Thiếu `GEMINI_API_KEY` trong `backend/.env`, hoặc PHP chưa bật `curl` |
| FoodBot chỉ mời tạo tài khoản | Đúng thiết kế: khách chưa đăng nhập không dùng được FoodBot |
| Nhạc nền không phát khi vừa mở trang | Trình duyệt chặn tự phát — nhạc phát sau lần bấm/chạm đầu tiên |
| Sửa `.html` xong build lại thì mất | Sửa trong `tools/build/pages/*.py` hoặc `generate.py` ([mục 7](#7-sửa-giao-diện-và-build)) |

---

## 12. Đưa code lên GitHub

**Không bao giờ commit:** `backend/config/config.php` có mật khẩu thật, `backend/.env`, `backend/storage/`, ảnh gốc vài MB, `tools/node_modules/` (`.gitignore` đã chặn `.env`, `storage`, `node_modules`; riêng `config.php` phải tự để ý).

```powershell
git pull origin main                 # lấy code mới của nhóm trước
git status                           # xem file thay đổi — KHÔNG được có config.php / .env
git restore --staged backend/config/config.php   # lỡ thêm config.php thì gỡ ra
git add -A
git commit -m "Mô tả ngắn thay đổi"
git push origin main
```
Push bị từ chối (`rejected` / `fetch first`) nghĩa là có người vừa đẩy trước — `git pull origin main` rồi push lại, **không dùng `--force`**. Kéo code mới về xong nhớ xem lại [Bước 3](#bước-3--chạy-migration-database-tạo-trước-11102026) (có migration mới không).

---

## 13. Ai làm phần nào và nhật ký thay đổi

| Phần | Người làm | Ghi chú |
| --- | --- | --- |
| Backend PHP + MySQL (MySqlStore, đăng nhập theo phiên PHP, API, sao lưu SQL) | **Phong** | nhánh `backend`, merge vào `main` 10/10/2026 |
| FoodBot (API `backend/api/chat`, `ChatService` gọi Gemini, `chatbot.js`, `chatbot.css`, test `chatbot-api.js`) | **An** | lấy từ nhánh `Tester-(-An-)`; ảnh món của nhánh này **không** lấy (làm lại qua trang admin) |
| Giao diện người dùng (`frontend/user`, `tools/build`) | **Đạt** | |
| Đăng nhập bằng Google (giao diện + backend + cột `users.google_id`) | **Đạt** | Phong xem lại phần backend |
| Ảnh đại diện (giao diện + `profile.update` + cột `users.avatar`) | **Đạt** | Phong xem lại phần backend |
| "Nấu thử món này" — backend 5 API `recipe.*` + bảng `recipe_feedback` (giao diện có sẵn từ trước) | **Đạt** (12/10) | Phong xem lại phần backend ([backend/HANDOFF.md](backend/HANDOFF.md) mục 6) |

### 12/10/2026
- **Admin → Danh mục & thẻ** (Đạt): mỗi danh mục dùng đúng hình danh mục của web người dùng (`frontend/image/kham-pha/*-192.png`, như trang Khám Phá) thay cho icon nét; ô hình 56px, tên 16px; bỏ dòng "slug: ..." dưới tên (slug vẫn xem/sửa được trong form sửa danh mục). Danh mục mới chưa có hình vẫn dùng icon đã chọn. Sửa `frontend/admin/js/pages/danh-muc.js` (`CATEGORY_IMAGE`, `catIcon()`), `css/pages/taxonomy.css`.
- **Bảng quản trị** (Đạt): logo đổi thành logo web (`frontend/image/admin/logo-128.png` = `logo-256.png` đã bỏ nền kem; logo bên user giữ nguyên), ở menu trái và thanh trên điện thoại. (Chuông thông báo và nút "Xem web người dùng" đã thử đổi sang ảnh rồi để lại icon nét như cũ.) Sửa ở `tools/build/admin/layout.py`, `css/layout/sidebar.css`. Từ nay các trang admin gắn số phiên bản vào đường dẫn CSS/JS (`?v=<thời điểm sửa file>`, hàm `_v()` trong `layout.py`) nên trình duyệt tự tải bản mới sau mỗi lần sửa + build, không còn hiện giao diện cũ do bộ nhớ đệm.
- **"Nấu thử món này" chạy thật** (backend do Đạt làm theo hợp đồng cũ của frontend): người dùng gửi phản hồi sau khi nấu ở trang chi tiết món (mỗi người 1 phản hồi/món, gửi lại là sửa); đủ 5 lượt thì hiện thống kê công khai; trang admin "Chất lượng công thức" liệt kê món cần xem lại định lượng, chuông thông báo và Dashboard báo số món cần xem lại. Bảng mới `recipe_feedback` — **mỗi máy chạy migration** `2026-10-12-recipe-feedback.sql` (mục 3, bước 3). Test `node backend/tests/recipe-feedback.js` (51/51).
- Kiểm tra toàn bộ dự án: lint 59 PHP + 51 JS, build lại không đổi file nào, mở 41 lượt trang + 79 link nội bộ → 0 lỗi.

### 11/10/2026
- **FoodBot chỉ trò chuyện với người đã đăng nhập** (nhóm chốt, thay cho "khách hỏi 2 lượt"): khách gõ gì FoodBot cũng đáp bằng câu mời tạo tài khoản (5 câu xoay vòng — `GUEST_HELLO` / `GUEST_REPLIES` trong `chatbot.js`) kèm nút Đăng nhập / Tạo tài khoản; server trả 403 cho khách (`backend/api/chat/index.php`).
- **Đăng nhập bằng Google** (OAuth + PKCE) ở trang đăng nhập/đăng ký; tạo tài khoản mới hoặc gộp vào tài khoản cùng email; admin và tài khoản bị khoá bị từ chối. Migration `2026-10-11-google-login.sql`.
- **Ảnh đại diện**: trang Tài khoản có "Đổi ảnh" / "Xoá ảnh" (tự cắt vuông, thu nhỏ 256px); hiện ở thanh menu. Migration `2026-10-11-user-avatar.sql`. Bỏ 3 ô ghi chú: "Một tài khoản dùng chung…" (trang Đăng nhập), "…được lưu trên máy chủ…" và "Công cụ tham khảo… (Mifflin-St Jeor)…" (trang Tài khoản).
- **Trang Khám phá**: thanh lọc danh mục thành thẻ hình + tên ("Menu" + 7 danh mục — hình khai báo ở `CATEGORY_IMAGE`, `frontend/user/js/core/categories.js`).
- **Nút Yêu thích** trên thanh menu: ô kem viền đồng với trái tim bánh mì.
- **Trang giới thiệu — thẻ lướt món**: FoodBot ở đầu thẻ bình luận theo từng lần lướt (theo danh mục, vị cay, giá — câu viết sẵn, không gọi AI) và lướt hết 6 thẻ thì hiện **"Gu ăn của bạn"** (danh hiệu theo danh mục được thả tim nhiều nhất, vd. "Team Nước Lèo Chính Hiệu", "Thánh Ăn Vặt"; kèm huy hiệu "Chịu cay giỏi", "Thích món chay"...) + nút "Đăng ký để nhận gợi ý đúng gu". Câu chữ sửa ở đầu khối thẻ lướt trong `frontend/user/js/pages/index.js` (`LIKE_BY_CATEGORY`, `GU_BY_CATEGORY`...), kiểu ở `css/pages/landing.css`. Mỗi danh hiệu có **ảnh thật lấy từ Wikimedia Commons** (giấy phép tự do, cắt vuông 192px) trong `frontend/image/icon-ngoai/` (`nuoc-leo`, `com`, `an-vat`, `do-cuon`, `lau-nuong`, `an-xanh`, `ngot-ngao`, `da-he`, `ken-an` `.jpg`), hiện thành hình tròn kèm dòng ghi tác giả nhỏ bên dưới (ảnh CC BY bắt buộc ghi). Huy hiệu (Chịu cay giỏi, Thích món chay, Ăn ngon giá hạt dẻ, Dễ tính) cũng dùng ảnh thật thay emoji: `icon-ngoai/hh-ot-64.png`, `hh-mam-cay-64.png`, `hh-dong-xu-64.png` (Wikimedia Commons, đã tách nền) và `trai-tim-96.png` có sẵn — khai báo trong `guBadges()`. Nguồn + giấy phép từng ảnh ở `frontend/image/icon-ngoai/NGUON-ANH.md`. Đổi ảnh: ghi đè file `.jpg` cùng tên và sửa tác giả trong `GU_PHOTO_CREDIT` (`index.js`) + `NGUON-ANH.md`.
- **Trang chủ**: bỏ banner, cột chữ canh theo đỉnh thẻ vòng quay (`.hero-copy` trong `home.css`), bỏ icon ✨ ở nhãn và 2 nút quay, "5 giây". **Chân trang**: mục "Đội ngũ trong bếp" ghi tên thật kèm vai trò kiểu gian bếp (Phong · Bếp trưởng hậu trường — Backend & cơ sở dữ liệu, An · Người nếm thử — FoodBot & kiểm thử, Đạt · Người bày món — Giao diện & trải nghiệm người dùng; sửa trong `tools/build/generate.py`, màu chữ vai trò `.footer-kitchen-role` ở `css/components/footer.css`); "Thực đơn 31 món" → "Thực đơn món ăn".
- **Icon ảnh cho 5 mục menu** (Trang chủ, Gợi ý ngay, Khám phá, Thực đơn sức khỏe, Nhật ký sức khỏe — `frontend/image/icon-page/*-icon-72.png`, ẩn ở bề rộng 992–1399px như icon cũ) và **banner ảnh lớn ở đầu 4 trang** Gợi ý ngay, Khám phá, Thực đơn sức khỏe, Nhật ký sức khỏe (Trang chủ không có banner vì đã có phần đầu riêng với vòng quay) (`*-banner.jpg`, `page(..., banner=("tên", "vị trí dọc"))` trong `tools/build/pages/*.py`, kiểu `.page-banner` trong `css/components/sections.css`).
- **Liên hệ chuyển vào trong** (Đạt): bỏ khối form Liên Hệ ở trang giới thiệu và 2 mục menu "Trang Chủ", "Liên Hệ" (menu khách chỉ còn "Giới Thiệu"). Thay bằng hộp thoại "Góp ý & liên hệ" dùng chung — `frontend/user/js/widgets/feedback.js` + `css/components/feedback.css` (nạp ở mọi trang qua `tools/build/generate.py`). Mở bằng phần tử có `data-open-feedback`: mục "Góp ý & liên hệ" trong menu tài khoản (`js/core/auth.js`) và link ở chân trang. Đã đăng nhập: form chủ đề + nội dung (+ tên món khi "Đề xuất món ăn mới"), tên/email lấy từ tài khoản, gửi qua `feedback.create` cũ (không sửa backend). Khách: chỉ hiện email/fanpage + nút đăng nhập. Test: `node backend/tests/feedback-modal.js`.
- **Trang giới thiệu — khối "Hôm nay bạn thèm gì?"** (thẻ chủ đề món kiểu bento): đã làm rồi **bỏ** theo ý nhóm (trang ngoài bớt lộ tên món). Code nằm trong lịch sử Git nếu cần lấy lại.
- **Trang giới thiệu — khối "Vì sao nên thử"** (Đạt) làm lại: tiêu đề "Ăn gì, để tụi mình lo" (cùng kiểu với "Hôm nay bạn thèm gì?") + 4 thẻ (4 cột trên máy tính, 2 cột máy tính bảng, 1 cột điện thoại) có số thứ tự lớn mờ 01–04, icon xoay nhẹ, dòng nhấn ở cuối; thẻ "Vòng quay may mắn" nền cam nổi bật. Kiểu `.why-*` trong `css/pages/landing.css` (thay `.feature-*` cũ).
- **Thanh menu trang giới thiệu** (Đạt): bỏ hết mục menu ("Trang Chủ", "Giới Thiệu", "Liên Hệ"), chỉ còn logo + Đăng nhập / Đăng ký.
- **Video giới thiệu 38 giây** (Đạt + giọng đọc của nhóm) ở trang giới thiệu, khối video "Bụng bạn đã chọn được món chưa?" ngay sau "Ăn gì, để tụi mình lo". Bố cục 2 cột: trái là tiêu đề + 4 chương có mốc thời gian (bấm để tua tới đoạn đó, chương đang xem được tô sáng), phải là video (khoảng 7/12 bề ngang, viền đen 6px cho tách khỏi nền). File `frontend/video/gioi-thieu.mp4` (4,1 MB), ảnh bìa `gioi-thieu-poster.jpg`, phụ đề tiếng Việt `gioi-thieu.vtt`. Video `preload="none"`, chỉ tải khi bấm nút phát. Khi video phát thì nhạc nền tạm dừng (`window.BgMusic.hold()` mới thêm trong `js/widgets/bg-music.js`), dừng hoặc xem hết thì nhạc phát lại. Logic ở `js/pages/index.js`, kiểu `.demo-*` trong `css/pages/landing.css`. Video dựng từ ảnh chụp/quay màn hình thật của web (không dùng hình AI), nhạc nền và hiệu ứng tự tổng hợp (không dùng `nhac-nen.mp3` vì là bài có bản quyền). Script dựng lại video và hướng dẫn: `tools/video/README.md`.

### 10/10/2026
- Merge backend MySQL của Phong vào `main`; lấy FoodBot của An; FoodBot có ở trang giới thiệu + 5 trang sau đăng nhập (`page(..., chatbot=True)`).
- **Logo** (`image/logo-256.png`) ở thanh menu + chân trang; **hình FoodBot** ở nút chat và đầu khung chat.
- **Trang giới thiệu**: icon 4 thẻ "Vì sao nên thử", 3 thẻ Liên hệ (Gmail, Facebook, đồng hồ), 2 nút lướt thẻ (chữ X / trái tim tương cà) đổi sang hình; bỏ icon ✨; thu gọn phần đầu cho vừa màn hình laptop; thêm dòng hướng dẫn kéo thẻ. Menu "Gợi Ý Ngay" đổi icon `bi-shuffle`.
- **Nhạc nền** các trang sau khi đăng nhập (từ 11/10 **bỏ ở trang giới thiệu, đăng nhập, đăng ký**: `scripts_block(..., music=False)` khi `navbar_mode` không phải `"app"`) (`js/widgets/bg-music.js`, `css/components/music.css`): phát sau lần bấm đầu tiên, nút bật/tắt góc dưới trái, chuyển trang phát tiếp theo thời gian thật. Lựa chọn tắt nhạc lưu ở localStorage, vị trí nghe ở sessionStorage — chỉ là tuỳ chọn giao diện. Đổi bài: thay `frontend/audio/nhac-nen.mp3` (giữ tên); chỉnh âm lượng: `VOLUME` trong `bg-music.js`.

### 08/10/2026
- Sửa `backend/.gitignore` (`storage/` → `/storage/`) để `backend/src/Storage/` được đưa lên GitHub.
