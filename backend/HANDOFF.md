# Bàn giao hiện trạng

Cập nhật **12/10/2026** (bản trước: 07/10/2026 — Phong). Project chạy Apache XAMPP + MySQL trên máy, database `hom_nay_an_gi`.
URL: `http://localhost/frontend/` (máy Đạt: Apache cổng 8080 → `http://localhost:8080/frontend/`).
Cài đặt từ đầu, lệnh chạy, lệnh MySQL kiểm tra: [../README.md](../README.md). Chi tiết API/backend: [README.md](README.md).

---

## 1. Hiện trạng tóm tắt

| Phần | Trạng thái | Người làm |
| --- | --- | --- |
| Backend PHP + MySQL (MySqlStore, phiên PHP, API công khai/người dùng/admin, sao lưu SQL) | ✅ chạy | Phong |
| FoodBot (Gemini, SSE) — **chỉ người đã đăng nhập** | ✅ chạy (cần `GEMINI_API_KEY`) | An (chatbot), Đạt (chặn khách) |
| Đăng nhập bằng Google (OAuth + PKCE) | ✅ chạy (cần `GOOGLE_CLIENT_ID/SECRET`) — đã thử thật 11/10 | Đạt (cả backend) |
| Ảnh đại diện người dùng | ✅ chạy | Đạt (cả backend) |
| Form Liên hệ → bảng `feedback` → admin "Đánh giá & góp ý" | ✅ chạy (đã kiểm bằng test) | Phong |
| Phản hồi "Nấu thử món này" (`recipe.*`): trang chi tiết món + trang admin "Chất lượng công thức" | ✅ chạy (12/10, test 51/51) | Đạt (cả backend) |
| Thống kê theo thời gian, quên/đặt lại mật khẩu | ❌ chưa có — xem mục 8 và mục 9 bên dưới | — |

Số liệu database máy Đạt (11/10): 33 món (31 hiển thị, 1 ẩn, 1 chờ duyệt), 1.285 người dùng (1 đã liên kết Google), 2 quản trị viên, 66 quán, 24 góp ý (dữ liệu mẫu), 7 danh mục.

---

## 2. ⚠️ Việc phải làm ngay sau khi kéo code mới (mọi máy)

1. **Chạy 3 migration, đúng thứ tự** (database tạo trước 11/10/2026; mỗi file chạy **một lần**):
   ```sql
   USE hom_nay_an_gi;
   SOURCE C:/.../backend/database/migrations/2026-10-11-google-login.sql;     -- users.google_id
   SOURCE C:/.../backend/database/migrations/2026-10-11-user-avatar.sql;      -- users.avatar
   SOURCE C:/.../backend/database/migrations/2026-10-12-recipe-feedback.sql;  -- bảng mới recipe_feedback
   SHOW COLUMNS FROM users WHERE Field IN ('google_id', 'avatar');            -- phải ra 2 dòng
   SHOW TABLES LIKE 'recipe_feedback';                                         -- phải ra 1 dòng
   ```
   Thiếu bảng `recipe_feedback` thì chỉ tính năng "Nấu thử món này", chuông thông báo và Dashboard admin lỗi (500); các phần khác vẫn chạy.
   Code mới đọc/ghi 2 cột này trong **mọi** thao tác với bảng `users` → thiếu cột thì **đăng nhập/đăng ký bằng mật khẩu cũng lỗi**. (PowerShell không dùng được `mysql ... < file.sql`; dùng `SOURCE` trong mysql hoặc Workbench.)
2. **`backend/.env`** (chép từ `.env.example`, không commit): `GEMINI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Nhóm dùng chung một OAuth client — Đạt gửi riêng 2 dòng Google; Gmail của từng người phải được thêm vào **Test users** (OAuth consent screen).
3. **`backend/config/config.php`**: sửa mật khẩu MySQL của máy mình (hoặc biến môi trường `DB_PASSWORD`) — **không commit** file này khi có mật khẩu thật.
4. Kiểm tra nhanh: `node backend/tests/run-mysql.js`, `node backend/tests/google-login.js`, `node backend/tests/user-avatar.js`, `node backend/tests/recipe-feedback.js` (đều dùng database tạm `hnag_test_*`).

---

## 3. Nguồn dữ liệu (Phong)

MySQL là nguồn dữ liệu duy nhất. Đã bỏ kho JSON, dữ liệu seed, bộ dữ liệu JavaScript, JsonFileStore và các script import/reset demo. Bản sao lưu SQL nằm trong `backend/storage/backups/` (không lên GitHub). File SQL có dữ liệu **không** đưa lên repo — ai clone về cần xin file rồi nạp vào MySQL máy mình.

JavaScript trong frontend là mã giao diện và gọi API. Không lưu dữ liệu nghiệp vụ hoặc danh tính trong localStorage (riêng **nhạc nền** lưu lựa chọn bật/tắt ở localStorage và vị trí nghe ở sessionStorage — chỉ là tuỳ chọn giao diện). `api/auth/bootstrap.php` lấy tài khoản/state từ phiên PHP và database khi mở trang (từ 11/10 kèm `avatar`). `Sync.storage` là lớp bộ nhớ tạm cho trang hiện tại, gửi thay đổi qua `state.save`; tải lại trang hoặc đăng nhập trình duyệt khác đọc lại SQL. Đổi tên/ảnh đại diện dùng `profile.update`.

`api/public/foods.php` xuất cả `allFoods` và `allCategories` từ SQL. Không có danh mục hoặc món mặc định để thay thế khi database lỗi.

---

## 4. Lưu trữ và kiểm tra (Phong, cập nhật 11/10)

MySqlStore cập nhật các dòng thay đổi trong transaction. Khóa ghi theo database được lấy trước bước đọc-sửa-ghi. `app_storage_meta` lưu thứ tự, state riêng của admin và dấu phân biệt state đã xóa/chưa có. Khi đăng nhập, server xác nhận tài khoản còn tồn tại và chưa bị khóa. Từ 11/10 `MySqlStore::MAPS['users']` có thêm `googleId ↔ google_id` và `avatar ↔ avatar` với kiểu mới `'?s'` (chuỗi có thể NULL — cột UNIQUE `google_id` nhận nhiều NULL).

| Lệnh (thư mục gốc) | Phạm vi | Kết quả 11/10/2026 |
| --- | --- | --- |
| `node backend/tests/run-mysql.js` (`database-ui` để thêm test giao diện) | 109 kiểm tra API + 12 kiểm tra MySQL, database tạm | 105 đạt / 4 lỗi¹ (12/10) — **109/109** trên bản sao có mật khẩu mẫu đúng |
| `node backend/tests/chatbot-api.js` | FoodBot, Gemini giả lập | 29/29 |
| `node backend/tests/google-login.js` | Google giả lập + database tạm | 17/17 |
| `node backend/tests/user-avatar.js` | API + giao diện ảnh đại diện, database tạm | 18/18 |
| `node backend/tests/feedback-modal.js` | Hộp thoại Góp ý & liên hệ (giao diện + bảng `feedback`), database tạm | 11/11 |
| `node backend/tests/recipe-feedback.js` | 5 API `recipe.*` (phân quyền, 422, ghi đè, ngưỡng giấu số liệu, quy tắc `review`, giới hạn tần suất), `counts`/`dashboard`, giao diện trang chi tiết món + trang admin Công thức; database tạm | 51/51 |

¹ 3 lỗi có từ trước 11/10, đều ở đăng nhập bằng *tài khoản người dùng mẫu* ("người dùng thường đăng nhập được", "… vào API admin → 403", "tài khoản vừa khoá không đăng nhập được") — mật khẩu mẫu trong database máy Đạt khác mật khẩu test giả định. Từ 12/10 thêm lỗi thứ 4 "users.stats … hoạt động hôm nay" — cùng nguyên nhân (test không đăng nhập được nên trong ngày không ai "hoạt động"). **Đã xác nhận 11/10 và 12/10:** chạy trên bản sao có đặt lại mật khẩu `nguyenvana@gmail.com` về `123456` thì **109/109 đạt** (chi tiết ở mục 9).

Sửa mẫu HTML trong `tools/build/`, rồi chạy `python tools/build/build.py`; JavaScript/CSS frontend sửa trực tiếp. Các fixture giả lập dưới `tools/tests/` chỉ phục vụ test.

---

## 5. Hợp đồng API thêm/đổi từ 10/10 (frontend đang dựa vào)

| Endpoint | Hợp đồng |
| --- | --- |
| `POST api/chat/index.php` | Chỉ người đã đăng nhập. Khách → **403** `"Bạn cần đăng nhập để trò chuyện cùng FoodBot."` (`chatbot.js` dựa vào 403 để hiện lời mời đăng nhập). Trả lời dạng SSE. Biến môi trường `HNAG_CHAT_ALLOW_GUEST=1` bỏ qua kiểm tra — **chỉ cho test**. |
| `GET api/auth/google.php?next=<trang.html>` | Bắt đầu đăng nhập Google → 302 sang Google. Chưa cấu hình → 302 về `frontend/user/dang-nhap.html?google=chua-cau-hinh`. `next` chỉ nhận `ten-trang.html[?...]`, sai thì về `trang-chu.html`. |
| `GET api/auth/google-callback.php` | Google gọi về. Thành công → 302 tới `frontend/user/<next>` (đã mở phiên). Lỗi → `dang-nhap.html?google=<mã>`, mã ∈ `huy`, `het-han`, `quan-tri`, `bi-khoa`, `chua-xac-minh`, `loi` (`auth-google.js` đổi mã thành câu tiếng Việt). Địa chỉ này phải khai trong *Authorized redirect URIs*. |
| `POST api/user/index.php?action=profile.update` | `{ name?, avatar? }` — gửi riêng tên hoặc riêng ảnh đều được; `avatar: null`/`""` = xoá. Ảnh: data URL `image/jpeg|png|webp`, ≤ 150 KB, ≤ 1024px, server giải mã thật (`getimagesizefromstring`) → sai là **422**. Admin gửi `avatar` → 422. Trả `{ name, avatar }` (admin: `{ name }`). |
| `api/auth/bootstrap.php` | `window.APP_USER` thêm `avatar` (null nếu chưa có / admin). Đọc từ database mỗi lần tải trang, **không** cất trong phiên PHP. |
| `api/admin … users.list` | Mỗi người dùng thêm `googleLinked` (bool), `hasAvatar` (bool); **không** trả `googleId`, `avatar`, `passwordHash`. |
| `api/user … recipe.mine` `{ foodId }` | (12/10) `null` hoặc phản hồi đã lưu `{ foodId, portions, ingredients, taste, fit, difficulty, time, note, updatedAt }`. Chưa đăng nhập 401, admin 403, món không có/ẩn 404. |
| `api/user … recipe.submit` | (12/10) Upsert — mỗi người 1 phản hồi/món, gửi lại là ghi đè. Đầu vào `{ foodId, portions` (số nguyên 1–10)`, ingredients: [{ index, status` ok/less/more`, note` ≤ 80`}], taste: { salty, sweet, spicy` low/ok/high/null `}, fit` bool bắt buộc`, difficulty` easy/medium/hard/null`, time` faster/same/slower/null`, note` ≤ 300 `}`. Sai → **422** (câu tiếng Việt). Quá 20 món khác nhau/giờ/tài khoản → 429. Trả `{ ok: true, updatedAt }`. |
| `api/public … recipe.stats` `{ foodId }` | (12/10) Dưới `COOK_MIN` (= 5, cấu hình `recipe_cook_min`) lượt → **chỉ** `{ foodId, cooks, enough: false }`. Đủ → thêm `fitRate`, `ingredients: [{ index, total, ok, less, more }]` (chỉ nguyên liệu có người chọn), `taste`, `difficulty`, `time` (bỏ người trả lời null). Ghi chú không bao giờ trả ra đây. |
| `api/admin … recipe.quality.list` | (12/10) `{ status?` all/review/ok/low-data`, q?, sort?` cooks/fit/issue`, page, pageSize }` → phân trang chuẩn + `summary { totalCooks, fitRate, recipesToReview }`. Mỗi món đang hiện (kể cả chưa ai nấu): `foodId, foodName, image, cooks, fitRate` (null nếu 0 lượt)`, status, topIssue { index, name, kind, percent }` hoặc null. `status`: `low-data` nếu dưới COOK_MIN; `review` nếu có nguyên liệu (từ COOK_MIN phản hồi) lệch (giảm + tăng) ≥ 30% **hoặc** fitRate < 60; còn lại `ok`. Mặc định `review` lên đầu rồi theo số lượt. |
| `api/admin … recipe.quality.get` `{ foodId }` | (12/10) Chi tiết đầy đủ (không bị giấu bởi COOK_MIN): `food, cooks, fitRate, status, ingredients: [{ index, name, amount, total, ok, less, more }], taste, difficulty, time, notes: [{ id, userName, portions, fit, text, createdAt }]` (ghi chú chung + ghi chú nguyên liệu gộp thành "Tên: ghi chú", mới nhất trước, tối đa 50). |
| `api/admin … counts`, `dashboard` | (12/10) Thêm `counts.recipesToReview` và `dashboard.attention.recipesToReview` (số món đang hiện có status `review`) — chuông thông báo + ô "Cần xử lý" của Dashboard. |

---

## 6. ⚠️ Danh sách Phong cần xem lại (code backend do Đạt sửa/thêm)

**Đăng nhập bằng Google** (nhóm chốt chỉ làm Google, không làm Facebook):
- Mới: `src/Services/GoogleAuthService.php` (state + PKCE S256 lưu `$_SESSION['google_oauth']`, hết hạn 10 phút, dùng 1 lần; đổi `code` lấy token qua cURL; đọc `userinfo`; chỉ nhận `email_verified`), `config/google.php` (đọc `GOOGLE_*` từ biến môi trường rồi `backend/.env`; URL Google đổi được để test), `api/auth/google.php`, `api/auth/google-callback.php`, `tests/google-login.js`, `database/migrations/2026-10-11-google-login.sql`.
- Sửa: `Services/AuthService.php` → `loginWithGoogle()`: tìm theo `google_id` → theo email (liên kết luôn, vì Google đã xác minh email) → tạo mới với mật khẩu ngẫu nhiên không ai biết; email quản trị → 403 (admin chỉ dùng mật khẩu); tài khoản khoá → 403. Ghi `audit_logs` ("người dùng mới đăng ký bằng Google", "liên kết Google cho tài khoản ...").
- Sửa: `Repositories/UserRepository.php` (`findByGoogleId`), `Storage/MySqlStore.php` (map + kiểu `'?s'`), `Services/UserService.php` (`publicUser`), `schema.sql`, `.env.example`.

**Ảnh đại diện:**
- `Controllers/UserController.php` → `profileUpdate()` viết lại + `validAvatar()`; `api/auth/bootstrap.php` (trả `avatar`); `Storage/MySqlStore.php` (map `avatar`); `Services/UserService.php` (bỏ `avatar`, thêm `hasAvatar`); `schema.sql`; mới `database/migrations/2026-10-11-user-avatar.sql`, `tests/user-avatar.js`.

**Phản hồi "Nấu thử món này" (12/10)** — làm theo hợp đồng P0 cũ (`git show c7e000f:backend/HANDOFF.md`); frontend đã có sẵn từ trước nên không sửa giao diện:
- Mới: `src/Services/RecipeFeedbackService.php` (kiểm tra đầu vào, ghi đè, giới hạn 20 món/giờ, tổng hợp, quy tắc `status`/`topIssue`, giấu số liệu dưới COOK_MIN), `src/Repositories/RecipeFeedbackRepository.php`, `src/Controllers/RecipesController.php` (admin), `database/migrations/2026-10-12-recipe-feedback.sql`, `tests/recipe-feedback.js`.
- Sửa: `PublicController` (`recipeStats`), `UserController` (`recipeMine`, `recipeSubmit`), route ở `api/public`, `api/user`, `api/admin`; `StatsService` (`counts` + `dashboard` thêm `recipesToReview`); `schema.sql` (bảng `recipe_feedback`).
- `Storage/MySqlStore.php`: bảng mới trong `TABLES`, `SQL_TABLES` (có trong bản sao lưu) và `MAPS['recipe_feedback']` với **kiểu mới `'j'`** (cột JSON: `json_decode` khi đọc, `json_encode` khi ghi). Khác gợi ý cũ (2 bảng `recipe_feedback` + `recipe_feedback_items`): danh sách nguyên liệu lưu JSON trong cùng dòng để khớp cơ chế `readSimple/writeSimple`; khoá chính `id` + `UNIQUE (user_id, food_id)`; xoá món/người dùng thì phản hồi tự xoá theo (`ON DELETE CASCADE`).
- `scripts/mysql_test_database.php`: khi chép dữ liệu sang database tạm, **bỏ qua bảng mà database nguồn chưa có** (máy chưa chạy migration mới vẫn chạy test được).
- Tài khoản quản trị gọi `recipe.submit`/`recipe.mine` → 403 (bảng chỉ nhận `user_id` của bảng `users`).

**FoodBot chặn khách:** `api/chat/index.php` → `requireMember()` (thay `checkGuestQuota`/`$_SESSION['guest_chat']` của bản 10/10 "khách 2 lượt"); gọi `session_write_close()` trước khi stream; `tests/chatbot-api.js` bật `HNAG_CHAT_ALLOW_GUEST=1`. Muốn chuyển kiểm tra vào Controller/Service thì giữ hợp đồng "403 = chưa đăng nhập".

---

## 7. Nhật ký thay đổi

### 12/10/2026
- **Phản hồi "Nấu thử món này" — backend** (Đạt, theo yêu cầu nhóm): 5 API `recipe.*` + `recipesToReview` cho chuông thông báo/Dashboard, bảng `recipe_feedback`, test 51/51. Khu "Nấu thử món này" ở trang chi tiết món (trước bị ẩn vì backend chưa có) và trang admin "Chất lượng công thức" (trước báo "chưa hỗ trợ") giờ chạy với dữ liệu thật. Chi tiết mục 5 và 6. **Cần chạy migration** `2026-10-12-recipe-feedback.sql` (mục 2).
- Kiểm tra toàn bộ dự án: lint 59 PHP + 51 JS + script build, build lại không đổi file nào, mở 41 lượt trang (khách/người dùng/admin, máy tính + điện thoại) và 79 link nội bộ → 0 lỗi; phân quyền đúng; không lộ khoá bí mật trong Git.

### 11/10/2026
- **FoodBot chỉ cho người đã đăng nhập** (nhóm chốt; bỏ "khách hỏi 2 lượt"). Giao diện: khách vẫn mở khung, FoodBot đáp bằng 5 câu mời tạo tài khoản xoay vòng + nút Đăng nhập / Tạo tài khoản, không gọi API (Đạt).
- **Đăng nhập bằng Google** (Đạt) — giao diện: `GOOGLE_AUTH_BLOCK` trong `tools/build/generate.py` (dùng ở `dang_nhap.py`, `dang_ky.py`), `frontend/user/js/pages/auth-google.js`, `.btn-google` / `.auth-divider` trong `css/pages/auth.css`. Đã thử thật với `52400260@student.tdtu.edu.vn` → tạo tài khoản #1285.
- **Ảnh đại diện** (Đạt) — giao diện: nút "Đổi ảnh"/"Xoá ảnh" ở `tools/build/pages/tai_khoan.py`; `frontend/user/js/pages/tai-khoan.js` cắt vuông + thu nhỏ 256px + nén JPEG trước khi gửi; `avatarInner()` + `updateUserProfile()` trong `js/core/auth.js` (avatar ở thanh menu); CSS `navbar.css`, `account.css`. Bỏ 3 ô ghi chú ở trang Đăng nhập ("Một tài khoản dùng chung…") và trang Tài khoản ("…lưu trên máy chủ…", "Công cụ tham khảo… Mifflin-St Jeor…").
- **Góp ý & liên hệ chuyển thành hộp thoại** (Đạt, chỉ frontend): form ở trang giới thiệu bị bỏ, thay bằng hộp thoại mở từ menu tài khoản / chân trang (`frontend/user/js/widgets/feedback.js`). Vẫn gọi `public` → `feedback.create` như cũ, **không sửa backend**; tên + email giờ lấy từ tài khoản đang đăng nhập (`window.APP_USER`) thay vì người dùng tự gõ. Khách chưa đăng nhập không còn form gửi góp ý.
- Trang Khám phá: thẻ danh mục có hình ("Menu" + 7 danh mục). Nút Yêu thích kiểu ô kem viền đồng. Icon ảnh cho 5 mục menu + banner đầu 4 trang sau đăng nhập (trừ Trang chủ) (ảnh trong `frontend/image/icon-page/`). Bỏ 3 ô ghi chú ở trang Đăng nhập / Tài khoản.

### 10/10/2026
- **Repo (Đạt):** merge nhánh `backend` (Phong) vào `main`. Xung đột `src/Storage/DataStore.php` lấy bản của Phong, bỏ `JsonFileStore.php` + `Seeder.php`. **Giữ lại** hai thư mục sao lưu `Web-Application/` và `archive/` (nhánh `backend` đã xoá) theo quyết định của nhóm.
- **FoodBot — An** (lấy từ nhánh `Tester-(-An-)`): `api/chat/index.php`, `src/Controllers/ChatController.php`, `src/Services/ChatService.php`, `config/chatbot.php`, `prompts/foodbot.txt`, `.env.example`, `tests/chatbot-api.js`. Gọi Gemini REST, trả SSE, không dùng Storage/MySQL. Cần `GEMINI_API_KEY`. Ảnh món + sửa JSON của nhánh này **không** lấy.
- Giao diện (Đạt): FoodBot ở 6 trang, logo/hình mới, icon trang giới thiệu, nhạc nền — chi tiết ở [../README.md](../README.md) mục 13.

### 08/10/2026
- Sửa `backend/.gitignore` từ `storage/` thành `/storage/`: dòng cũ (Windows không phân biệt hoa/thường) bỏ qua luôn `backend/src/Storage/` nên các file Storage chưa từng lên GitHub.

---

## 8. Yêu cầu từ frontend (chưa làm)

1. ~~Đổi ảnh đại diện~~ — **đã làm 11/10/2026** (Đạt).
2. **Đặt lại / quên mật khẩu.** Cần: (a) admin đặt lại mật khẩu cho người dùng ở trang Người dùng; (b) người dùng tự đổi mật khẩu ở trang Tài khoản; (c) tuỳ chọn "Quên mật khẩu" qua email. Người đăng ký bằng Google hiện có mật khẩu ngẫu nhiên — sau khi có (b) mới đặt được mật khẩu riêng. Tạm thời làm tay: [../README.md](../README.md) mục 9.7.
3. *(Gợi ý, Phong)* Góp ý giờ chỉ gửi khi đã đăng nhập: có thể thêm action `feedback.create` vào API `user` lấy tên/email/`userId` từ phiên đăng nhập (không tin dữ liệu client gửi lên), rồi frontend đổi sang gọi API đó — 1 dòng ở `backend.js` (`sendFeedback`).
4. *(Gợi ý)* Lấy ảnh Google (`picture` trong userinfo) làm avatar mặc định khi người dùng chưa tự đặt ảnh.
5. *(Gợi ý)* Trang admin Người dùng hiện nhãn "Google" và "có ảnh" (backend đã trả `googleLinked`, `hasAvatar`).

### Dữ liệu cần sửa qua trang admin (An / người phụ trách nội dung)
- **Ẩn hoặc xoá 2 món thử nghiệm đang hiện công khai**: "Món Ăn Test Siêu Đậm Đà" (ảnh nhân vật hoạt hình), "mon test 123 blabla" (ảnh chụp màn hình lỗi PowerShell).
- **19 món dùng ảnh sai món**: Cháo Sườn Sụn (ảnh chân dung người), Bún Bò Huế (gà rán), Cơm Tấm (sườn BBQ), Bánh Mì Thịt Nướng (mì Ý), Bún Chả (cà ri tôm), Bánh Xèo (salad), Bún Đậu Mắm Tôm (mì cà ri), Gỏi Cuốn (há cảo), Mì Quảng (mì gói), Cơm Niêu Kho Quẹt (paella), Bún Riêu (bít tết), Lẩu Nấm Chay (mì), Bánh Tráng Nướng (pizza), Chè Bưởi (cupcake), Cơm Gà Xối Mỡ (ức gà nướng), Xôi Mặn (salad), Cà Phê Sữa Đá (cà phê đen nóng), Bánh Mì Chảo (bánh mì trứng ốp), Nem Nướng Nha Trang (thịt viên).
- Ảnh tải lên qua admin chỉ nằm trong MySQL máy người tải → xong thì **Cài đặt → Sao lưu**, gửi file SQL cho nhóm.

---

## 9. Phần chưa hoàn thiện (Phong, cập nhật 11/10)

- ~~API `recipe.*` cho phản hồi nấu thử chưa có~~ — **đã làm 12/10/2026** (Đạt, mục 5–6). Ghi chú cũ: (frontend đang gọi: `public` → `recipe.stats`; `user` → `recipe.mine`, `recipe.submit`; `admin` → `recipe.quality.list`, `recipe.quality.get` — hiện trả 404). Giao diện xử lý tình trạng chưa hỗ trợ: trang chi tiết món tự ẩn khu "Nấu thử món này", trang admin Công thức báo "chưa hỗ trợ". **Hợp đồng đầy đủ (đầu vào/đầu ra 5 action) đã bị mất khi viết lại file này** — xem lại bằng `git show c7e000f:backend/HANDOFF.md` (mục "P0").
- Chưa có bảng sự kiện theo thời gian để tính biểu đồ hằng ngày, tỷ lệ chốt món hoặc so sánh kỳ trước. Đã bỏ số liệu dựng sẵn; giao diện hiển thị chưa có dữ liệu. Tổng và phân bổ hiện có lấy từ số liệu lưu trong database.
- Một số cài đặt như gửi email, 2FA, bảo trì và lịch sao lưu mới được lưu, chưa triển khai hành vi tương ứng.
- Chưa có đổi/quên mật khẩu, phân quyền chi tiết giữa các vai trò admin hoặc giao diện khôi phục backup. Ảnh (món ăn, ảnh đại diện) lưu dạng data URL trong database, chưa có upload thành file.
- Service vẫn lọc danh sách trong bộ nhớ sau khi đọc SQL (kể cả `findByEmail`, `findByGoogleId` đọc cả bảng `users`); có thể tối ưu bằng truy vấn `WHERE` khi dữ liệu tăng.
- **3 lỗi test cũ (mục 4, chú thích ¹) — đã tìm ra nguyên nhân (Đạt, 11/10): do dữ liệu, không phải code.** Test đăng nhập bằng `nguyenvana@gmail.com` / `123456`, nhưng trong database `hom_nay_an_gi` mật khẩu của tài khoản này đã bị đổi (`password_verify('123456', …)` = false); `run-mysql.js` sao chép database thật nên đăng nhập hỏng, kéo theo 2 lỗi phía sau. Chạy lại trên bản sao có đặt lại mật khẩu mẫu → **109/109 đạt**. Cách sửa: đặt lại mật khẩu mẫu về `123456` (README mục 9.7) hoặc cho test tự tạo người dùng riêng thay vì dựa vào dữ liệu mẫu.

---

## 10. Kiểm tra nhanh bằng MySQL

Đầy đủ ở [../README.md](../README.md) mục 9. Mấy lệnh hay dùng khi bàn giao:
```sql
USE hom_nay_an_gi;
SHOW COLUMNS FROM users WHERE Field IN ('google_id', 'avatar');           -- đã chạy đủ migration? (2 dòng)
SELECT status, COUNT(*) FROM foods GROUP BY status;                         -- món hiển thị / ẩn / chờ duyệt
SELECT id, name, email FROM users WHERE google_id IS NOT NULL;              -- ai đăng nhập bằng Google
SELECT id, email, ROUND(LENGTH(avatar)/1024,1) AS kb FROM users WHERE avatar IS NOT NULL;   -- ai có ảnh đại diện
SELECT id, email, subject_label, status, created_at FROM feedback ORDER BY created_at DESC LIMIT 10;  -- góp ý mới
SELECT created_at, type, actor, text FROM audit_logs ORDER BY id DESC LIMIT 20;                       -- nhật ký
```
