/* core/audit-types.js — Loại sự kiện của nhật ký hoạt động → biểu tượng + màu + nhãn (hằng số giao diện, dùng ở Dashboard và trang Nhật ký). */
window.AuditTypes = {
  edit: { icon: 'edit', tone: 'orange', label: 'Sửa món' },
  approve: { icon: 'check', tone: 'green', label: 'Duyệt đánh giá' },
  user: { icon: 'users', tone: 'blue', label: 'Người dùng mới' },
  lock: { icon: 'lock', tone: 'rose', label: 'Khoá tài khoản' },
  add: { icon: 'plus', tone: 'green', label: 'Thêm mới' },
  reply: { icon: 'mail', tone: 'purple', label: 'Phản hồi' },
  delete: { icon: 'trash', tone: 'rose', label: 'Xoá' },
  login: { icon: 'login', tone: 'gray', label: 'Đăng nhập' },
};
