# Backend PHP + MySQL

MySQL là nguồn dữ liệu duy nhất. Backend không dùng JsonFileStore, seed, import JSON hay chức năng đặt lại dữ liệu demo.

## Kết nối và chạy

Sửa `config/config.php` để dùng MySQL trên máy. Có thể ghi đè bằng biến môi trường `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`. PHP cần `pdo_mysql`.

Với Apache XAMPP trỏ DocumentRoot vào thư mục gốc project, mở http://localhost/frontend/. Để chạy server PHP riêng từ thư mục gốc:

```powershell
C:\xampp\php\php.exe -S 127.0.0.1:8099 -t .
```

Database đang dùng đã có dữ liệu. `database/schema.sql` dùng cho database mới; không chạy lại để ghi đè database đang dùng.

## Luồng dữ liệu

- `api/auth/index.php`: đăng nhập, đăng ký, đăng xuất và thông tin phiên.
- `api/auth/bootstrap.php`: nạp danh tính và state từ phiên PHP/database trước khi giao diện khởi động.
- `api/public/foods.php`: xuất món hiển thị và danh mục từ SQL dưới dạng script để frontend sử dụng; không đọc file dữ liệu JavaScript.
- `api/public/index.php`, `api/user/index.php`, `api/admin/index.php`: API JSON.
- `profile.update`: lưu tên hiển thị vào SQL.
- `state.get`, `state.save`: yêu thích, sức khỏe, nhật ký, thực đơn và nhóm bạn theo tài khoản.

MySqlStore ánh xạ bảng quan hệ sang cấu trúc API. Transaction và khóa ghi theo database bảo vệ thao tác đọc-sửa-ghi. Bảng `app_storage_meta` giữ thứ tự và phân biệt state chưa có với state đã xóa. Quyền truy cập do server xác nhận; dữ liệu localStorage cũ bị bỏ qua.

## Sao lưu

Nút sao lưu trong Cài đặt tạo file `storage/backups/mysql-*.sql` gồm schema và dữ liệu. Thư mục này được bảo vệ bằng `.htaccess`. Có thể đổi vị trí bằng `HNAG_STORAGE_DIR`.

Khôi phục bằng MySQL client hoặc công cụ quản trị vào một database trống, sau đó đổi cấu hình kết nối sang database đó. Giữ bản sao lưu trước khi chuyển database.

## Kiểm tra

Từ thư mục gốc:

```powershell
npm install --prefix tools
node backend/tests/run-mysql.js database-ui
```

Runner tạo database `hnag_test_*` từ schema, sao chép dữ liệu hiện tại, chạy kiểm tra rồi dọn database test. Tài khoản MySQL chạy test cần quyền tạo/xóa database test. `PHP_BIN` đổi đường dẫn PHP CLI nếu khác `C:/xampp/php/php.exe`.

## FoodBot trên trang giới thiệu

Chatbot được tích hợp vào `frontend/user/index.html`; `frontend/index.html` chuyển hướng tới trang này. Giao diện nằm ở `frontend/user/css/components/chatbot.css`, tương tác ở `frontend/user/js/widgets/chatbot.js`. Khung rộng 380px, vùng tin nhắn cao 420px và nút mở 60 × 60px trên màn hình đủ rộng/cao; khung tự thu gọn trên điện thoại.

FoodBot chạy bằng PHP trên cùng Apache với website, không cần chạy Node.js hay cổng 3000. Các phần của bản chatbot cũ đã được chuyển vào dự án:

| Thành phần | File hiện tại |
|---|---|
| HTML và các thẻ nhúng | `frontend/user/index.html`, sinh bởi `tools/build/pages/index.py` |
| CSS | `frontend/user/css/components/chatbot.css` |
| JavaScript trình duyệt | `frontend/user/js/widgets/chatbot.js` |
| API nhận hội thoại | `backend/api/chat/index.php` |
| Xác thực và phát SSE | `backend/src/Controllers/ChatController.php` |
| Gọi Gemini REST | `backend/src/Services/ChatService.php` |
| Chỉ dẫn FoodBot | `backend/prompts/foodbot.txt` |
| Cấu hình | `backend/config/chatbot.php`, khóa riêng trong `backend/.env` |

**Cấu hình trên XAMPP:** sao chép `.env.example` thành `.env` trong `backend/`, điền `GEMINI_API_KEY` và tùy chọn `GEMINI_MODEL`. Bản chuyển đổi cũng đọc tên `API_KEY` của chatbot cũ. Biến môi trường của Apache/PHP được ưu tiên hơn `.env`; PHP cần bật `curl` và `mbstring`. Khóa thật không được commit hoặc nhúng vào frontend. `backend/.htaccess` chặn truy cập cấu hình qua Apache với `AllowOverride All`; không dùng `php -S` thuần để phục vụ thư mục chứa `.env` ra mạng vì nó bỏ qua `.htaccess`.

Model mặc định giữ `gemini-3.5-flash-lite`. Dịch vụ gọi `streamGenerateContent` và chuyển từng đoạn trả lời thành SSE, kết thúc bằng `event: done`; lỗi giữa luồng trả `event: error`. Xem [Gemini REST](https://ai.google.dev/api/generate-content) và [tài liệu model](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite). Lỗi 429/503 từ dịch vụ AI sẽ hiện nút **Thử lại**; đây không phải lỗi đăng nhập hoặc kho dữ liệu món ăn. Chatbot không dùng lớp `Storage` của backend hiện tại.

Lịch sử nằm trong bộ nhớ của tab, được giới hạn khi gửi và mất khi tải lại trang. Hội thoại được gửi đến Gemini để trả lời. API chỉ nhận JSON POST `{ "history": [{ "role": "user", "parts": [{ "text": "hôm nay ăn gì" }] }] }`, tối đa 25 lượt user/model xen kẽ, 20.000 ký tự và 64 KiB cho một yêu cầu. Khung hiển thị văn bản, chữ đậm và liên kết bằng DOM, không chạy HTML từ tin nhắn.

Sau khi sửa bố cục, chạy `python tools/build/pages/index.py` để sinh lại trang. Kiểm tra backend không gọi AI thật: `node backend/tests/chatbot-api.js`.

**Trang có FoodBot và giới hạn lượt:** FoodBot có ở trang giới thiệu (`index.html`) và 5 trang sau khi đăng nhập (Trang chủ, Gợi ý ngay, Khám phá, Thực đơn sức khỏe, Nhật ký sức khỏe) — bật bằng `page(..., chatbot=True)` trong `tools/build/pages/*.py`. Khách **chưa đăng nhập** chỉ được hỏi `GUEST_CHAT_TURNS = 2` lượt (đếm trong phiên PHP ở `backend/api/chat/index.php`, tải lại trang vẫn tính); lời chào tự động khi mở khung không tính lượt. Hết lượt, API trả **403** và `chatbot.js` hiện lời mời đăng nhập kèm nút Đăng nhập / Tạo tài khoản. Người đã đăng nhập không bị giới hạn lượt.

