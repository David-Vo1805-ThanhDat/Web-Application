# Bàn giao hiện trạng

Cập nhật 07/10/2026. Project chạy Apache XAMPP và MySQL trên máy, database `hom_nay_an_gi`. URL hiện tại: http://localhost/frontend/.

## Nguồn dữ liệu

MySQL là nguồn dữ liệu duy nhất. Đã bỏ kho JSON, dữ liệu seed, bộ dữ liệu JavaScript, JsonFileStore và các script import/reset demo. Bản sao lưu SQL vẫn giữ trong `backend/storage/backups/`.

JavaScript trong frontend là mã giao diện và gọi API. Không lưu dữ liệu nghiệp vụ hoặc danh tính trong localStorage. `api/auth/bootstrap.php` lấy tài khoản/state từ phiên PHP và database khi mở trang. `Sync.storage` là lớp bộ nhớ tạm cho trang hiện tại, gửi thay đổi qua `state.save`; tải lại trang hoặc đăng nhập trình duyệt khác đọc lại SQL. Đổi tên tài khoản dùng `profile.update`.

`api/public/foods.php` xuất cả `allFoods` và `allCategories` từ SQL. Không có danh mục hoặc món mặc định để thay thế khi database lỗi.

## Lưu trữ và kiểm tra

MySqlStore cập nhật các dòng thay đổi trong transaction. Khóa ghi theo database được lấy trước bước đọc-sửa-ghi. `app_storage_meta` lưu thứ tự, state riêng của admin và dấu phân biệt state đã xóa/chưa có. Khi đăng nhập, server xác nhận tài khoản còn tồn tại và chưa bị khóa.

Chạy `node backend/tests/run-mysql.js database-ui` từ thư mục gốc. Runner tạo database riêng `hnag_test_*`, sao chép từ SQL hiện tại, chạy kiểm tra và dọn database test. Lần kiểm tra sau cleanup: 109 kiểm tra API, 12 kiểm tra MySQL và kiểm tra giao diện hai trình duyệt đều đạt.

Sửa mẫu HTML trong `tools/build/`, rồi chạy `python tools/build/build.py`; JavaScript/CSS frontend được sửa trực tiếp. Các fixture giả lập dưới `tools/tests/` chỉ phục vụ test, không tham gia web đang chạy.

## Cập nhật 10/10/2026

### Repo (Đạt)
- 08/10: sửa `backend/.gitignore` từ `storage/` thành `/storage/`. Dòng cũ (Windows không phân biệt hoa/thường) bỏ qua luôn `backend/src/Storage/` nên các file Storage chưa từng lên GitHub.
- 10/10: merge nhánh `backend` (Phong) vào `main`. Xung đột `src/Storage/DataStore.php` lấy bản của Phong, bỏ `JsonFileStore.php` + `Seeder.php`. **Giữ lại** hai thư mục sao lưu `Web-Application/` và `archive/` (nhánh `backend` đã xoá) theo quyết định của nhóm.
- File SQL có dữ liệu **không** đưa lên repo: ai clone về cần xin file SQL rồi nạp vào MySQL máy mình.

### FoodBot — An (lấy từ nhánh `Tester-(-An-)`)
- File mới: `api/chat/index.php`, `src/Controllers/ChatController.php`, `src/Services/ChatService.php`, `config/chatbot.php`, `prompts/foodbot.txt`, `.env.example`, `tests/chatbot-api.js` (29 kiểm tra, không gọi AI thật — đạt).
- Gọi Gemini REST, trả lời dạng SSE. **Không** dùng Storage/MySQL. Cần `GEMINI_API_KEY` trong `backend/.env` (đã thêm `/.env` vào `.gitignore`) hoặc biến môi trường.
- Chỉ lấy phần chatbot; ảnh món ăn + sửa JSON của nhánh này **không** lấy (JSON đã bỏ, ảnh sẽ làm lại qua trang admin).

### ⚠ Thay đổi trong phần backend do frontend làm — Phong xem lại giúp (Đạt)
`api/chat/index.php` thêm **giới hạn khách chưa đăng nhập 2 lượt** (`checkGuestQuota`):
- Dùng `Session::user()`; khách đếm trong `$_SESSION['guest_chat'] = ['turns', 'greetings']`. Hằng số `GUEST_CHAT_TURNS = 2`, `GUEST_GREETINGS = 5`, `GREETING_TEXT = 'hôm nay ăn gì'` (lời chào tự động khi mở khung, không tính lượt — phải trùng `GREETING` trong `frontend/user/js/widgets/chatbot.js`).
- Hết lượt trả **403** + thông báo tiếng Việt; `chatbot.js` dựa vào 403 để hiện lời mời đăng nhập. Người đã đăng nhập không giới hạn.
- Gọi `session_write_close()` trước khi stream để câu trả lời dài không giữ khoá phiên.
- Lượt bị trừ ngay khi gửi, kể cả khi Gemini lỗi sau đó. Nếu muốn chuyển logic này vào Controller/Service hoặc đổi cách đếm, giữ nguyên hợp đồng "403 = hết lượt khách".

### Yêu cầu từ frontend (chưa làm)
1. **Đổi ảnh đại diện (avatar)** — chờ nhóm chốt. Cần: cột `users.avatar MEDIUMTEXT NULL` (data URL như `foods.image`); `profile.update` nhận thêm `avatar` (chỉ `image/jpeg|png|webp`, giới hạn ~200 KB, `null` = xoá); trả `avatar` trong `me` và `api/auth/bootstrap.php` (`window.APP_USER`). Frontend sẽ tự thu nhỏ ảnh còn ~256px trước khi gửi và hiện ở thanh menu + trang Tài khoản; chưa có ảnh thì vẫn dùng chữ cái đầu.
2. **Đặt lại mật khẩu từ trang admin** (Người dùng). Hiện chỉ làm tay được: tạo hash bằng `php -r "echo password_hash('MatKhauMoi', PASSWORD_DEFAULT);"` rồi `UPDATE users SET password_hash = '...' WHERE email = '...'`.

### Dữ liệu cần sửa qua trang admin (An / ai phụ trách nội dung)
- **Ẩn hoặc xoá 2 món thử nghiệm đang hiển thị công khai**: "Món Ăn Test Siêu Đậm Đà" (ảnh nhân vật hoạt hình), "mon test 123 blabla" (ảnh chụp màn hình lỗi PowerShell).
- **19 món dùng ảnh sai món**: Cháo Sườn Sụn (ảnh chân dung người), Bún Bò Huế (gà rán), Cơm Tấm (sườn BBQ), Bánh Mì Thịt Nướng (mì Ý), Bún Chả (cà ri tôm), Bánh Xèo (salad), Bún Đậu Mắm Tôm (mì cà ri), Gỏi Cuốn (há cảo), Mì Quảng (mì gói), Cơm Niêu Kho Quẹt (paella), Bún Riêu (bít tết), Lẩu Nấm Chay (mì), Bánh Tráng Nướng (pizza), Chè Bưởi (cupcake), Cơm Gà Xối Mỡ (ức gà nướng), Xôi Mặn (salad), Cà Phê Sữa Đá (cà phê đen nóng), Bánh Mì Chảo (bánh mì trứng ốp), Nem Nướng Nha Trang (thịt viên).
- Ảnh tải lên qua admin chỉ nằm trong MySQL máy người tải; xong thì Cài đặt → Sao lưu, gửi file SQL cho nhóm.

## Phần chưa hoàn thiện

- API `recipe.*` cho phản hồi nấu thử chưa có. Giao diện xử lý tình trạng chưa hỗ trợ; chưa có dữ liệu nấu thử thật.
- Chưa có bảng sự kiện theo thời gian để tính biểu đồ hằng ngày, tỷ lệ chốt món hoặc so sánh kỳ trước. Đã bỏ số liệu dựng sẵn; giao diện hiển thị chưa có dữ liệu. Tổng và phân bổ hiện có lấy từ số liệu lưu trong database.
- Một số cài đặt như gửi email, 2FA, bảo trì và lịch sao lưu mới được lưu, chưa triển khai hành vi tương ứng.
- Chưa có đổi/quên mật khẩu, upload ảnh thành file, phân quyền chi tiết giữa các vai trò admin hoặc giao diện khôi phục backup.
- Service vẫn lọc danh sách trong bộ nhớ sau khi đọc SQL; có thể tối ưu truy vấn khi dữ liệu tăng.

Chi tiết kết nối và sao lưu ở [README.md](README.md).
