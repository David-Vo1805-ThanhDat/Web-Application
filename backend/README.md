# Backend — Hôm Nay Ăn Gì?

PHP thuần (không framework, không Composer) chạy thẳng trên XAMPP. Toàn bộ dữ liệu của bảng quản trị nằm ở đây, giao diện chỉ gọi API.
Hiện dữ liệu lưu bằng **file JSON**; cấu trúc **MySQL** (`database/schema.sql`) và script chuyển dữ liệu đã sẵn sàng để đổi sang MySQL sau này.

**Người phụ trách backend đọc [HANDOFF.md](HANDOFF.md) trước**: ranh giới với frontend, hợp đồng API, danh sách việc còn lại theo mức ưu tiên.

```
backend/
├── api/                       ← CỔNG VÀO (mỗi file là 1 endpoint, chỉ khai báo route)
│   ├── admin/index.php        ← API bảng quản trị (yêu cầu đăng nhập admin)
│   ├── auth/index.php         ← đăng nhập / đăng ký / đăng xuất / me (dùng chung user + admin)
│   ├── user/index.php         ← dữ liệu riêng của người dùng đã đăng nhập (yêu thích, hồ sơ sức khỏe...) + gửi đánh giá
│   └── public/                ← công khai: foods.php (phát `allFoods` cho web người dùng), index.php (foods.list, feedback.create, reviews.forFood)
├── src/                       ← MÃ NGUỒN, chia lớp (namespace App\)
│   ├── Controllers/           ← nhận tham số từ API, gọi Service, trả dữ liệu (mỏng)
│   ├── Services/              ← LOGIC NGHIỆP VỤ: kiểm tra dữ liệu, quy tắc (không xoá món đang trong thực đơn sức khỏe...), ghi nhật ký
│   ├── Repositories/          ← LỚP DUY NHẤT chạm vào nơi lưu dữ liệu (mỗi bảng 1 repository)
│   ├── Storage/               ← DataStore (giao diện), JsonFileStore (đang dùng), Seeder (dữ liệu mẫu + mật khẩu demo)
│   ├── Core/                  ← App (cấu hình), Router, Request, Session, HttpException
│   └── Support/               ← Str (bỏ dấu tiếng Việt, slug), Paginator
├── config/config.php          ← cấu hình: kiểu lưu trữ, MySQL, phiên, mật khẩu demo
├── data/
│   ├── foods/                 ← dữ liệu món ăn GỐC (mỗi danh mục 1 file JSON + _order.json) — chỉ dùng để khởi tạo CSDL lần đầu
│   └── seed/                  ← dữ liệu mẫu khởi tạo CSDL lần đầu (sinh bằng scripts/export_seed.js)
├── database/schema.sql        ← cấu trúc MySQL (21 bảng) cho khi chuyển sang MySQL
├── scripts/
│   ├── seed/                  ← bộ sinh dữ liệu mẫu (trạng thái/thống kê món, người dùng, đánh giá, góp ý, nhật ký, cài đặt)
│   ├── export_seed.js         ← gộp data/foods + chạy seed/ → data/seed/*.json
│   └── import_json_to_mysql.php ← chuyển toàn bộ dữ liệu hiện tại sang MySQL
├── tests/backend-api.js       ← 109 kiểm tra API (chạy: node tools/tests/run.js backend-api)
└── storage/                   ← (tự sinh, không đưa lên git) db/*.json = dữ liệu đang chạy, backups/ = bản sao lưu
```

Luồng một yêu cầu: `api/<nhóm>/index.php` → `Router` (kiểm tra đăng nhập/quyền) → `Controller` → `Service` → `Repository` → `DataStore`.

## Chạy

1. **XAMPP**: trỏ Apache vào thư mục dự án (xem README gốc), bấm Start. Mở `http://localhost:8080/frontend/` (theo cổng bạn đặt).
   Hoặc không cần Apache: `C:\xampp\php\php.exe -S 127.0.0.1:8099 -t .` (chạy ở thư mục gốc dự án) rồi mở `http://127.0.0.1:8099/frontend/`.
2. Lần chạy đầu, backend tự tạo `storage/db/*.json` từ `data/seed/`. **Xoá thư mục `storage/`** (hoặc Cài đặt → "Xoá toàn bộ dữ liệu demo") để quay về dữ liệu mẫu.
3. Đăng nhập ở `frontend/user/dang-nhap.html`:

| Tài khoản | Mật khẩu | Vào đâu |
|---|---|---|
| `admin@homnayangi.vn` (Super admin) | `admin123` | Bảng quản trị |
| `thuha.pham@gmail.com` (Điều hành viên) | `admin123` | Bảng quản trị |
| `nguyenvana@gmail.com` và 1.283 người dùng mẫu khác | `123456` | Trang chủ |
| Đăng ký mới | tự đặt (≥ 6 ký tự) | Trang chủ |

**Bảo vệ dữ liệu khi chạy bằng Apache**: `backend/.htaccess` chặn truy cập trực tiếp qua URL vào mọi thứ trừ `api/` (nếu không, ai cũng tải được `storage/db/users.json` chứa mật khẩu băm). Cần Apache bật `AllowOverride All` cho thư mục dự án (mặc định của XAMPP đã có; nếu bạn tự đổi `<Directory>` thì giữ dòng này). Khi đưa lên máy chủ thật, nên đặt `storage_dir` ở NGOÀI thư mục web.
Với `php -S` (chỉ để phát triển) không có lớp bảo vệ này.

Đổi mật khẩu demo ở `config/config.php` (chỉ áp dụng khi khởi tạo dữ liệu). **Trước khi đưa lên môi trường thật phải đổi mật khẩu quản trị.**

Giao diện admin ở chế độ `auto` (`frontend/admin/js/core/config.js`): mở qua http và có PHP → gọi API này; mở bằng `file://` hoặc không có PHP → dùng dữ liệu mẫu trong trình duyệt.

## API

`POST backend/api/admin/index.php?action=<hành động>` với thân JSON, trả `{ "data": ... }` hoặc `{ "error": "..." }` (kèm mã HTTP 401 chưa đăng nhập, 403 không phải admin, 404, 409 xung đột, 422 dữ liệu sai).
Hành động admin: `me, counts, search, dashboard, stats, foods.{filterOptions,list,get,save,remove,bulk}, taxonomy.{get,save,remove}, restaurants.{list,stats,save,remove}, users.{stats,list,get,setStatus}, reviews.{stats,list,setStatus,reply}, feedback.{list,reply}, settings.{get,save,backup,resetDemo}, audit.list`.

| Endpoint | Ai gọi được | Hành động |
|---|---|---|
| `api/auth/index.php` | mọi người | `login`, `register`, `logout`, `me`, `ping` |
| `api/public/index.php` | mọi người (không cần đăng nhập) | `foods.list` (JSON), `feedback.create` (góp ý; tối đa 5 lần/giờ/IP), `reviews.forFood` (đánh giá đã duyệt của 1 món) |
| `api/public/foods.php` | mọi người (GET) | phát ra script `const allFoods = [...]` — chỉ món đang **hiển thị**, đúng dạng web người dùng đã dùng; nạp bằng thẻ `<script>` nên trang vẫn chạy đồng bộ |
| `api/user/index.php` | người đã đăng nhập | `state.get`, `state.save {key, value}` (khoá: `favorites`, `healthProfile`, `healthLog`, `foodHistory`, `weeklyPlan`, `group`), `reviews.create {foodId, stars, text}` |
| `api/admin/index.php` | chỉ tài khoản quản trị | các hành động admin ở trên |

**Đánh giá từ web**: gửi lên ở trạng thái "chờ duyệt"; chỉ khi admin duyệt mới hiện công khai và được tính vào điểm/số lượt đánh giá của món (ẩn lại thì gỡ ra). **Dữ liệu người dùng** (`state.*`) tối đa 256 KB mỗi khoá; lưu yêu thích/hồ sơ sức khỏe cũng cập nhật số món yêu thích và trạng thái "có hồ sơ sức khỏe" mà admin thấy ở trang Người dùng.

Bảo mật đã có: mật khẩu băm bằng `password_hash`, không bao giờ trả mật khẩu băm ra API, phiên PHP cookie HttpOnly + SameSite=Lax, kiểm tra và ép kiểu mọi dữ liệu gửi lên,
chỉ nhận JSON qua POST. Chưa có (cần khi đưa lên mạng thật): giới hạn số lần đăng nhập sai, HTTPS bắt buộc, đổi mật khẩu.

## Số liệu nào là thật, số liệu nào là ước lượng

Tính trực tiếp từ dữ liệu dự án: số món/quán/người dùng/đánh giá, phân bố danh mục/vùng/khẩu vị/thẻ, điểm đánh giá trung bình, thành phố, người dùng mới 30 ngày, lượt quay theo bữa (chia theo bữa của từng món).
**Ước lượng (đánh dấu `PLACEHOLDER` trong `Services/StatsService.php`)**: biểu đồ theo ngày/thứ, tỉ lệ chốt món, % thay đổi so với kỳ trước. Lý do: chưa có bảng ghi sự kiện (lượt quay, lượt xem, lượt tim theo thời gian);
sẽ có khi web người dùng gửi sự kiện (quay, xem, thả tim) lên backend — việc này CHƯA làm; hiện web chỉ gửi yêu thích/hồ sơ/đánh giá/góp ý.

## Chuyển sang MySQL

1. Bật MySQL trong XAMPP, tạo CSDL: `C:\xampp\mysql\bin\mysql.exe -u root < backend\database\schema.sql`
2. Chỉnh `config/config.php` → `mysql` (host, user, mật khẩu).
3. Nạp dữ liệu hiện tại: `C:\xampp\php\php.exe backend\scripts\import_json_to_mysql.php` (thêm `--force` để nạp lại). Đã kiểm tra: 31 món, 65 quán, 1.284 người dùng, 342 nhật ký, cả `user_state`, đánh giá và góp ý từ web… khớp 100%.
4. Viết bản MySQL của các Repository (`src/Repositories/*`, dùng PDO — schema đã khớp từng trường) và cho `App::store()` trả về kho MySQL. Chỉ cần sửa tầng Repository, tầng **Service / Controller / API và toàn bộ giao diện giữ nguyên**.

## Sinh lại dữ liệu mẫu

Khi đổi dữ liệu khởi tạo ở `data/foods/`: `node backend/scripts/export_seed.js`, sau đó xoá `storage/` để nạp lại. (Món ăn đang chạy được sửa ở Bảng quản trị, không cần đụng file này.)

## Kiểm thử

```
node tools/tests/run.js                 chạy tất cả (tự dựng php -S với thư mục dữ liệu TẠM cho từng test, không đụng dữ liệu thật)
node tools/tests/run.js backend-api     109 kiểm tra API: phân quyền, số liệu khớp dữ liệu dự án, thêm/sửa/xoá, xác thực dữ liệu, món công khai, dữ liệu người dùng, góp ý, đánh giá
node tools/tests/run.js user-sync       13 kiểm tra đồng bộ giữa 2 trình duyệt, đăng xuất dọn dữ liệu, chuyển dữ liệu cũ lên tài khoản
node tools/tests/run.js admin-e2e-http  23 kiểm tra trên trình duyệt thật: đăng nhập, dashboard, lưu món, hết phiên
```
