<?php
// Cấu hình backend. Sửa ở đây (không sửa rải rác trong code).
return [
    'debug' => false,                                   // true: trả chi tiết lỗi 500 về trình duyệt (chỉ bật khi đang phát triển)
    'timezone' => 'Asia/Ho_Chi_Minh',
    'page_size' => 8,                                   // số dòng mỗi trang mặc định

    // ----- Nơi lưu dữ liệu -----
    // 'json'  : file JSON trong storage/db (không cần cài gì, chạy thẳng trên XAMPP). Lần chạy đầu tự khởi tạo từ data/seed.
    // 'mysql' : dữ liệu trên MySQL của máy này. HNAG_STORAGE=json dành cho test JSON / chuyển dữ liệu.
    'storage' => getenv('HNAG_STORAGE') ?: 'mysql',
    'storage_dir' => getenv('HNAG_STORAGE_DIR') ?: dirname(__DIR__) . '/storage', // HNAG_STORAGE_DIR: dùng khi chạy kiểm thử để không đụng dữ liệu thật
    'seed_dir' => dirname(__DIR__) . '/data/seed',

    'mysql' => [
        'host' => getenv('DB_HOST') ?: '127.0.0.1', 'port' => (int) (getenv('DB_PORT') ?: 3306), 'dbname' => getenv('DB_DATABASE') ?: 'hom_nay_an_gi',
        'user' => getenv('DB_USER') ?: 'root', 'password' => getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '123456', 'charset' => 'utf8mb4',
    ],

    // ----- Phiên đăng nhập -----
    'session_name' => 'HNAGSESSID',
    'session_lifetime' => 60 * 60 * 8,                  // 8 giờ

    // ----- Mật khẩu của dữ liệu DEMO (chỉ dùng khi khởi tạo dữ liệu mẫu lần đầu) -----
    'demo_admin_password' => 'admin123',                // admin@homnayangi.vn và các tài khoản quản trị mẫu
    'demo_user_password' => '123456',                   // 1.284 người dùng mẫu
];
