<?php
declare(strict_types=1);

namespace App\Storage;

use App\Core\HttpException;
use PDO;
use RuntimeException;
use Throwable;

/** Maps the existing API documents to the normalized MySQL schema, without replacing whole SQL tables. */
final class MySqlStore implements DataStore
{
    public const TABLES = ['taxonomy', 'foods', 'users', 'settings', 'restaurants', 'reviews', 'feedback', 'user_state', 'audit'];
    // Child tables first for deletion; reversed for restoring an SQL backup.
    public const SQL_TABLES = ['app_storage_meta', 'user_state', 'food_tags', 'food_diets', 'food_tastes', 'food_meals',
        'food_instructions', 'food_ingredients', 'reviews', 'restaurants', 'feedback', 'audit_logs', 'settings',
        'admins', 'users', 'foods', 'tags', 'meals', 'diets', 'tastes', 'regions', 'categories'];

    /** API field => SQL column and conversion (integer, boolean, decimal, milliseconds, string). */
    private const MAPS = [
        'users' => [
            'id'=>['id','i'], 'name'=>['name','s'], 'email'=>['email','s'], 'passwordHash'=>['password_hash','s'],
            'role'=>['role','s'], 'status'=>['status','s'], 'hasHealthProfile'=>['has_health_profile','b'],
            'favorites'=>['favorites_count','i'], 'joinedAt'=>['joined_at','t'], 'lastActiveAt'=>['last_active_at','t'],
        ],
        'admins' => ['id'=>['id','i'], 'name'=>['name','s'], 'email'=>['email','s'], 'passwordHash'=>['password_hash','s'], 'role'=>['role','s']],
        'restaurants' => [
            'id'=>['id','i'], 'foodId'=>['food_id','s'], 'name'=>['name','s'], 'address'=>['address','s'], 'city'=>['city','s'],
            'priceText'=>['price_text','s'], 'priceMin'=>['price_min','i'], 'priceMax'=>['price_max','i'],
        ],
        'reviews' => [
            'id'=>['id','i'], 'userId'=>['user_id','?i'], 'userName'=>['user_name','s'], 'foodId'=>['food_id','s'],
            'foodName'=>['food_name','s'], 'stars'=>['stars','i'], 'text'=>['text','s'], 'status'=>['status','s'],
            'reply'=>['reply','s'], 'source'=>['source','s'], 'counted'=>['counted','b'], 'createdAt'=>['created_at','t'],
        ],
        'feedback' => [
            'id'=>['id','i'], 'name'=>['name','s'], 'email'=>['email','s'], 'subject'=>['subject','s'],
            'subjectLabel'=>['subject_label','s'], 'message'=>['message','s'], 'status'=>['status','s'],
            'reply'=>['reply','s'], 'ip'=>['ip','s'], 'createdAt'=>['created_at','t'],
        ],
        'audit' => ['id'=>['id','i'], 'type'=>['type','s'], 'actor'=>['actor','s'], 'text'=>['text','s'], 'ip'=>['ip','s'], 'ts'=>['created_at','t']],
        'foods' => [
            'id'=>['id','s'], 'no'=>['no','i'], 'name'=>['name','s'], 'englishName'=>['english_name','s'],
            'description'=>['description','s'], 'category'=>['category_slug','s'], 'region'=>['region_slug','s'],
            'cookTimeMinutes'=>['cook_time_minutes','i'], 'price'=>['price','i'], 'priceRange'=>['price_range','s'],
            'calories'=>['calories','i'], 'nutrition.protein'=>['protein','i'], 'nutrition.carbs'=>['carbs','i'],
            'nutrition.fat'=>['fat','i'], 'image'=>['image','s'], 'popular'=>['popular','b'], 'status'=>['status','s'],
            'rating'=>['rating','d'], 'reviewCount'=>['review_count','i'], 'stats.views'=>['views','i'],
            'stats.spins'=>['spins','i'], 'stats.favorites'=>['favorites','i'], 'createdBy'=>['created_by','s'],
            'createdAt'=>['created_at','t'], 'updatedAt'=>['updated_at','t'],
        ],
    ];
    private const TAXONOMY = ['CATEGORIES'=>'categories', 'REGIONS'=>'regions', 'TASTES'=>'tastes', 'DIETS'=>'diets', 'MEALS'=>'meals'];
    private const LINKS = ['mealType'=>['food_meals','meal_slug'], 'taste'=>['food_tastes','taste_slug'], 'dietary'=>['food_diets','diet_slug']];
    private const STATE = ['favorites'=>'favorites', 'healthProfile'=>'health_profile', 'healthLog'=>'health_log',
        'foodHistory'=>'food_history', 'weeklyPlan'=>'weekly_plan', 'group'=>'group_people'];

    private PDO $pdo;
    private string $lockName;
    private bool $insideTransaction = false;

    public function __construct(private array $config, private string $storageDir)
    {
        $this->pdo = MySqlConnection::open($config);
        $this->lockName = 'hnag:' . hash('sha256', $config['dbname']);
        // MySQL named locks have a maximum length of 64 characters.
        $this->lockName = substr($this->lockName, 0, 64);
    }

    /** Serialize application writes before their first read, including nextId(), and commit all service writes together. */
    public function transaction(callable $work, bool $write = true): mixed
    {
        if ($this->insideTransaction) return $work();
        $locked = false;
        try {
            if ($write) {
                $locked = (int) $this->query('SELECT GET_LOCK(?, 15)', [$this->lockName])->fetchColumn() === 1;
                if (!$locked) throw new HttpException(503, 'Máy chủ đang xử lý thay đổi khác, vui lòng thử lại');
            }
            $this->pdo->beginTransaction();
            $this->insideTransaction = true;
            $result = $work();
            $this->pdo->commit();
            return $result;
        } catch (Throwable $e) {
            if ($this->pdo->inTransaction()) $this->pdo->rollBack();
            throw $e;
        } finally {
            $this->insideTransaction = false;
            if ($locked) $this->query('SELECT RELEASE_LOCK(?)', [$this->lockName]);
        }
    }

    public function read(string $table): array
    {
        return match ($table) {
            'taxonomy' => $this->readTaxonomy(),
            'settings' => $this->readSettings(),
            'user_state' => $this->readState(),
            'foods' => $this->readFoods(),
            'users', 'restaurants', 'reviews', 'feedback', 'audit' => $this->readSimple($table),
            default => throw new RuntimeException('Bảng không được hỗ trợ: ' . $table),
        };
    }

    public function write(string $table, array $rows): void
    {
        $this->transaction(function () use ($table, $rows): void {
            match ($table) {
                'taxonomy' => $this->writeTaxonomy($rows),
                'settings' => $this->writeSettings($rows),
                'user_state' => $this->writeState($rows),
                'foods' => $this->writeFoods($rows),
                'users', 'restaurants', 'reviews', 'feedback', 'audit' => $this->writeSimple($table, $rows),
                default => throw new RuntimeException('Bảng không được hỗ trợ: ' . $table),
            };
        });
    }

    private function readSimple(string $table): array
    {
        $physical = $table === 'audit' ? 'audit_logs' : $table;
        $order = match ($table) { 'users'=>'joined_at DESC, id DESC', 'audit'=>'id DESC', default=>'id' };
        $rows = array_map(fn ($row) => $this->decode($table, $row), $this->query("SELECT * FROM `$physical` ORDER BY $order")->fetchAll());
        if ($table === 'reviews') {
            foreach ($rows as &$row) {
                $meta = $this->meta('review:' . $row['id']);
                if (isset($meta['userId'])) $row['userId'] = $meta['userId'];
            }
            unset($row);
        }
        return $this->ordered($rows, $this->meta('order:' . $table), 'id');
    }

    private function writeSimple(string $table, array $rows): void
    {
        $physical = $table === 'audit' ? 'audit_logs' : $table;
        $old = array_column($this->readSimple($table), null, 'id');
        $ids = [];
        foreach ($rows as $row) {
            $id = (string) $row['id'];
            $ids[] = $id;
            if (!isset($old[$id]) || $row != $old[$id]) {
                $this->upsert($physical, $this->encode($table, $row));
                if ($table === 'reviews') $this->setMeta('review:' . $id, ['userId' => $row['userId'] ?? null]);
            }
        }
        foreach ($old as $id => $_) if (!in_array((string) $id, $ids, true)) {
            $this->query("DELETE FROM `$physical` WHERE id = ?", [$id]);
            if ($table === 'reviews') $this->deleteMeta('review:' . $id);
        }
        $this->setMeta('order:' . $table, $ids);
    }

    private function readFoods(): array
    {
        $foods = [];
        foreach ($this->query('SELECT * FROM foods ORDER BY no, id')->fetchAll() as $row) {
            $food = $this->decode('foods', $row);
            foreach (array_keys(self::LINKS) as $key) $food[$key] = [];
            $food['tags'] = $food['ingredients'] = $food['instructions'] = [];
            $foods[$food['id']] = $food;
        }
        foreach (self::LINKS as $key => [$table, $column]) {
            foreach ($this->query("SELECT food_id, `$column` FROM `$table` ORDER BY food_id, `$column`")->fetchAll() as $row) {
                $foods[$row['food_id']][$key][] = $row[$column];
            }
        }
        foreach ($this->query('SELECT ft.food_id, t.name FROM food_tags ft JOIN tags t ON t.id = ft.tag_id ORDER BY ft.food_id, t.id')->fetchAll() as $row) $foods[$row['food_id']]['tags'][] = $row['name'];
        foreach ($this->query('SELECT * FROM food_ingredients ORDER BY food_id, position, id')->fetchAll() as $row) $foods[$row['food_id']]['ingredients'][] = ['name'=>$row['name'], 'amount'=>$row['amount']];
        foreach ($this->query('SELECT * FROM food_instructions ORDER BY food_id, step_no, id')->fetchAll() as $row) $foods[$row['food_id']]['instructions'][] = $row['content'];
        $meta = $this->metaPrefix('food:');
        foreach ($foods as &$food) {
            foreach (['mealType', 'taste', 'dietary', 'tags'] as $key) $food[$key] = $this->orderedValues($food[$key], $meta['food:' . $food['id']][$key] ?? []);
        }
        unset($food);
        return $this->ordered(array_values($foods), $this->meta('order:foods'), 'id');
    }

    private function writeFoods(array $rows): void
    {
        $old = array_column($this->readFoods(), null, 'id');
        $ids = [];
        foreach ($rows as $food) {
            $id = (string) $food['id'];
            $ids[] = $id;
            if (isset($old[$id]) && $food == $old[$id]) continue;
            $this->upsert('foods', $this->encode('foods', $food));
            foreach (self::LINKS as $key => [$table, $column]) {
                $this->query("DELETE FROM `$table` WHERE food_id = ?", [$id]);
                foreach ($food[$key] as $slug) $this->upsert($table, ['food_id'=>$id, $column=>$slug]);
            }
            $this->query('DELETE FROM food_tags WHERE food_id = ?', [$id]);
            foreach ($food['tags'] as $name) {
                $this->upsert('tags', ['name'=>$name]);
                $tagId = $this->query('SELECT id FROM tags WHERE name = ?', [$name])->fetchColumn();
                $this->upsert('food_tags', ['food_id'=>$id, 'tag_id'=>$tagId]);
            }
            $this->query('DELETE FROM food_ingredients WHERE food_id = ?', [$id]);
            foreach ($food['ingredients'] as $i => $ingredient) $this->upsert('food_ingredients', ['food_id'=>$id, 'position'=>$i, 'name'=>$ingredient['name'], 'amount'=>$ingredient['amount']]);
            $this->query('DELETE FROM food_instructions WHERE food_id = ?', [$id]);
            foreach ($food['instructions'] as $i => $step) $this->upsert('food_instructions', ['food_id'=>$id, 'step_no'=>$i + 1, 'content'=>$step]);
            $this->setMeta('food:' . $id, array_intersect_key($food, array_flip(['mealType', 'taste', 'dietary', 'tags'])));
        }
        foreach ($old as $id => $_) if (!in_array((string) $id, $ids, true)) {
            $this->query('DELETE FROM foods WHERE id = ?', [$id]);
            $this->deleteMeta('food:' . $id);
        }
        $this->setMeta('order:foods', $ids);
    }

    private function readTaxonomy(): array
    {
        $out = [];
        foreach (self::TAXONOMY as $key => $table) {
            $order = $table === 'meals' ? 'sort_order, slug' : 'slug';
            $rows = $this->query("SELECT * FROM `$table` ORDER BY $order")->fetchAll();
            foreach ($rows as &$row) unset($row['sort_order']);
            unset($row);
            $out[$key] = $this->ordered($rows, $this->meta('taxonomy:' . $key), 'slug');
        }
        $out['TAGS'] = $this->orderedValues($this->query('SELECT name FROM tags ORDER BY id')->fetchAll(PDO::FETCH_COLUMN), $this->meta('taxonomy:TAGS'));
        return $out;
    }

    private function writeTaxonomy(array $tax): void
    {
        foreach (self::TAXONOMY as $key => $table) {
            $old = $this->query("SELECT slug FROM `$table`")->fetchAll(PDO::FETCH_COLUMN);
            $ids = [];
            foreach ($tax[$key] as $i => $row) {
                $ids[] = $row['slug'];
                unset($row['count']);
                if ($table === 'meals') $row['sort_order'] = $i;
                $this->upsert($table, $row);
            }
            foreach (array_diff($old, $ids) as $slug) $this->query("DELETE FROM `$table` WHERE slug = ?", [$slug]);
            $this->setMeta('taxonomy:' . $key, $ids);
        }
        $old = $this->query('SELECT name FROM tags')->fetchAll(PDO::FETCH_COLUMN);
        foreach ($tax['TAGS'] as $name) $this->upsert('tags', ['name'=>$name]);
        foreach (array_diff($old, $tax['TAGS']) as $name) $this->query('DELETE FROM tags WHERE name = ?', [$name]);
        $this->setMeta('taxonomy:TAGS', $tax['TAGS']);
    }

    private function readSettings(): array
    {
        $out = [];
        foreach ($this->query('SELECT `key`, value FROM settings')->fetchAll() as $row) $out[$row['key']] = json_decode($row['value'], true, 512, JSON_THROW_ON_ERROR);
        $out['admins'] = array_map(fn ($row) => $this->decode('admins', $row), $this->query('SELECT * FROM admins ORDER BY id')->fetchAll());
        return $out;
    }

    private function writeSettings(array $settings): void
    {
        foreach (['general', 'notify', 'security', 'backup'] as $key) $this->upsert('settings', ['key'=>$key, 'value'=>$this->json($settings[$key])]);
        $ids = [];
        foreach ($settings['admins'] as $admin) {
            $ids[] = (string) $admin['id'];
            $this->upsert('admins', $this->encode('admins', $admin));
        }
        foreach ($this->query('SELECT id FROM admins')->fetchAll(PDO::FETCH_COLUMN) as $id) if (!in_array((string) $id, $ids, true)) {
            $this->query('DELETE FROM admins WHERE id = ?', [$id]);
            $this->deleteMeta('admin_state:admin-' . $id);
        }
    }

    private function readState(): array
    {
        $rows = [];
        $keys = $this->metaPrefix('state_keys:');
        foreach ($this->query('SELECT * FROM user_state ORDER BY user_id')->fetchAll() as $sql) {
            $id = (string) $sql['user_id'];
            $row = ['id'=>$id, 'updatedAt'=>$this->fromDate($sql['updated_at'])];
            $saved = $keys['state_keys:' . $id] ?? null;
            foreach (self::STATE as $key => $column) {
                if ($saved !== null ? in_array($key, $saved, true) : $sql[$column] !== null) $row[$key] = $sql[$column] === null ? null : json_decode($sql[$column], true, 512, JSON_THROW_ON_ERROR);
            }
            $rows[] = $row;
        }
        foreach ($this->metaPrefix('admin_state:') as $row) $rows[] = $row;
        return $rows;
    }

    private function writeState(array $rows): void
    {
        $old = array_column($this->readState(), null, 'id');
        $ids = [];
        foreach ($rows as $row) {
            $id = (string) $row['id'];
            $ids[] = $id;
            if (isset($old[$id]) && $row == $old[$id]) continue;
            if (str_starts_with($id, 'admin-')) {
                if (!$this->query('SELECT id FROM admins WHERE id = ?', [substr($id, 6)])->fetchColumn()) throw new HttpException(409, 'Tài khoản quản trị không còn tồn tại');
                $this->setMeta('admin_state:' . $id, $row);
                continue;
            }
            if (!ctype_digit($id)) throw new RuntimeException('Mã tài khoản không hợp lệ');
            $sql = ['user_id'=>(int) $id, 'updated_at'=>$this->toDate($row['updatedAt'])];
            $saved = [];
            foreach (self::STATE as $key => $column) {
                $sql[$column] = isset($row[$key]) ? $this->json($row[$key]) : null;
                if (array_key_exists($key, $row)) $saved[] = $key;
            }
            $this->upsert('user_state', $sql);
            $this->setMeta('state_keys:' . $id, $saved);
        }
        foreach ($old as $id => $_) if (!in_array((string) $id, $ids, true)) {
            if (ctype_digit((string) $id)) $this->query('DELETE FROM user_state WHERE user_id = ?', [$id]);
            $this->deleteMeta('state_keys:' . $id);
            $this->deleteMeta('admin_state:' . $id);
        }
    }

    public function backup(): void
    {
        $this->transaction(function (): void {
            $dir = $this->storageDir . '/backups';
            if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) throw new RuntimeException('Không thể tạo thư mục sao lưu');
            $path = $dir . '/mysql-' . date('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.sql';
            $handle = fopen($path, 'xb');
            if ($handle === false) throw new RuntimeException('Không thể tạo bản sao lưu MySQL');
            try {
                $emit = static function (string $text) use ($handle): void {
                    if (fwrite($handle, $text) !== strlen($text)) throw new RuntimeException('Không thể ghi đầy đủ bản sao lưu');
                };
                $emit("-- HNAG MySQL backup; restore into an EMPTY database.\nSET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\n");
                $existing = $this->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
                foreach (array_reverse(self::SQL_TABLES) as $table) {
                    if (!in_array($table, $existing, true)) continue;
                    $create = $this->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_NUM)[1];
                    $emit($create . ";\n");
                    foreach ($this->query("SELECT * FROM `$table`")->fetchAll() as $row) {
                        $values = array_map(fn ($v) => $v === null ? 'NULL' : $this->pdo->quote((string) $v), array_values($row));
                        $columns = implode(',', array_map(static fn ($c) => "`$c`", array_keys($row)));
                        $emit("INSERT INTO `$table` ($columns) VALUES (" . implode(',', $values) . ");\n");
                    }
                }
                $emit("SET FOREIGN_KEY_CHECKS=1;\n");
            } catch (Throwable $e) {
                fclose($handle);
                unlink($path);
                throw $e;
            }
            fclose($handle);
        }, false);
    }

    private function query(string $sql, array $params = []): \PDOStatement
    {
        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);
        return $statement;
    }

    private function upsert(string $table, array $row): void
    {
        // Table/column names come exclusively from the internal schema mappings.
        foreach (array_merge([$table], array_keys($row)) as $identifier) if (!preg_match('/^[a-z][a-z0-9_]*$/', $identifier)) throw new RuntimeException('Tên cột/bảng không hợp lệ');
        $columns = array_keys($row);
        $names = implode(',', array_map(static fn ($c) => "`$c`", $columns));
        $updates = implode(',', array_map(static fn ($c) => "`$c` = VALUES(`$c`)", $columns));
        $this->query("INSERT INTO `$table` ($names) VALUES (" . implode(',', array_fill(0, count($columns), '?')) . ") ON DUPLICATE KEY UPDATE $updates", array_values($row));
    }

    public function setMeta(string $key, array $value): void
    {
        $this->upsert('app_storage_meta', ['meta_key'=>$key, 'value'=>$this->json($value)]);
    }

    private function meta(string $key): array
    {
        $value = $this->query('SELECT value FROM app_storage_meta WHERE meta_key = ?', [$key])->fetchColumn();
        return $value === false ? [] : json_decode($value, true, 512, JSON_THROW_ON_ERROR);
    }

    private function metaPrefix(string $prefix): array
    {
        $out = [];
        foreach ($this->query('SELECT meta_key, value FROM app_storage_meta WHERE LEFT(meta_key, ?) = ?', [strlen($prefix), $prefix])->fetchAll() as $row) $out[$row['meta_key']] = json_decode($row['value'], true, 512, JSON_THROW_ON_ERROR);
        return $out;
    }

    private function deleteMeta(string $key): void { $this->query('DELETE FROM app_storage_meta WHERE meta_key = ?', [$key]); }
    private function json(mixed $value): string { return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR); }

    private function ordered(array $rows, array $ids, string $key): array
    {
        if ($ids === []) return $rows;
        $positions = array_flip(array_map('strval', $ids));
        usort($rows, static fn ($a, $b) => ($positions[(string) $a[$key]] ?? PHP_INT_MAX) <=> ($positions[(string) $b[$key]] ?? PHP_INT_MAX));
        return $rows;
    }

    private function orderedValues(array $values, array $order): array
    {
        $positions = array_flip($order);
        usort($values, static fn ($a, $b) => ($positions[$a] ?? PHP_INT_MAX) <=> ($positions[$b] ?? PHP_INT_MAX));
        return $values;
    }

    private function decode(string $table, array $sql): array
    {
        $row = [];
        foreach (self::MAPS[$table] as $field => [$column, $type]) {
            $value = $sql[$column];
            $value = match ($type) { 'i'=>(int) $value, '?i'=>$value === null ? null : (int) $value,
                'b'=>(bool) $value, 'd'=>(float) $value, 't'=>$this->fromDate($value), default=>(string) $value };
            $parts = explode('.', $field);
            if (count($parts) === 2) $row[$parts[0]][$parts[1]] = $value;
            else $row[$field] = $value;
        }
        return $row;
    }

    private function encode(string $table, array $row): array
    {
        $sql = [];
        foreach (self::MAPS[$table] as $field => [$column, $type]) {
            $parts = explode('.', $field);
            $value = count($parts) === 2 ? ($row[$parts[0]][$parts[1]] ?? null) : ($row[$field] ?? null);
            $sql[$column] = match ($type) { 'i', 'b'=>(int) $value, '?i'=>is_numeric($value) ? (int) $value : null,
                'd'=>(float) $value, 't'=>$this->toDate($value), default=>(string) ($value ?? ($field === 'source' ? 'seed' : '')) };
        }
        return $sql;
    }

    private function fromDate(?string $value): ?int
    {
        if ($value === null) return null;
        $date = new \DateTimeImmutable($value, new \DateTimeZone(date_default_timezone_get()));
        return (int) $date->format('U') * 1000 + (int) $date->format('v');
    }

    private function toDate(?int $value): ?string
    {
        return $value === null ? null : date('Y-m-d H:i:s', intdiv($value, 1000)) . '.' . str_pad((string) ($value % 1000), 3, '0', STR_PAD_LEFT);
    }
}
