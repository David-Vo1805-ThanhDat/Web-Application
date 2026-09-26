<?php
declare(strict_types=1);

// Khởi động backend: nạp lớp tự động (namespace App\ → thư mục src/), múi giờ, bắt lỗi.
define('BACKEND_ROOT', dirname(__DIR__));

spl_autoload_register(static function (string $class): void {
    if (strncmp($class, 'App\\', 4) !== 0) {
        return;
    }
    $file = __DIR__ . '/' . str_replace('\\', '/', substr($class, 4)) . '.php';
    if (is_file($file)) {
        require $file;
    }
});

mb_internal_encoding('UTF-8');
date_default_timezone_set(App\Core\App::config('timezone', 'Asia/Ho_Chi_Minh'));
