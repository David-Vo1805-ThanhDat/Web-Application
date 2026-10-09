<?php
// Cấu hình backend. Sửa ở đây (không sửa rải rác trong code).
return [
    'debug' => false,                                   // true: trả chi tiết lỗi 500 về trình duyệt (chỉ bật khi đang phát triển)
    'timezone' => 'Asia/Ho_Chi_Minh',
    'page_size' => 8,                                   // số dòng mỗi trang mặc định

    // ----- Nơi lưu dữ liệu -----
    // MySQL là nguồn dữ liệu duy nhất. Thư mục storage chỉ chứa bản sao lưu SQL.
    'storage_dir' => getenv('HNAG_STORAGE_DIR') ?: dirname(__DIR__) . '/storage',

    'mysql' => [
        'host' => getenv('DB_HOST') ?: '127.0.0.1', 'port' => (int) (getenv('DB_PORT') ?: 3306), 'dbname' => getenv('DB_DATABASE') ?: 'hom_nay_an_gi',
        'user' => getenv('DB_USER') ?: 'root', 'password' => getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '123456', 'charset' => 'utf8mb4',
    ],

    // ----- Phiên đăng nhập -----
    'session_name' => 'HNAGSESSID',
    'session_lifetime' => 60 * 60 * 8,                  // 8 giờ

];
