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
