<?php
declare(strict_types=1);

/**
 * Bắt đầu "Đăng nhập bằng Google":  GET backend/api/auth/google.php?next=<trang.html>
 * Nút "Tiếp tục với Google" ở trang đăng nhập/đăng ký trỏ tới đây → chuyển sang trang chọn tài khoản của Google.
 * Chưa cấu hình GOOGLE_CLIENT_ID/SECRET (backend/.env) → quay về trang đăng nhập với ?google=chua-cau-hinh.
 */
require dirname(__DIR__, 2) . '/src/bootstrap.php';

use App\Core\Session;
use App\Services\GoogleAuthService;

header('Cache-Control: no-store');
$front = '../../../frontend/user/';
$google = new GoogleAuthService();
if (!$google->configured()) {
    header('Location: ' . $front . 'dang-nhap.html?google=chua-cau-hinh', true, 302);
    exit;
}
Session::user();   // mở phiên PHP để lưu state/PKCE
header('Location: ' . $google->start((string) ($_GET['next'] ?? '')), true, 302);
