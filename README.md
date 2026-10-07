# Hôm Nay Ăn Gì?

Ứng dụng gợi ý món ăn, quản lý món/quán và lưu hồ sơ người dùng. Backend PHP dùng MySQL trên máy; frontend HTML, CSS và JavaScript.

## Chạy bằng XAMPP

1. Bật MySQL trên máy và Apache của XAMPP.
2. Apache hiện trỏ DocumentRoot vào thư mục project này. Mở http://localhost/frontend/.
3. Kết nối database nằm trong `backend/config/config.php`. Database hiện tại: `hom_nay_an_gi`. PHP cần extension `pdo_mysql`.

Dữ liệu nghiệp vụ chỉ đọc/ghi qua PHP API và MySQL. Không có bộ dữ liệu `.js`, kho JSON, seed hoặc cơ chế đăng nhập bằng localStorage. JavaScript frontend còn lại xử lý giao diện, vòng quay và gọi API. Dữ liệu đang chỉnh sửa được giữ tạm trong bộ nhớ rồi gửi về database.

## Cấu trúc

- `frontend/`: giao diện người dùng và quản trị.
- `backend/api/`: API đăng nhập, dữ liệu công khai, người dùng và quản trị.
- `backend/src/`: controller, service, repository và MySqlStore.
- `backend/database/schema.sql`: cấu trúc database.
- `backend/storage/backups/`: bản sao lưu SQL, không phải nguồn dữ liệu chạy web.
- `tools/build/`: mã Python sinh HTML.
- `backend/tests/`, `tools/tests/`: kiểm tra API, lưu trữ và giao diện.

## Build và kiểm tra

Sửa mẫu HTML trong `tools/build/`, rồi chạy từ thư mục gốc:

```powershell
python tools/build/build.py
npm install --prefix tools
node backend/tests/run-mysql.js database-ui
```

Test tạo database `hnag_test_*`, sao chép dữ liệu từ database hiện tại, kiểm tra rồi xóa database test. Không sửa dữ liệu nghiệp vụ đang dùng. Bỏ `database-ui` nếu chỉ cần kiểm tra API và MySQL. Cần Node.js, PHP CLI và Chrome cho kiểm tra giao diện.

Xem [backend/README.md](backend/README.md) về cấu hình, sao lưu và [backend/HANDOFF.md](backend/HANDOFF.md) về các phần chưa hoàn thiện.
