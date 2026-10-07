# Bàn giao hiện trạng

Cập nhật 07/10/2026. Project chạy Apache XAMPP và MySQL trên máy, database `hom_nay_an_gi`. URL hiện tại: http://localhost/frontend/.

## Nguồn dữ liệu

MySQL là nguồn dữ liệu duy nhất. Đã bỏ project trùng, archive, kho JSON, dữ liệu seed, bộ dữ liệu JavaScript, JsonFileStore và các script import/reset demo. Bản sao lưu SQL vẫn giữ trong `backend/storage/backups/`.

JavaScript trong frontend là mã giao diện và gọi API. Không lưu dữ liệu nghiệp vụ hoặc danh tính trong localStorage. `api/auth/bootstrap.php` lấy tài khoản/state từ phiên PHP và database khi mở trang. `Sync.storage` là lớp bộ nhớ tạm cho trang hiện tại, gửi thay đổi qua `state.save`; tải lại trang hoặc đăng nhập trình duyệt khác đọc lại SQL. Đổi tên tài khoản dùng `profile.update`.

`api/public/foods.php` xuất cả `allFoods` và `allCategories` từ SQL. Không có danh mục hoặc món mặc định để thay thế khi database lỗi.

## Lưu trữ và kiểm tra

MySqlStore cập nhật các dòng thay đổi trong transaction. Khóa ghi theo database được lấy trước bước đọc-sửa-ghi. `app_storage_meta` lưu thứ tự, state riêng của admin và dấu phân biệt state đã xóa/chưa có. Khi đăng nhập, server xác nhận tài khoản còn tồn tại và chưa bị khóa.

Chạy `node backend/tests/run-mysql.js database-ui` từ thư mục gốc. Runner tạo database riêng `hnag_test_*`, sao chép từ SQL hiện tại, chạy kiểm tra và dọn database test. Lần kiểm tra sau cleanup: 109 kiểm tra API, 12 kiểm tra MySQL và kiểm tra giao diện hai trình duyệt đều đạt.

Sửa mẫu HTML trong `tools/build/`, rồi chạy `python tools/build/build.py`; JavaScript/CSS frontend được sửa trực tiếp. Các fixture giả lập dưới `tools/tests/` chỉ phục vụ test, không tham gia web đang chạy.

## Phần chưa hoàn thiện

- API `recipe.*` cho phản hồi nấu thử chưa có. Giao diện xử lý tình trạng chưa hỗ trợ; chưa có dữ liệu nấu thử thật.
- Chưa có bảng sự kiện theo thời gian để tính biểu đồ hằng ngày, tỷ lệ chốt món hoặc so sánh kỳ trước. Đã bỏ số liệu dựng sẵn; giao diện hiển thị chưa có dữ liệu. Tổng và phân bổ hiện có lấy từ số liệu lưu trong database.
- Một số cài đặt như gửi email, 2FA, bảo trì và lịch sao lưu mới được lưu, chưa triển khai hành vi tương ứng.
- Chưa có đổi/quên mật khẩu, upload ảnh thành file, phân quyền chi tiết giữa các vai trò admin hoặc giao diện khôi phục backup.
- Service vẫn lọc danh sách trong bộ nhớ sau khi đọc SQL; có thể tối ưu truy vấn khi dữ liệu tăng.

Chi tiết kết nối và sao lưu ở [README.md](README.md).
