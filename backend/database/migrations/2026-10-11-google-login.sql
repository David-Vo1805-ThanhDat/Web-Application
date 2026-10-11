-- Đăng nhập bằng Google (11/10/2026): thêm cột liên kết tài khoản Google vào bảng users.
-- Chạy MỘT LẦN trên database đang dùng (database mới tạo từ schema.sql đã có sẵn cột này):
--   mysql -u root -p hom_nay_an_gi < backend/database/migrations/2026-10-11-google-login.sql
-- hoặc mở file trong MySQL Workbench rồi chạy.
ALTER TABLE users
  ADD COLUMN google_id VARCHAR(64) NULL UNIQUE AFTER password_hash;
