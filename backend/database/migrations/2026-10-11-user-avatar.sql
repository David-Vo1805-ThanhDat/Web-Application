-- Ảnh đại diện người dùng (11/10/2026): ảnh lưu thẳng trong database dạng data URL (giống cột foods.image).
-- Trình duyệt tự thu nhỏ ảnh còn 256x256 trước khi gửi; server chỉ nhận JPEG/PNG/WebP tối đa 150 KB.
-- Chạy MỘT LẦN trên database đang dùng (database mới tạo từ schema.sql đã có sẵn cột này):
--   mysql -u root -p hom_nay_an_gi < backend/database/migrations/2026-10-11-user-avatar.sql
ALTER TABLE users
  ADD COLUMN avatar MEDIUMTEXT NULL AFTER google_id;
