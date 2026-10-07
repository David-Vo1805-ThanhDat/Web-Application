<?php
declare(strict_types=1);

/**
 * Chuyển TOÀN BỘ dữ liệu hiện tại (backend/storage/db/*.json, hoặc dữ liệu mẫu nếu chưa có) sang MySQL.
 * Bước 1: tạo CSDL:  C:\xampp\mysql\bin\mysql.exe -u root < backend\database\schema.sql
 * Bước 2: chạy:      C:\xampp\php\php.exe backend\scripts\import_json_to_mysql.php [--force]
 *   --force: xoá dữ liệu cũ trong các bảng trước khi nạp (mặc định từ chối nếu bảng đã có dữ liệu).
 * Cấu hình kết nối ở backend/config/config.php → 'mysql'.
 */
require dirname(__DIR__) . '/src/bootstrap.php';

use App\Core\App;
use App\Storage\JsonFileStore;

$force = in_array('--force', $argv, true);
$cfg = App::config('mysql');
$pdo = new PDO(
    sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $cfg['host'], $cfg['port'], $cfg['dbname'], $cfg['charset']),
    $cfg['user'], $cfg['password'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);
$store = new JsonFileStore((string) App::config('storage_dir'), (string) App::config('seed_dir'),
    (string) App::config('demo_admin_password'), (string) App::config('demo_user_password'));

$ts = static fn (?int $ms): ?string => $ms === null ? null : date('Y-m-d H:i:s', intdiv($ms, 1000)) . '.' . str_pad((string) ($ms % 1000), 3, '0', STR_PAD_LEFT);
$insert = static function (string $table, array $row) use ($pdo): void {
    $cols = array_keys($row);
    $pdo->prepare(sprintf('INSERT INTO `%s` (%s) VALUES (%s)', $table, implode(',', array_map(static fn ($c) => "`$c`", $cols)), implode(',', array_fill(0, count($cols), '?'))))
        ->execute(array_values($row));
};

$tables = ['user_state', 'food_tags', 'food_diets', 'food_tastes', 'food_meals', 'food_instructions', 'food_ingredients', 'reviews', 'restaurants', 'feedback', 'audit_logs',
    'settings', 'admins', 'users', 'foods', 'tags', 'meals', 'diets', 'tastes', 'regions', 'categories'];
if ($force) {
    if ($pdo->query("SHOW TABLES LIKE 'app_storage_meta'")->fetchColumn() !== false) $pdo->exec('DELETE FROM app_storage_meta');
    $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
    foreach ($tables as $t) $pdo->exec("TRUNCATE TABLE `$t`");
    $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
} else {
    foreach ($tables as $table) {
        if ((int) $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn() > 0) {
            fwrite(STDERR, "Bảng $table đã có dữ liệu. Script chỉ nhập vào database trống; --force sẽ xoá dữ liệu đích.\n");
            exit(1);
        }
    }
}

$pdo->beginTransaction();
try {
    $tax = $store->read('taxonomy');
    foreach ($tax['CATEGORIES'] as $c) $insert('categories', ['slug' => $c['slug'], 'label' => $c['label'], 'tone' => $c['tone'], 'icon' => $c['icon'] ?? 'tag']);
    foreach ($tax['REGIONS'] as $r) $insert('regions', ['slug' => $r['slug'], 'label' => $r['label'], 'dot' => $r['dot']]);
    foreach ($tax['TASTES'] as $x) $insert('tastes', ['slug' => $x['slug'], 'label' => $x['label']]);
    foreach ($tax['DIETS'] as $x) $insert('diets', ['slug' => $x['slug'], 'label' => $x['label']]);
    foreach ($tax['MEALS'] as $i => $x) $insert('meals', ['slug' => $x['slug'], 'label' => $x['label'], 'sort_order' => $i]);
    $tagId = [];
    foreach ($tax['TAGS'] as $name) { $insert('tags', ['name' => $name]); $tagId[$name] = (int) $pdo->lastInsertId(); }

    foreach ($store->read('foods') as $f) {
        $insert('foods', [
            'id' => $f['id'], 'no' => $f['no'], 'name' => $f['name'], 'english_name' => $f['englishName'], 'description' => $f['description'],
            'category_slug' => $f['category'], 'region_slug' => $f['region'], 'cook_time_minutes' => $f['cookTimeMinutes'], 'price' => $f['price'],
            'price_range' => $f['priceRange'], 'calories' => $f['calories'], 'protein' => $f['nutrition']['protein'], 'carbs' => $f['nutrition']['carbs'],
            'fat' => $f['nutrition']['fat'], 'image' => $f['image'], 'popular' => (int) $f['popular'], 'status' => $f['status'], 'rating' => $f['rating'],
            'review_count' => $f['reviewCount'], 'views' => $f['stats']['views'], 'spins' => $f['stats']['spins'], 'favorites' => $f['stats']['favorites'],
            'created_by' => $f['createdBy'], 'created_at' => $ts($f['createdAt']), 'updated_at' => $ts($f['updatedAt']),
        ]);
        foreach ($f['mealType'] as $m) $insert('food_meals', ['food_id' => $f['id'], 'meal_slug' => $m]);
        foreach ($f['taste'] as $m) $insert('food_tastes', ['food_id' => $f['id'], 'taste_slug' => $m]);
        foreach ($f['dietary'] as $m) $insert('food_diets', ['food_id' => $f['id'], 'diet_slug' => $m]);
        foreach ($f['tags'] as $t) $insert('food_tags', ['food_id' => $f['id'], 'tag_id' => $tagId[$t] ?? throw new RuntimeException("Thẻ '$t' của món {$f['id']} chưa có trong taxonomy")]);
        foreach ($f['ingredients'] as $i => $x) $insert('food_ingredients', ['food_id' => $f['id'], 'position' => $i, 'name' => $x['name'], 'amount' => $x['amount']]);
        foreach ($f['instructions'] as $i => $s) $insert('food_instructions', ['food_id' => $f['id'], 'step_no' => $i + 1, 'content' => $s]);
    }
    foreach ($store->read('restaurants') as $r) {
        $insert('restaurants', ['id' => $r['id'], 'food_id' => $r['foodId'], 'name' => $r['name'], 'address' => $r['address'], 'city' => $r['city'],
            'price_text' => $r['priceText'], 'price_min' => $r['priceMin'], 'price_max' => $r['priceMax']]);
    }
    foreach ($store->read('users') as $u) {
        $insert('users', ['id' => $u['id'], 'name' => $u['name'], 'email' => $u['email'], 'password_hash' => $u['passwordHash'], 'role' => $u['role'], 'status' => $u['status'],
            'has_health_profile' => (int) $u['hasHealthProfile'], 'favorites_count' => $u['favorites'], 'joined_at' => $ts($u['joinedAt']),
            'last_active_at' => $ts($u['lastActiveAt'] ?? null)]);
    }
    $settings = $store->read('settings');
    foreach ($settings['admins'] as $a) $insert('admins', ['id' => $a['id'], 'name' => $a['name'], 'email' => $a['email'], 'password_hash' => $a['passwordHash'], 'role' => $a['role']]);
    foreach (['general', 'notify', 'security', 'backup'] as $k) $insert('settings', ['key' => $k, 'value' => json_encode($settings[$k], JSON_UNESCAPED_UNICODE)]);

    foreach ($store->read('reviews') as $r) {
        $insert('reviews', ['id' => $r['id'], 'user_id' => is_int($r['userId'] ?? null) ? $r['userId'] : null, 'user_name' => $r['userName'], 'food_id' => $r['foodId'],
            'food_name' => $r['foodName'], 'stars' => $r['stars'], 'text' => $r['text'], 'status' => $r['status'], 'reply' => $r['reply'],
            'source' => $r['source'] ?? 'seed', 'counted' => (int) ($r['counted'] ?? false), 'created_at' => $ts($r['createdAt'])]);
    }
    foreach ($store->read('feedback') as $f) {
        $insert('feedback', ['id' => $f['id'], 'name' => $f['name'], 'email' => $f['email'], 'subject' => $f['subject'], 'subject_label' => $f['subjectLabel'],
            'message' => $f['message'], 'status' => $f['status'], 'reply' => $f['reply'], 'ip' => $f['ip'] ?? '', 'created_at' => $ts($f['createdAt'])]);
    }
    foreach ($store->read('user_state') as $s) { // chỉ tài khoản người dùng (mã số); tài khoản quản trị không nằm trong bảng users
        if (!ctype_digit((string) $s['id'])) continue;
        $j = static fn ($k) => array_key_exists($k, $s) && $s[$k] !== null ? json_encode($s[$k], JSON_UNESCAPED_UNICODE) : null;
        $insert('user_state', ['user_id' => (int) $s['id'], 'favorites' => $j('favorites'), 'health_profile' => $j('healthProfile'), 'health_log' => $j('healthLog'),
            'food_history' => $j('foodHistory'), 'weekly_plan' => $j('weeklyPlan'), 'group_people' => $j('group'), 'updated_at' => $ts($s['updatedAt'])]);
    }
    foreach (array_reverse($store->read('audit')) as $e) { // cũ → mới để id tự tăng theo thời gian
        $insert('audit_logs', ['type' => $e['type'], 'actor' => $e['actor'], 'text' => $e['text'], 'ip' => $e['ip'], 'created_at' => $ts($e['ts'])]);
    }
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    fwrite(STDERR, 'Lỗi, đã huỷ toàn bộ: ' . $e->getMessage() . "\n");
    exit(1);
}

foreach (['categories', 'regions', 'tags', 'foods', 'food_ingredients', 'food_instructions', 'restaurants', 'users', 'admins', 'reviews', 'feedback', 'audit_logs', 'settings', 'user_state'] as $t) {
    printf("%-20s %d dòng\n", $t, $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn());
}
