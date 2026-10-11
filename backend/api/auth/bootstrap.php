<?php
declare(strict_types=1);

/** Page bootstrap: PHP session identity and account state from MySQL, with no browser persistence. */
require dirname(__DIR__, 2) . '/src/bootstrap.php';
use App\Core\App;
use App\Core\Session;
use App\Repositories\UserRepository;
use App\Services\UserStateService;

header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
try {
    $user = Session::user();
    [$identity, $state] = App::transaction(static function () use ($user): array {
        if ($user === null) return [null, []];
        // Ảnh đại diện đọc thẳng từ database (không cất trong phiên PHP cho phiên khỏi nặng); admin chưa có ảnh
        $avatar = $user['role'] === 'admin' ? null : ((new UserRepository())->find($user['id'])['avatar'] ?? null);
        return [array_intersect_key($user, array_flip(['email', 'name', 'role', 'since'])) + ['avatar'=>$avatar, 'server'=>true], (new UserStateService())->get()];
    }, false);
    $flags = JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR;
    echo 'window.APP_USER = ', json_encode($identity, $flags), ";\n";
    echo 'window.APP_STATE = ', json_encode((object) $state, $flags), ";\n";
} catch (Throwable $e) {
    error_log('[bootstrap] ' . $e);
    http_response_code(500);
    echo "window.APP_USER = null; window.APP_STATE = {}; console.error('Không tải được dữ liệu tài khoản từ máy chủ.');\n";
}
