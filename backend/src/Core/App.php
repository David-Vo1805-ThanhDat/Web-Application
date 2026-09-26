<?php
declare(strict_types=1);

namespace App\Core;

use App\Storage\DataStore;
use App\Storage\JsonFileStore;

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
            // Khi chuyển sang MySQL: trả về store/kho dữ liệu MySQL ở đây (xem backend/README.md).
            self::$store = new JsonFileStore((string) self::config('storage_dir'), (string) self::config('seed_dir'));
        }
        return self::$store;
    }
}
