# Backend — Hôm Nay Ăn Gì?

PHP thuần (không framework, không Composer) chạy thẳng trên XAMPP. Toàn bộ dữ liệu của bảng quản trị nằm ở đây, giao diện chỉ gọi API.
Hiện dữ liệu lưu trên **MySQL của máy tính**, PHP chạy bằng Apache/XAMPP. `config/config.php` chọn `mysql` mặc định; `HNAG_STORAGE=json` dùng cho kiểm thử JSON hoặc chuyển dữ liệu.

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
│   ├── Storage/               ← DataStore, MySqlStore, MySqlConnection, JsonFileStore, Seeder
│   ├── Core/                  ← App (cấu hình), Router, Request, Session, HttpException
│   └── Support/               ← Str (bỏ dấu tiếng Việt, slug), Paginator
├── config/config.php          ← cấu hình: kiểu lưu trữ, MySQL, phiên, mật khẩu demo
├── data/
│   ├── foods/                 ← dữ liệu món ăn GỐC (mỗi danh mục 1 file JSON + _order.json) — chỉ dùng để khởi tạo CSDL lần đầu
│   └── seed/                  ← dữ liệu mẫu khởi tạo CSDL lần đầu (sinh bằng scripts/export_seed.js)
├── database/schema.sql        ← cấu trúc MySQL + bảng app_storage_meta giữ thứ tự và trạng thái đồng bộ
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
2. Với MySQL, database phải có schema và dữ liệu đã import (xem bên dưới). Apache và MySQL có thể thuộc hai bản cài đặt riêng, chỉ cần cấu hình đúng host/cổng. Nếu Apache trỏ trực tiếp vào thư mục dự án thì mở `http://localhost/frontend/`; nếu đặt dự án trong `htdocs/Web-Application` thì mở `http://localhost/Web-Application/frontend/`. Xóa file JSON không đặt lại dữ liệu MySQL.
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

Giao diện admin gọi API PHP thật; cần mở qua HTTP với Apache hoặc `php -S`.

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

## MySQL trên máy tính

1. Khởi động MySQL đã cài trên máy và Apache trong XAMPP. PHP cần bật `pdo_mysql`.
2. Điền `mysql` trong `config/config.php`: host, port, dbname, user, password. Có thể ghi đè bằng `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`.
3. Database mới: import `database/schema.sql` bằng phpMyAdmin hoặc MySQL client, rồi chạy `C:\xampp\php\php.exe backend\scripts\import_json_to_mysql.php`. Script luôn đọc nguồn JSON, kể cả khi website đã chọn MySQL; từ chối database có dữ liệu. `--force` xóa dữ liệu đích trước khi nạp lại.
4. Database đã import: **không import lại**. Chạy `C:\xampp\php\php.exe backend\scripts\mysql_setup.php` để sao lưu SQL và thêm bảng metadata. Script giữ dữ liệu nghiệp vụ và có thể chạy lại. Nguồn JSON chỉ dùng một lần ở bước setup để lấy thứ tự; lúc website hoạt động, dữ liệu đọc/ghi từ MySQL.
5. Chọn `storage => mysql` trong cấu hình (mặc định). `App::store()` trả `MySqlStore`, ánh xạ schema SQL thành dữ liệu mà Repository/Service/frontend đang sử dụng.

Các API thay đổi dữ liệu chạy trong một transaction, có khóa ghi theo database trước khi đọc để các thao tác cấp ID/đọc-sửa-ghi không ghi đè nhau. Tầng lưu trữ chỉ INSERT/UPDATE các bản ghi thay đổi và DELETE các bản ghi bị xóa, không TRUNCATE toàn bảng. Khóa này bảo vệ các request của ứng dụng; SQL được sửa trực tiếp bằng công cụ khác không dùng khóa ứng dụng. Cách này phù hợp quy mô hiện tại; để tăng khả năng xử lý đồng thời có thể chuyển tiếp từng Service sang truy vấn và khóa theo bản ghi.

`app_storage_meta` giữ thứ tự danh sách, thứ tự liên kết món, các khóa dữ liệu đã lưu/xóa và dữ liệu riêng của tài khoản admin (admin không có khóa ngoại vào bảng users). Dữ liệu nghiệp vụ chính vẫn nằm ở `foods`, `users`, `restaurants`, `user_state` và các bảng liên quan.

Sao lưu trong admin tạo `storage/backups/mysql-*.sql` gồm schema và dữ liệu. Khôi phục vào một database **trống**, sau đó sửa `dbname` để chọn database đã khôi phục. Đặt lại dữ liệu demo sao lưu trước, rồi xóa và nạp seed trong transaction; không chạy thao tác này nếu muốn giữ dữ liệu hiện tại.

## Sinh lại dữ liệu mẫu

Khi đổi dữ liệu khởi tạo ở `data/foods/`: `node backend/scripts/export_seed.js`. Seed chỉ có hiệu lực với database mới hoặc khi chủ động đặt lại demo. Món đang chạy sửa ở Bảng quản trị sẽ được lưu vào MySQL.

## Kiểm thử

```
node backend/tests/run-mysql.js         109 kiểm tra API + kiểm tra transaction, ghi đồng thời, state, backup/restore và reset trên database hnag_test_* riêng, tự dọn sau test
node tools/tests/run.js                 chạy các test JSON/giao diện (ép HNAG_STORAGE=json, dữ liệu TẠM cho từng test)
node tools/tests/run.js backend-api     109 kiểm tra API: phân quyền, số liệu khớp dữ liệu dự án, thêm/sửa/xoá, xác thực dữ liệu, món công khai, dữ liệu người dùng, góp ý, đánh giá
node tools/tests/run.js user-sync       13 kiểm tra đồng bộ giữa 2 trình duyệt, đăng xuất dọn dữ liệu, chuyển dữ liệu cũ lên tài khoản
node tools/tests/run.js admin-e2e-http  23 kiểm tra trên trình duyệt thật: đăng nhập, dashboard, lưu món, hết phiên
```
