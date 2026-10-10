# Hôm Nay Ăn Gì?

Ứng dụng gợi ý món ăn, quản lý món/quán và lưu hồ sơ người dùng. Backend PHP dùng MySQL trên máy; frontend HTML, CSS và JavaScript.

## Chạy bằng XAMPP

1. Bật MySQL trên máy và Apache của XAMPP.
2. Apache hiện trỏ DocumentRoot vào thư mục project này. Mở http://localhost/frontend/ (thêm cổng nếu Apache không chạy cổng 80, vd. http://localhost:8080/frontend/).
3. Kết nối database nằm trong `backend/config/config.php`. Database hiện tại: `hom_nay_an_gi`. PHP cần extension `pdo_mysql`.
   Mỗi máy có mật khẩu MySQL riêng: sửa `config.php` trên máy mình hoặc đặt biến môi trường `DB_PASSWORD`, **không commit mật khẩu thật** lên GitHub.
4. FoodBot (chatbot) cần khóa Gemini: chép `backend/.env.example` thành `backend/.env` rồi điền `GEMINI_API_KEY` (hoặc đặt biến môi trường cùng tên). Thiếu khóa thì FoodBot báo "chưa sẵn sàng", phần còn lại của web vẫn chạy. `backend/.env` đã nằm trong `.gitignore`.

Dữ liệu nghiệp vụ chỉ đọc/ghi qua PHP API và MySQL. Không có bộ dữ liệu `.js`, kho JSON, seed hoặc cơ chế đăng nhập bằng localStorage. JavaScript frontend còn lại xử lý giao diện, vòng quay và gọi API. Dữ liệu đang chỉnh sửa được giữ tạm trong bộ nhớ rồi gửi về database.

## Cấu trúc

- `frontend/`: giao diện người dùng và quản trị.
- `frontend/image/`: hình dùng trên web (logo, hình FoodBot, icon thẻ, thẻ danh mục Khám phá...). Chỉ để **bản đã thu nhỏ** (`*-96/128/160/192/256.png`); ảnh gốc vài MB không đưa lên repo.
- `frontend/audio/`: nhạc nền `nhac-nen.mp3` + `.htaccess` cho trình duyệt giữ sẵn file nhạc 7 ngày.
- `backend/api/`: API đăng nhập, dữ liệu công khai, người dùng và quản trị.
- `backend/src/`: controller, service, repository và MySqlStore.
- `backend/database/schema.sql`: cấu trúc database.
- `backend/storage/backups/`: bản sao lưu SQL, không phải nguồn dữ liệu chạy web.
- `tools/build/`: mã Python sinh HTML.
- `backend/tests/`, `tools/tests/`: kiểm tra API, lưu trữ và giao diện.

## Build và kiểm tra

Sửa mẫu HTML trong `tools/build/` (**không sửa trực tiếp file `.html`** trong `frontend/user` hay `frontend/admin`: lần build sau sẽ ghi đè), rồi chạy từ thư mục gốc:

```powershell
python tools/build/build.py
npm install --prefix tools
node backend/tests/run-mysql.js database-ui
```

Test tạo database `hnag_test_*`, sao chép dữ liệu từ database hiện tại, kiểm tra rồi xóa database test. Không sửa dữ liệu nghiệp vụ đang dùng. Bỏ `database-ui` nếu chỉ cần kiểm tra API và MySQL. Cần Node.js, PHP CLI và Chrome cho kiểm tra giao diện.

Kiểm tra riêng FoodBot (không gọi AI thật): `node backend/tests/chatbot-api.js`.

Xem [backend/README.md](backend/README.md) về cấu hình, sao lưu và [backend/HANDOFF.md](backend/HANDOFF.md) về các phần chưa hoàn thiện.

## Ai làm phần nào

| Phần | Người làm | Ghi chú |
| --- | --- | --- |
| Backend PHP + MySQL (MySqlStore, đăng nhập theo phiên PHP, API, sao lưu SQL) | Phong | nhánh `backend`, merge vào `main` 10/10/2026 |
| FoodBot (API `backend/api/chat`, `ChatService` gọi Gemini, `chatbot.js`, `chatbot.css`, test `chatbot-api.js`) | An | lấy từ nhánh `Tester-(-An-)`; ảnh món của nhánh này **không** lấy (sẽ làm lại qua trang admin) |
| Giao diện người dùng (`frontend/user`, `tools/build`) | Đạt | các thay đổi 10/10/2026 liệt kê bên dưới |

### Thay đổi giao diện 10/10/2026 (Đạt)

- **FoodBot ở 6 trang**: trang giới thiệu + 5 trang sau đăng nhập (Trang chủ, Gợi ý ngay, Khám phá, Thực đơn sức khỏe, Nhật ký sức khỏe). Bật bằng `page(..., chatbot=True)` trong `tools/build/pages/*.py` (khối HTML chung `CHATBOT_BLOCK` ở `tools/build/generate.py`).
- **Khách chưa đăng nhập hỏi FoodBot tối đa 2 lượt** (lời chào tự động không tính). Hết lượt, FoodBot mời đăng nhập kèm nút Đăng nhập / Tạo tài khoản (`chatbot.js`). Phần chặn thật ở server nằm trong `backend/api/chat/index.php` — xem [backend/HANDOFF.md](backend/HANDOFF.md).
- **Logo** (`image/logo-256.png`) ở thanh menu + chân trang; **hình FoodBot** (`image/chat-bot-192.png`) ở nút chat và đầu khung chat.
- **Trang giới thiệu**: icon 4 thẻ "Vì sao nên thử", 3 thẻ Liên hệ (Gmail, Facebook, đồng hồ) và 2 nút lướt thẻ món (chữ X / trái tim tương cà) đổi sang hình; bỏ icon ✨; thu gọn phần đầu trang cho vừa màn hình laptop; thêm dòng hướng dẫn kéo thẻ (`landing.css`, `home.css`).
- **Trang Khám phá**: thanh lọc danh mục thành thẻ hình + tên ("Menu" + 7 danh mục). Hình khai báo ở `CATEGORY_IMAGE` trong `frontend/user/js/core/categories.js`, kiểu ở `css/pages/explore.css`.
- **Nút Yêu thích** trên thanh menu: ô kem viền đồng với trái tim bánh mì (`image/Muc-Yeu-Thich/tim-banh-mi-96.png`, `navbar.css`). Menu "Gợi Ý Ngay" đổi icon sang `bi-shuffle`.
- **Nhạc nền** mọi trang người dùng (`js/widgets/bg-music.js`, `css/components/music.css`): phát sau lần bấm/chạm đầu tiên (trình duyệt chặn tự phát), nút bật/tắt góc dưới trái, chuyển trang thì phát tiếp theo thời gian thật. Lựa chọn tắt nhạc lưu ở localStorage, vị trí đang nghe ở sessionStorage — chỉ là tùy chọn giao diện, không phải dữ liệu tài khoản. Đổi bài: thay `frontend/audio/nhac-nen.mp3` (giữ tên).
