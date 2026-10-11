-- Phản hồi "Nấu thử món này" (12/10/2026): bảng mới cho 5 API recipe.* (xem backend/HANDOFF.md mục 5).
-- Chạy MỘT LẦN trên database đang dùng (database mới tạo từ schema.sql đã có sẵn bảng này):
--   mysql -u root -p hom_nay_an_gi < backend/database/migrations/2026-10-12-recipe-feedback.sql
CREATE TABLE recipe_feedback (
  id           INT UNSIGNED NOT NULL PRIMARY KEY,
  user_id      INT UNSIGNED NOT NULL,
  user_name    VARCHAR(80)  NOT NULL,
  food_id      VARCHAR(80)  NOT NULL,
  portions     TINYINT UNSIGNED NOT NULL,
  fit          TINYINT(1)   NOT NULL,
  difficulty   ENUM('easy','medium','hard') NULL,
  time_actual  ENUM('faster','same','slower') NULL,
  taste        JSON         NOT NULL,
  ingredients  JSON         NOT NULL,
  note         VARCHAR(300) NOT NULL DEFAULT '',
  created_at   DATETIME(3)  NOT NULL,
  updated_at   DATETIME(3)  NOT NULL,
  UNIQUE KEY uq_recipe_feedback_user_food (user_id, food_id),
  INDEX idx_recipe_feedback_food (food_id, updated_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
) ENGINE=InnoDB;
