# 🍜 Hôm Nay Bạn Muốn Ăn Gì?

Đồ án giữa kỳ — Website gợi ý món ăn ngẫu nhiên theo bữa ăn, ngân sách, khẩu vị và chế độ ăn, giúp người dùng quyết định "hôm nay ăn gì" chỉ trong vài giây.

> Ghi chú: repo này ban đầu tạo từ template "DOM Manipulation & Event Handling" — đã đổi sang dự án thật của nhóm, dùng React/Next.js.

## 🎯 Ý tưởng
Mỗi ngày, việc quyết định ăn gì tốn không ít thời gian. Website này giải quyết đúng vấn đề đó bằng công cụ gợi ý ngẫu nhiên có tiêu chí, kết hợp giao diện đẹp và hiệu ứng động mượt mà.

## 🛠️ Công nghệ
- Next.js + React + TypeScript
- Tailwind CSS
- Framer Motion (animation)
- Dữ liệu: `foods.json` tĩnh cho giai đoạn demo, có thể mở rộng backend sau

## 👥 Thành viên & phân công
| Thành viên | Vai trò |
|---|---|
| **Người A** | Frontend, UI/UX, Animation, Responsive |
| **Người B** | Data, Logic (Filter/Search/Random), Testing, Deploy |

## 📄 5 trang demo (giai đoạn hiện tại)
1. Trang chủ (Home)
2. Gợi ý ngay (Random)
3. Khám phá (Explore)
4. Chi tiết món ăn (Dish Detail)
5. Giới thiệu & Liên hệ

## 🚧 Trạng thái hiện tại
Đang dựng 5 trang demo bằng dữ liệu mock để trình bày giảng viên — hạn: **20/09/2026**.
Sau demo sẽ tiếp tục nối logic thật (thuật toán gợi ý, filter/search, favorites) theo timeline đầy đủ của nhóm.

## 📂 Cấu trúc thư mục (dự kiến)
```
/app hoặc /pages       → các trang: home, goi-y, kham-pha, mon-an/[id], gioi-thieu
/components            → Button, Card, Badge, FilterChip, FoodCard, Header, Footer...
/data/foods.json       → dữ liệu món ăn mẫu (30-50 món)
/lib                   → hàm filter, search, random
/styles                → cấu hình Tailwind, design tokens
```

## 🔀 Git workflow (giai đoạn 3 ngày demo)
- Nhánh `main` — code ổn định.
- Nhánh `feature/frontend` — Người A.
- Nhánh `feature/logic` — Người B.
- Commit & push tối thiểu 2 lần/ngày, pull code của nhau vào cuối ngày để tránh conflict.
