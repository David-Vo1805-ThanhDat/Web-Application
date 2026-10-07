-- ============================================================================
-- Hôm Nay Ăn Gì? — cấu trúc CSDL MySQL / MariaDB (XAMPP)
-- Mỗi bảng ứng với 1 bảng dữ liệu (file JSON) mà backend hiện dùng: backend/storage/db/<bảng>.json
-- Dùng khi chuyển từ file JSON sang MySQL (xem mục "Chuyển sang MySQL" trong backend/README.md).
-- Nạp:  mysql -u root < backend/database/schema.sql
-- ============================================================================

CREATE DATABASE IF NOT EXISTS hom_nay_an_gi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hom_nay_an_gi;

-- API ordering and the difference between a missing state key and an explicitly deleted key.
-- The relational business data stays in the tables below.
CREATE TABLE app_storage_meta (
  meta_key VARCHAR(190) NOT NULL PRIMARY KEY,
  value JSON NOT NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Phân loại (taxonomy.json) — trang "Danh mục & thẻ"
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
  slug   VARCHAR(40)  NOT NULL PRIMARY KEY,
  label  VARCHAR(40)  NOT NULL,
  tone   ENUM('orange','blue','purple','green','amber','rose','sky') NOT NULL DEFAULT 'orange',
  icon   VARCHAR(20)  NOT NULL DEFAULT 'tag'
) ENGINE=InnoDB;

CREATE TABLE regions (
  slug   VARCHAR(40)  NOT NULL PRIMARY KEY,          -- chính là tên vùng: Bắc, Trung, Nam, Quốc tế
  label  VARCHAR(40)  NOT NULL,
  dot    ENUM('orange','blue','purple','green','amber','rose','sky') NOT NULL DEFAULT 'orange'
) ENGINE=InnoDB;

CREATE TABLE tastes (slug VARCHAR(40) NOT NULL PRIMARY KEY, label VARCHAR(40) NOT NULL) ENGINE=InnoDB;
CREATE TABLE diets  (slug VARCHAR(40) NOT NULL PRIMARY KEY, label VARCHAR(40) NOT NULL) ENGINE=InnoDB;
CREATE TABLE meals  (slug VARCHAR(40) NOT NULL PRIMARY KEY, label VARCHAR(40) NOT NULL, sort_order TINYINT NOT NULL DEFAULT 0) ENGINE=InnoDB;
CREATE TABLE tags   (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(60) NOT NULL UNIQUE) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Món ăn (foods.json)
-- ----------------------------------------------------------------------------
CREATE TABLE foods (
  id                VARCHAR(80)   NOT NULL PRIMARY KEY,                -- slug: pho-bo-ha-noi
  no                INT UNSIGNED  NOT NULL,                            -- số thứ tự hiển thị
  name              VARCHAR(120)  NOT NULL,
  english_name      VARCHAR(120)  NOT NULL DEFAULT '',
  description       VARCHAR(1000) NOT NULL,
  category_slug     VARCHAR(40)   NOT NULL,
  region_slug       VARCHAR(40)   NOT NULL,
  cook_time_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  price             INT UNSIGNED  NOT NULL,
  price_range       VARCHAR(40)   NOT NULL DEFAULT '',
  calories          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  protein           SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  carbs             SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  fat               SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  image             MEDIUMTEXT    NOT NULL,                            -- đường dẫn hoặc data URL (ảnh admin tải lên)
  popular           TINYINT(1)    NOT NULL DEFAULT 0,
  status            ENUM('visible','hidden','pending') NOT NULL DEFAULT 'hidden',
  rating            DECIMAL(3,2)  NOT NULL DEFAULT 0,
  review_count      INT UNSIGNED  NOT NULL DEFAULT 0,
  views             INT UNSIGNED  NOT NULL DEFAULT 0,
  spins             INT UNSIGNED  NOT NULL DEFAULT 0,
  favorites         INT UNSIGNED  NOT NULL DEFAULT 0,
  created_by        VARCHAR(80)   NOT NULL DEFAULT '',
  created_at        DATETIME(3)   NOT NULL,
  updated_at        DATETIME(3)   NOT NULL,
  FOREIGN KEY (category_slug) REFERENCES categories(slug) ON UPDATE CASCADE,
  FOREIGN KEY (region_slug)   REFERENCES regions(slug)    ON UPDATE CASCADE,
  INDEX idx_foods_status (status),
  INDEX idx_foods_category (category_slug),
  FULLTEXT INDEX ft_foods_name (name, english_name)
) ENGINE=InnoDB;

CREATE TABLE food_meals  (food_id VARCHAR(80) NOT NULL, meal_slug  VARCHAR(40) NOT NULL, PRIMARY KEY (food_id, meal_slug),
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE, FOREIGN KEY (meal_slug)  REFERENCES meals(slug)  ON UPDATE CASCADE) ENGINE=InnoDB;
CREATE TABLE food_tastes (food_id VARCHAR(80) NOT NULL, taste_slug VARCHAR(40) NOT NULL, PRIMARY KEY (food_id, taste_slug),
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE, FOREIGN KEY (taste_slug) REFERENCES tastes(slug) ON UPDATE CASCADE) ENGINE=InnoDB;
CREATE TABLE food_diets  (food_id VARCHAR(80) NOT NULL, diet_slug  VARCHAR(40) NOT NULL, PRIMARY KEY (food_id, diet_slug),
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE, FOREIGN KEY (diet_slug)  REFERENCES diets(slug)  ON UPDATE CASCADE) ENGINE=InnoDB;
CREATE TABLE food_tags   (food_id VARCHAR(80) NOT NULL, tag_id INT UNSIGNED NOT NULL, PRIMARY KEY (food_id, tag_id),
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE, FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE ON UPDATE CASCADE) ENGINE=InnoDB;

CREATE TABLE food_ingredients (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  food_id  VARCHAR(80)  NOT NULL,
  position SMALLINT UNSIGNED NOT NULL,                                 -- thứ tự kéo-thả
  name     VARCHAR(120) NOT NULL,
  amount   VARCHAR(60)  NOT NULL DEFAULT '',
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE,
  INDEX idx_ing_food (food_id, position)
) ENGINE=InnoDB;

CREATE TABLE food_instructions (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  food_id  VARCHAR(80)  NOT NULL,
  step_no  SMALLINT UNSIGNED NOT NULL,
  content  TEXT         NOT NULL,
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE,
  INDEX idx_step_food (food_id, step_no)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Quán ăn gợi ý (restaurants.json)
-- ----------------------------------------------------------------------------
CREATE TABLE restaurants (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  food_id     VARCHAR(80)  NOT NULL,
  name        VARCHAR(120) NOT NULL,
  address     VARCHAR(200) NOT NULL,
  city        VARCHAR(60)  NOT NULL,                                   -- có thể "TP.HCM / Hà Nội" hoặc "Toàn quốc"
  price_text  VARCHAR(60)  NOT NULL DEFAULT '',
  price_min   INT UNSIGNED NOT NULL DEFAULT 0,
  price_max   INT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE,
  INDEX idx_rest_food (food_id),
  INDEX idx_rest_city (city)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Tài khoản (users.json và settings.admins)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(80)  NOT NULL,
  email               VARCHAR(190) NOT NULL UNIQUE,
  password_hash       VARCHAR(255) NOT NULL,                           -- password_hash() của PHP (bcrypt)
  role                ENUM('member','moderator') NOT NULL DEFAULT 'member',
  status              ENUM('active','unverified','locked') NOT NULL DEFAULT 'active',
  has_health_profile  TINYINT(1)   NOT NULL DEFAULT 0,
  favorites_count     INT UNSIGNED NOT NULL DEFAULT 0,
  joined_at           DATETIME(3)  NOT NULL,
  last_active_at      DATETIME(3)  NULL,
  INDEX idx_users_status (status),
  INDEX idx_users_joined (joined_at)
) ENGINE=InnoDB;

CREATE TABLE admins (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(80)  NOT NULL,
  email          VARCHAR(190) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('super','moderator') NOT NULL DEFAULT 'moderator'
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Đánh giá & góp ý (reviews.json, feedback.json)
-- ----------------------------------------------------------------------------
CREATE TABLE reviews (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NULL,
  user_name   VARCHAR(80)  NOT NULL,
  food_id     VARCHAR(80)  NOT NULL,
  food_name   VARCHAR(120) NOT NULL,
  stars       TINYINT UNSIGNED NOT NULL,
  text        TEXT         NOT NULL,
  status      ENUM('pending','approved','hidden') NOT NULL DEFAULT 'pending',
  reply       TEXT         NOT NULL,
  source      ENUM('seed','site') NOT NULL DEFAULT 'seed',            -- 'site' = người dùng gửi từ web
  counted     TINYINT(1)   NOT NULL DEFAULT 0,                        -- đã tính vào điểm/số lượt đánh giá của món chưa
  created_at  DATETIME(3)  NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE,
  INDEX idx_reviews_status (status, created_at)
) ENGINE=InnoDB;

CREATE TABLE feedback (
  id            INT UNSIGNED NOT NULL PRIMARY KEY,                     -- mã góp ý hiển thị (#1042)
  name          VARCHAR(80)  NOT NULL,
  email         VARCHAR(190) NOT NULL,
  subject       ENUM('gop-y','de-xuat-mon','bao-loi','hop-tac') NOT NULL,
  subject_label VARCHAR(40)  NOT NULL,
  message       TEXT         NOT NULL,
  status        ENUM('new','replied') NOT NULL DEFAULT 'new',
  reply         TEXT         NOT NULL,
  ip            VARCHAR(45)  NOT NULL DEFAULT '',                     -- để giới hạn số lần gửi mỗi giờ
  created_at    DATETIME(3)  NOT NULL,
  INDEX idx_feedback_status (status, created_at)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Nhật ký hoạt động (audit.json) và cài đặt hệ thống (settings.json)
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type        ENUM('edit','approve','user','lock','add','reply','delete','login') NOT NULL,
  actor       VARCHAR(80)  NOT NULL,
  text        VARCHAR(500) NOT NULL,
  ip          VARCHAR(45)  NOT NULL DEFAULT '',
  created_at  DATETIME(3)  NOT NULL,
  INDEX idx_audit_time (created_at),
  INDEX idx_audit_type (type)
) ENGINE=InnoDB;

CREATE TABLE settings (
  `key`  VARCHAR(60) NOT NULL PRIMARY KEY,                             -- general | notify | security | backup
  value  JSON        NOT NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- Dữ liệu riêng của người dùng trên web (user_state.json): yêu thích, hồ sơ sức khỏe, nhật ký cân nặng,
-- lịch sử món, thực đơn tuần, nhóm bạn. Mỗi tài khoản 1 dòng, mỗi loại dữ liệu 1 cột JSON.
-- (Có thể tách thành user_favorites / health_profiles / health_logs nếu cần truy vấn theo từng món hay từng ngày.)
-- ----------------------------------------------------------------------------
CREATE TABLE user_state (
  user_id         INT UNSIGNED NOT NULL PRIMARY KEY,
  favorites       JSON NULL,                                           -- ["pho-bo-ha-noi", ...]
  health_profile  JSON NULL,
  health_log      JSON NULL,
  food_history    JSON NULL,
  weekly_plan     JSON NULL,
  group_people    JSON NULL,
  updated_at      DATETIME(3) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
