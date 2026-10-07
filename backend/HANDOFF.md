# Bàn giao backend — Hôm Nay Ăn Gì?

Tài liệu cho người phụ trách **backend** (PHP + MySQL). Frontend do người khác làm; hai bên chỉ giao tiếp qua **API** và **CSDL** như mô tả ở đây.
Cách chạy, cấu trúc thư mục, danh sách hành động API: xem [README.md](README.md).

## 1. Ranh giới

| Thuộc backend (bạn) | Thuộc frontend (không sửa ở đây) |
|---|---|
| Toàn bộ thư mục `backend/`: API, Service, Repository, **database** (`database/schema.sql`, `data/`, `storage/`), cấu hình, test backend (`backend/tests/`) | `frontend/` (user + admin), `tools/build/` (sinh HTML), `tools/tests/` (test giao diện) |

- **Frontend không chứa dữ liệu nào.** Mọi dữ liệu (món ăn, người dùng, đánh giá, cài đặt, thống kê…) đến từ API. Đừng đòi frontend lưu hộ.
- Khi cần **đổi API** (tên hành động, tham số, dạng dữ liệu trả về): báo frontend trước, đổi xong cập nhật `backend/tests/backend-api.js`. Nếu chỉ **thêm** trường mới vào phản hồi thì an toàn, frontend bỏ qua trường lạ.
- Dạng dữ liệu hiện tại là "hợp đồng": mẫu thật nằm ở `backend/data/seed/*.json` (mỗi file một bảng), và ở các Service trong `src/Services/`.

## 2. Hợp đồng API mà frontend đang dựa vào

- Mọi endpoint: `POST <endpoint>?action=<hành động>`, thân JSON, trả `{ "data": ... }` hoặc `{ "error": "thông báo tiếng Việt" }`. Thông báo lỗi được frontend hiện **nguyên văn** cho người dùng nên phải là tiếng Việt, ngắn, dễ hiểu.
- Mã HTTP mà frontend xử lý riêng: **401** (hết phiên → admin tự về trang đăng nhập rồi quay lại trang cũ), **403** (không đủ quyền / tài khoản bị khoá), 404, 409, 422, 429; còn lại coi là lỗi chung.
- Thời gian: **mili-giây kể từ 1970** (số nguyên), ví dụ `createdAt: 1790403130124`.
- Phân trang: `{ items, total, page, pages, pageSize }` (đầu vào `page`, `pageSize`).
- Phiên: cookie PHP (`HNAGSESSID`, HttpOnly, SameSite=Lax); frontend luôn gửi `credentials: 'include'`, cùng origin. **Không dùng CORS** (frontend và backend chung một máy chủ).
- `foods.php` (GET) phải luôn trả **script hợp lệ** `const allFoods = [...]` (kể cả khi lỗi thì trả `[]` + `console.error`) vì các trang nạp nó đồng bộ bằng thẻ `<script>`.

| Endpoint | Frontend nào gọi | Ghi chú quan trọng |
|---|---|---|
| `api/auth` | trang đăng nhập/đăng ký, đăng xuất, admin | `login` trả `{ email, name, role: 'admin' \| 'user' }`; frontend chỉ tin `role` từ đây để **vẽ** giao diện, quyền thật do server kiểm tra ở mỗi lời gọi |
| `api/public` | trang ngoài, trang chi tiết món | không cần đăng nhập; `feedback.create`, `foods.list`, **`recipe.stats`** (mới, xem P0). `reviews.forFood` **không còn dùng** |
| `api/public/foods.php` | **mọi trang người dùng** | dạng món: `id, name, englishName, description, category, mealType[], price, priceRange, taste[], dietary[], region, cookTimeMinutes, calories, rating, reviewCount, image, tags[], popular, nutrition{protein,carbs,fat}, ingredients[{name,amount}], instructions[], suggestedRestaurants[{name,address,city,priceEstimate}]` — **không được đổi tên/bỏ trường** (code web người dùng đọc trực tiếp) |
| `api/user` | mọi trang người dùng khi đã đăng nhập | `state.get/save` cho 6 khoá cố định; frontend đẩy tự động sau ~0,3 giây mỗi lần đổi, nên `state.save` phải nhanh và chịu được gọi dồn. **Mới:** `recipe.mine`, `recipe.submit` (xem P0). `reviews.create` **không còn dùng** |
| `api/admin` | 11 trang admin | 33 hành động hiện có, xem `api/admin/index.php`; dạng trả về từng hành động xem `src/Services/*` và test `backend/tests/backend-api.js`. **Mới:** `recipe.quality.list`, `recipe.quality.get` (xem P0). `reviews.*` **không còn dùng** |

Các dạng dữ liệu chính (khoá là cái frontend admin đọc):
- **Món (admin)**: như trên + `no`, `status ('visible'|'hidden'|'pending')`, `stats{views,spins,favorites}`, `createdBy`, `createdAt`, `updatedAt`.
- **Người dùng**: `id, name, email, joinedAt, favorites (số), hasHealthProfile, role ('member'|'moderator'), status ('active'|'unverified'|'locked')` (+ `lastActiveAt`; **không bao giờ** trả `passwordHash`).
- **Đánh giá (CŨ, sẽ bỏ)**: `id, userName, foodId, foodName, stars, text, createdAt, status, reply` — frontend đã ngừng dùng, xem P0. Dữ liệu này có thể xoá cùng bảng `reviews` sau khi bạn xác nhận.
- **Góp ý**: `id, name, email, subject, subjectLabel, message, createdAt, status ('new'|'replied'), reply`.
- **Nhật ký**: `id, type ('edit'|'approve'|'user'|'lock'|'add'|'reply'|'delete'|'login'), actor, text, ip, ts`.
- **Cài đặt**: `general{platformName,tagline,contactEmail,timezone,maintenance}`, `admins[{id,name,email,role}]`, `notify{…}`, `security{…}`, `backup{last,freq}`.

## 3. Việc backend còn lại (đã tách riêng cho bạn)

Ưu tiên **P1** làm trước vì frontend đang chờ hoặc là rủi ro bảo mật.

### P0 — Phản hồi nấu thử công thức (MỚI, frontend đang làm song song, cần làm sớm nhất)

**Bối cảnh.** Thay cho khu "Đánh giá & nhận xét" (sao + chữ) ở trang chi tiết món, người dùng nay phản hồi sau khi **nấu thử**: từng nguyên liệu có vừa đủ không, vị ra sao, có hợp khẩu vị không. Mục đích: biết **công thức/định lượng nguyên liệu do mình soạn có chuẩn không** và món nào cần chỉnh. Admin có trang mới "Chất lượng công thức" (`frontend/admin/cong-thuc.html`). Frontend đã làm xong theo hợp đồng bên dưới và đang **chờ** các API này (chưa có thì web tự ẩn khu nấu thử, trang admin báo "Backend chưa hỗ trợ" — không hỏng).

**Quy ước chung.** Mỗi người dùng chỉ có **1 phản hồi cho mỗi món**, gửi lại là **ghi đè** (cập nhật). `COOK_MIN = 5` (đặt thành hằng số trong cấu hình): số lượt tối thiểu để công khai số tổng hợp. Chỉ tính món đang `visible`. Ghi chú (`note`) **không bao giờ hiện công khai**, chỉ admin đọc.

**1. `api/user` — `recipe.mine` `{ foodId }`** → `null` (chưa phản hồi) hoặc đúng object đã lưu như `recipe.submit` bên dưới (thêm `updatedAt`). Yêu cầu đăng nhập (401 nếu chưa).

**2. `api/user` — `recipe.submit`** (yêu cầu đăng nhập; upsert) đầu vào:
```json
{
  "foodId": "pho-bo-ha-noi",
  "portions": 2,
  "ingredients": [ { "index": 0, "status": "ok" }, { "index": 4, "status": "less", "note": "thay quế bằng hồi" } ],
  "taste": { "salty": "high", "sweet": "ok", "spicy": null },
  "fit": true,
  "difficulty": "easy",
  "time": "slower",
  "note": "Nêm nhạt hơn thì ngon hơn"
}
```
Quy tắc kiểm tra (sai → 422 với thông báo tiếng Việt): `foodId` tồn tại và `visible` (404 nếu không); `portions` nguyên 1–10; `ingredients[].index` là chỉ số hợp lệ trong `food.ingredients` (0-based), không trùng, `status ∈ {ok, less, more}` (`less` = nên **giảm**, `more` = nên **tăng**), `note` ≤ 80 ký tự; `taste.salty|sweet|spicy ∈ {low, ok, high, null}`; **`fit` bắt buộc**, kiểu boolean; `difficulty ∈ {easy, medium, hard, null}`; `time ∈ {faster, same, slower, null}`; `note` tổng ≤ 300 ký tự. Trả `{ "ok": true, "updatedAt": <ms> }`. Nên giới hạn tần suất (ví dụ 20 lượt gửi/giờ/tài khoản).

**3. `api/public` — `recipe.stats` `{ foodId }`** (không cần đăng nhập). Số liệu tổng hợp trên **tất cả** phản hồi của món:
- Nếu `cooks < COOK_MIN`: trả **chỉ** `{ "foodId": "...", "cooks": 3, "enough": false }` (server phải giấu chi tiết, đừng để frontend tự ẩn).
- Ngược lại:
```json
{
  "foodId": "pho-bo-ha-noi", "cooks": 34, "enough": true, "fitRate": 79,
  "ingredients": [ { "index": 0, "total": 30, "ok": 25, "less": 3, "more": 2 } ],
  "taste": { "salty": { "low": 3, "ok": 20, "high": 9 }, "sweet": { "low": 1, "ok": 25, "high": 2 }, "spicy": { "low": 5, "ok": 15, "high": 4 } },
  "difficulty": { "easy": 20, "medium": 12, "hard": 2 },
  "time": { "faster": 6, "same": 20, "slower": 8 }
}
```
`fitRate` = làm tròn `100 × số phản hồi fit=true / cooks`. `ingredients[].total` = số phản hồi **có chọn** trạng thái cho nguyên liệu đó (không phải `cooks`); nguyên liệu nào `total < COOK_MIN` thì vẫn trả nhưng frontend sẽ không hiện phần trăm. Các nhóm `taste/difficulty/time` chỉ đếm người **có trả lời** (bỏ `null`).

**4. `api/admin` — `recipe.quality.list`** `{ status?: 'all'|'review'|'ok'|'low-data', q?, sort?: 'cooks'|'fit'|'issue', page, pageSize }` → phân trang chuẩn `{ items, total, page, pages, pageSize }` cộng `summary`:
```json
{
  "items": [ { "foodId": "pho-bo-ha-noi", "foodName": "Phở Bò Hà Nội", "image": "...", "cooks": 34, "fitRate": 79, "status": "review",
               "topIssue": { "index": 3, "name": "Hành tây, hành tím nướng", "kind": "less", "percent": 42 } } ],
  "summary": { "totalCooks": 210, "fitRate": 81, "recipesToReview": 4 }
}
```
Quy tắc `status` (quyết định ở **server** để frontend không tự tính): `low-data` nếu `cooks < COOK_MIN`; `review` nếu có nguyên liệu với `total ≥ COOK_MIN` mà `(less+more)/total ≥ 0,30` **hoặc** `fitRate < 60`; còn lại `ok`. `topIssue` = nguyên liệu lệch nhiều nhất (`percent` = `less/total` hoặc `more/total` lớn hơn, làm tròn, `kind` tương ứng); `null` nếu không có. Mặc định sắp xếp: `review` lên đầu rồi theo `cooks` giảm dần. `fitRate` là `null` khi `cooks = 0`. Trả **cả món chưa có ai nấu** (`cooks: 0`, `status: 'low-data'`) để admin thấy món nào chưa có dữ liệu.

**5. `api/admin` — `recipe.quality.get`** `{ foodId }` → chi tiết đầy đủ (không bị giấu bởi `COOK_MIN`):
```json
{
  "food": { "id": "pho-bo-ha-noi", "name": "Phở Bò Hà Nội" }, "cooks": 34, "fitRate": 79, "status": "review",
  "ingredients": [ { "index": 0, "name": "Bánh phở tươi", "amount": "200g", "total": 30, "ok": 25, "less": 3, "more": 2 } ],
  "taste": { "...": "như recipe.stats" }, "difficulty": { "...": "" }, "time": { "...": "" },
  "notes": [ { "id": 12, "userName": "Nguyễn Văn An", "portions": 2, "fit": true, "text": "Nêm nhạt hơn thì ngon hơn", "createdAt": 1790403130124 } ]
}
```
`notes`: chỉ các phản hồi có `note` hoặc ghi chú riêng ở nguyên liệu (gộp thành câu, ví dụ `"Quế: thay bằng hồi"`), mới nhất trước, tối đa 50.

**6. Cập nhật các hành động sẵn có** (frontend sẽ đọc nếu có, không có thì bỏ qua): `counts` thêm `recipesToReview` (số món `status='review'`; hiện ở huy hiệu menu và chuông thông báo); `dashboard` → `attention.recipesToReview` (cùng số đó).

**7. Bỏ khỏi web nhưng chưa xoá**: `reviews.create` (user), `reviews.forFood` (public), và `reviews.list|setStatus|reply|stats` (admin — riêng `reviews.stats` vẫn được dùng để lấy số góp ý `feedbackTotal|feedbackNew`, nên **giữ `reviews.stats`** hoặc báo frontend để chuyển sang `feedback.stats`). Frontend không còn gọi các hành động còn lại; bạn xoá khi tiện, kèm bảng `reviews` và các kiểm tra tương ứng trong `backend/tests/backend-api.js`. Điểm `rating`/`reviewCount` của món (trong `foods`) từ nay **không còn được cập nhật** — giữ nguyên số gốc.

**8. Gợi ý lưu trữ.** JSON: bảng `recipe_feedback` (mỗi dòng 1 người + 1 món, có `userId`, `userName`, `foodId`, các trường trên, `createdAt`, `updatedAt`). MySQL: `recipe_feedback(user_id, food_id, portions, fit, difficulty, time_actual, taste JSON, note, updated_at, PRIMARY KEY (user_id, food_id))` và `recipe_feedback_items(user_id, food_id, ingredient_index, status, note)`. Thêm vào `database/schema.sql` và script import.

**Khi xong:** thêm test vào `backend/tests/backend-api.js` (kiểm tra ngưỡng giấu số liệu, ghi đè phản hồi, quy tắc `status`, 401/403/404/422), rồi báo frontend; test giao diện `tools/tests/cook-feedback.js` và `tools/tests/admin-recipes.js` hiện chạy bằng **bản giả lập** đúng hợp đồng này — khi backend thật xong hãy chạy thêm `node tools/tests/run.js cook-feedback admin-recipes` với `REAL_API=1` (frontend sẽ cung cấp cờ này) để kiểm chứng.

### P1
1. **Chuyển sang MySQL — đã hoàn thiện.** `App::store()` dùng `MySqlStore` theo cấu hình, ánh xạ các bảng quan hệ thành dữ liệu API hiện tại. Ghi từng bản ghi thay đổi trong transaction, có khóa ứng dụng theo database trước bước đọc-sửa-ghi. `scripts/mysql_setup.php` nâng cấp database đã import mà giữ dữ liệu; `node backend/tests/run-mysql.js` chạy 109 kiểm tra API và các kiểm tra transaction/đồng thời/state/backup/restore/reset trên database test riêng. Service vẫn lọc trong bộ nhớ; tối ưu truy vấn trực tiếp theo từng nghiệp vụ là việc tiếp theo (mục 12).
2. **Ghi sự kiện để thống kê thật.** Hiện Dashboard/Thống kê có số **ước lượng** (`PLACEHOLDER` trong `src/Services/StatsService.php`): biểu đồ theo ngày/thứ, lượt quay/xem/thả tim theo thời gian, tỉ lệ chốt món, % so với kỳ trước. Cần: bảng sự kiện + endpoint nhận sự kiện từ web (đề xuất `api/public` hành động `events.track { type: 'view'|'spin'|'favorite'|'pick', foodId, meal? }`, chống spam theo IP/phiên), rồi viết lại `StatsService` tính từ đó và cộng dồn vào `foods.stats`. **Khi endpoint xong, báo frontend để nối phía web** (frontend sẽ gọi ở: xem chi tiết món, quay vòng quay/mở hộp quà, thả tim, chốt món).
3. **Bảo vệ đăng nhập**: giới hạn số lần đăng nhập sai (theo IP + email, khoá tạm), bắt buộc HTTPS + cờ `Secure` cho cookie khi lên máy chủ thật, chống fixation đã có (`session_regenerate_id`). Thêm **đổi mật khẩu** (người dùng và admin) và **quên mật khẩu** nếu cần — hiện chưa có; frontend sẽ thêm form khi có API.
4. **Đổi mật khẩu demo** (`admin123`, `123456` trong `config/config.php`) trước khi đưa lên môi trường thật; bỏ hẳn dữ liệu mẫu khỏi bản chạy thật.
5. **Kiểm tra `.htaccess` trên Apache thật**: mở `http://<host>/backend/storage/db/users.json` phải ra **403**. Tốt hơn: đặt `storage_dir` (hoặc file dữ liệu/MySQL) **ngoài thư mục web**.

### P2
6. **Các cài đặt đang chỉ được lưu, chưa có tác dụng** (trang Cài đặt admin): `general.maintenance` (chế độ bảo trì — cần: `foods.php`/`public` và web người dùng trả trạng thái bảo trì, chỉ admin vào được; báo frontend để làm trang bảo trì), `notify.*` (gửi email khi có đánh giá chờ duyệt / người dùng mới / báo cáo tuần), `security.twoFactor`, `security.autoLogout` (hiện phiên cố định 8 giờ), `security.ipRestrict`, `general.timezone`. Quyết định cái nào làm thật, cái nào bỏ khỏi giao diện (báo frontend để gỡ).
7. **Phân quyền admin theo vai trò**: hiện `super` và `moderator` (điều hành viên) quyền như nhau. Định nghĩa moderator được làm gì (ví dụ không xoá món, không đổi cài đặt/quản trị viên) và trả 403 tương ứng; frontend sẽ ẩn nút theo `role` từ `me`.
8. **Ảnh món**: hiện ảnh admin tải lên được thu nhỏ ở trình duyệt và lưu dạng data URL trong dữ liệu (≤ 2,5 MB). Nên có endpoint upload thật (lưu file vào thư mục, kiểm tra loại/kích thước, trả đường dẫn) — báo frontend để đổi phần tải ảnh.
9. **Sao lưu/khôi phục**: MySQL đã có sao lưu SQL gồm schema và dữ liệu (`storage/backups/mysql-*.sql`), khôi phục vào database trống bằng MySQL client; chưa có giao diện khôi phục hoặc sao lưu tự động theo lịch (`backup.freq` đang là chữ hiển thị).
10. **Gửi phản hồi qua email**: admin trả lời góp ý hiện chỉ lưu vào hệ thống, chưa gửi mail cho người gửi.
11. **Hiệu năng công khai**: `foods.php` đọc và dựng lại toàn bộ danh sách mỗi lần tải trang (~90 KB, `no-cache`). Thêm `ETag`/`Last-Modified` (trả 304) hoặc cache theo thời điểm sửa món.
12. **Tìm kiếm/lọc trên MySQL**: hiện lọc trong bộ nhớ (bỏ dấu bằng `Support/Str`). Trên MySQL dùng collation `utf8mb4_unicode_ci` / cột đã chuẩn hoá / FULLTEXT (đã có `ft_foods_name` trong schema).

### P3
13. Quản lý người dùng: xoá tài khoản, đặt lại mật khẩu, đổi vai trò (frontend hiện chỉ có xem + khoá/mở khoá). **Đổi tên hiển thị** ở trang Tài khoản của web hiện chỉ đổi trong trình duyệt (server không biết, đăng nhập lại sẽ về tên cũ) → cần API `profile.update {name}` trong `api/user`; báo frontend để nối.
14. Nhật ký: lấy IP thật khi chạy sau proxy (`X-Forwarded-For` có kiểm soát), giới hạn dung lượng/thời gian lưu (hiện giữ 5.000 sự kiện gần nhất).
15. **Danh mục động cho web người dùng (frontend đã làm xong phía web, đang chờ backend).** Trong `api/public/foods.php`, ngoài `const allFoods`, hãy phát thêm **một dòng** `const allCategories = [{ "slug": "mon-nuoc", "label": "Món nước" }, ...];` lấy từ `taxonomy.CATEGORIES` (đúng thứ tự admin sắp xếp, chỉ cần `slug` và `label`). Web đọc biến này (`frontend/user/js/core/categories.js`): tên danh mục admin sửa/đổi sẽ hiện ngay ở bộ lọc "Khám phá", ô bento Trang chủ và nhãn trên thẻ món; danh mục không có món hiển thị thì tự ẩn. Chưa có biến này thì web dùng danh sách mặc định 7 danh mục nên **không hỏng**. Đã có test giả lập trong `tools/tests/categories.js`; khi làm xong hãy thêm 1 kiểm tra vào `backend/tests/backend-api.js` (foods.php có chứa `const allCategories`).
16. ~~Đánh giá từ web~~: **không còn dùng** — thay bằng phản hồi nấu thử (P0). Chống spam của phản hồi nấu thử nằm trong P0 mục 2.

## 4. Frontend sẽ làm khi backend xong từng mục

| Khi backend có | Frontend làm |
|---|---|
| Sự kiện (mục 2) | gọi `events.track` ở web người dùng; Dashboard/Thống kê hết nhãn ước lượng |
| Đổi/quên mật khẩu (3) | thêm form ở Tài khoản và trang đăng nhập |
| Bảo trì (6) | trang thông báo bảo trì |
| Phân quyền vai trò (7) | ẩn/khoá nút admin theo `role` |
| Upload ảnh (8) | đổi khung tải ảnh ở trang Sửa món |
| `allCategories` trong foods.php (15) | không cần làm gì thêm — web đã đọc sẵn; chỉ kiểm tra lại bằng mắt |
| **Phản hồi nấu thử (P0)** | không cần làm gì thêm — web và trang admin "Chất lượng công thức" đã làm xong theo hợp đồng; chạy `cook-feedback` và `admin-recipes` với API thật để kiểm chứng, sau đó có thể thay thẻ KPI "Đánh giá trung bình" của Dashboard bằng "% hợp khẩu vị" (báo frontend) |

## 5. Cách làm việc và kiểm thử

```
C:\xampp\php\php.exe -S 127.0.0.1:8099 -t .           chạy thử nhanh ở thư mục gốc dự án (hoặc dùng XAMPP)
node backend/tests/run-mysql.js                       API + lưu trữ MySQL, database hnag_test_* riêng
node tools/tests/run.js backend-api                   109 kiểm tra API JSON, dữ liệu tạm
node tools/tests/run.js                               toàn bộ test (backend + giao diện) — chạy trước khi báo xong
```

- Thêm hành động mới: khai báo trong `api/<nhóm>/index.php` → Controller → Service → Repository, **viết test** trong `backend/tests/backend-api.js`.
- Đổi dữ liệu khởi tạo: `node backend/scripts/export_seed.js`, dùng seed cho database mới hoặc chủ động đặt lại demo trên MySQL.
- Không sửa file dưới `frontend/` (các trang HTML là file **sinh ra**); cần frontend đổi gì thì ghi vào danh sách ở mục 4.
