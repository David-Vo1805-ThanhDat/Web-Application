<?php
declare(strict_types=1);

/**
 * Google gọi về sau khi người dùng chọn tài khoản:  GET backend/api/auth/google-callback.php?code=...&state=...
 * Thành công → tạo/liên kết tài khoản, mở phiên đăng nhập, chuyển tới trang `next`.
 * Lỗi → về trang đăng nhập với ?google=<mã lỗi>; dang-nhap.js đổi mã thành thông báo tiếng Việt (không hiện chữ lấy từ URL).
 * Địa chỉ này phải được khai trong "Authorized redirect URIs" của OAuth client ở Google Cloud.
 */
require dirname(__DIR__, 2) . '/src/bootstrap.php';

use App\Core\App;
use App\Core\HttpException;
use App\Core\Session;
use App\Services\AuthService;
use App\Services\GoogleAuthService;

header('Cache-Control: no-store');
$front = '../../../frontend/user/';
$fail = static function (string $code) use ($front): void {
    header('Location: ' . $front . 'dang-nhap.html?google=' . $code, true, 302);
    exit;
};

if (isset($_GET['error'])) $fail('huy');   // người dùng bấm "Huỷ" ở trang Google
try {
    Session::user();   // mở lại phiên đã lưu state/PKCE
    $info = (new GoogleAuthService())->finish((string) ($_GET['code'] ?? ''), (string) ($_GET['state'] ?? ''));
    App::transaction(static fn () => (new AuthService())->loginWithGoogle($info['sub'], $info['email'], $info['name']));
    header('Location: ' . $front . $info['next'], true, 302);
} catch (HttpException $e) {
    $msg = $e->getMessage();
    $fail(match (true) {
        $e->status === 400 => 'het-han',
        str_contains($msg, 'bị tạm khoá') => 'bi-khoa',            // xét trước: câu này cũng có chữ "quản trị viên"
        str_contains($msg, 'Tài khoản quản trị') => 'quan-tri',
        str_contains($msg, 'xác minh') => 'chua-xac-minh',
        default => 'loi',
    });
} catch (Throwable $e) {
    error_log('[google-login] ' . get_class($e) . ': ' . $e->getMessage());
    $fail('loi');
}
