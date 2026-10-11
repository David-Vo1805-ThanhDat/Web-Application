<?php
declare(strict_types=1);

require dirname(__DIR__, 2) . '/src/bootstrap.php';

use App\Controllers\ChatController;
use App\Core\HttpException;
use App\Core\Session;

/**
 * FoodBot chỉ trả lời người ĐÃ ĐĂNG NHẬP (quyết định của nhóm 11/10/2026). Khách → 403; chatbot.js tự đáp bằng lời mời
 * tạo tài khoản và không gọi API này. HNAG_CHAT_ALLOW_GUEST=1 chỉ dành cho test (backend/tests/chatbot-api.js), web thật không bật.
 */
function requireMember(): void
{
    if (Session::user() !== null || getenv('HNAG_CHAT_ALLOW_GUEST') === '1') return;
    throw new HttpException(403, 'Bạn cần đăng nhập để trò chuyện cùng FoodBot.');
}

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
try {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        throw new HttpException(405, 'Chỉ chấp nhận phương thức POST');
    }
    $contentType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
    if ($contentType !== 'application/json') throw new HttpException(415, 'Yêu cầu phải có định dạng JSON.');
    $raw = file_get_contents('php://input', false, null, 0, 65537);
    if ($raw === false || strlen($raw) > 65536) throw new HttpException(413, 'Nội dung trò chuyện quá dài.');
    try {
        $params = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
    } catch (\JsonException) {
        throw new HttpException(400, 'Dữ liệu JSON không hợp lệ.');
    }
    if (!is_array($params)) throw new HttpException(400, 'Dữ liệu trò chuyện không hợp lệ.');
    requireMember();
    session_write_close();   // ghi phiên xong thì nhả khoá, để trả lời dài không chặn các yêu cầu khác của cùng người dùng
    (new ChatController())->stream($params);
} catch (\Throwable $e) {
    $status = $e instanceof HttpException ? $e->status : 500;
    if (!$e instanceof HttpException) error_log('[chatbot] Request failed: ' . get_class($e));
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $e instanceof HttpException ? $e->getMessage() : 'FoodBot tạm thời chưa trả lời được. Bạn vui lòng thử lại sau.'], JSON_UNESCAPED_UNICODE);
}
