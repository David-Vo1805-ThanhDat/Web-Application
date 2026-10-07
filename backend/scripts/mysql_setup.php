<?php
declare(strict_types=1);

/** Add compatibility metadata to an already imported database. Never re-import or delete business data. */
require dirname(__DIR__) . '/src/bootstrap.php';

use App\Core\App;
use App\Storage\MySqlConnection;
use App\Storage\MySqlStore;

try {
    $config = App::config('mysql');
    $pdo = MySqlConnection::open($config);
    $store = new MySqlStore($config, App::config('storage_dir'), App::config('seed_dir'),
        App::config('demo_admin_password'), App::config('demo_user_password'));
    if (!in_array('--no-backup', $argv, true)) $store->backup();
    $pdo->exec('CREATE TABLE IF NOT EXISTS app_storage_meta (meta_key VARCHAR(190) NOT NULL PRIMARY KEY, value JSON NOT NULL) ENGINE=InnoDB');
    $store->transaction(function () use ($pdo, $store): void {
        $existing = array_flip($pdo->query('SELECT meta_key FROM app_storage_meta')->fetchAll(PDO::FETCH_COLUMN));
        $add = static function (string $key, array $value) use ($existing, $store): void {
            if (!isset($existing[$key])) $store->setMeta($key, $value);
        };
        foreach (MySqlStore::TABLES as $table) {
            $path = App::config('storage_dir') . '/db/' . $table . '.json';
            if (!is_file($path)) $path = App::config('seed_dir') . '/' . $table . '.json';
            if (!is_file($path)) continue;
            $data = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
            if ($table === 'taxonomy') {
                foreach ($data as $key => $items) $add('taxonomy:' . $key, $key === 'TAGS' ? $items : array_column($items, 'slug'));
            } elseif ($table === 'foods') {
                $add('order:foods', array_column($data, 'id'));
                foreach ($data as $food) $add('food:' . $food['id'], array_intersect_key($food, array_flip(['mealType', 'taste', 'dietary', 'tags'])));
            } elseif ($table === 'user_state') {
                foreach ($data as $row) {
                    $id = (string) $row['id'];
                    if (ctype_digit($id)) $add('state_keys:' . $id, array_values(array_diff(array_keys($row), ['id', 'updatedAt'])));
                    elseif (str_starts_with($id, 'admin-')) $add('admin_state:' . $id, $row);
                }
            } elseif ($table !== 'settings') {
                $add('order:' . $table, array_column($data, 'id'));
                if ($table === 'reviews') foreach ($data as $row) {
                    if (isset($row['userId']) && !is_int($row['userId'])) $add('review:' . $row['id'], ['userId'=>$row['userId']]);
                }
            }
        }
    });
    echo "MySQL setup complete: {$config['dbname']}. Existing business data preserved.\n";
} catch (Throwable $e) {
    fwrite(STDERR, 'MySQL setup failed: ' . $e->getMessage() . "\n");
    exit(1);
}
