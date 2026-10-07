<?php
declare(strict_types=1);

namespace App\Core;

use App\Storage\DataStore;
use App\Storage\JsonFileStore;
use App\Storage\MySqlStore;

/** Điểm truy cập chung: cấu hình và nơi lưu dữ liệu (một bản duy nhất cho mỗi request). */
final class App
{
    private static ?array $config = null;
    private static ?DataStore $store = null;

    public static function config(?string $key = null, mixed $default = null): mixed
    {
        self::$config ??= require BACKEND_ROOT . '/config/config.php';
        return $key === null ? self::$config : (self::$config[$key] ?? $default);
    }

    public static function store(): DataStore
    {
        if (self::$store === null) {
            $driver = (string) self::config('storage', 'json');
            if ($driver === 'mysql') {
                self::$store = new MySqlStore(
                    self::config('mysql'), (string) self::config('storage_dir'), (string) self::config('seed_dir'),
                    (string) self::config('demo_admin_password'), (string) self::config('demo_user_password'),
                );
            } elseif ($driver === 'json') {
                self::$store = new JsonFileStore(
                    (string) self::config('storage_dir'),
                    (string) self::config('seed_dir'),
                    (string) self::config('demo_admin_password'),
                    (string) self::config('demo_user_password'),
                );
            } else {
                throw new \RuntimeException('Storage không được hỗ trợ: ' . $driver);
            }
        }
        return self::$store;
    }

    public static function transaction(callable $work, bool $write = true): mixed
    {
        $store = self::store();
        return $store instanceof MySqlStore ? $store->transaction($work, $write) : $work();
    }
}
