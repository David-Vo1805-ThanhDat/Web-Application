<?php
declare(strict_types=1);

require dirname(__DIR__, 2) . '/src/bootstrap.php';

use App\Controllers\ChatController;
use App\Core\HttpException;
use App\Core\Session;

const GUEST_CHAT_TURNS = 2;            // khách chưa đăng nhập được hỏi tối đa 2 lượt (đếm theo phiên PHP)
const GUEST_GREETINGS = 5;             // lời chào tự động khi mở khung chat không tính lượt, nhưng giới hạn số lần
const GREETING_TEXT = 'hôm nay ăn gì'; // đúng câu chatbot.js tự gửi khi mở khung

/** Khách hết lượt → 403 (chatbot.js hiện lời mời đăng nhập). Người đã đăng nhập không giới hạn. */
function checkGuestQuota(array $params): void
{
    if (Session::user() !== null) return;
    $history = $params['history'] ?? null;
    $isGreeting = is_array($history) && count($history) === 1
        && (($history[0]['parts'][0]['text'] ?? null) === GREETING_TEXT);
    $used = $_SESSION['guest_chat'] ?? ['turns' => 0, 'greetings' => 0];
    if ($isGreeting && $used['greetings'] < GUEST_GREETINGS) {
        $used['greetings']++;
    } elseif ($used['turns'] >= GUEST_CHAT_TURNS) {
        throw new HttpException(403, 'Bạn đã dùng hết ' . GUEST_CHAT_TURNS . ' lượt trò chuyện miễn phí. Hãy đăng nhập để tiếp tục trò chuyện cùng FoodBot.');
    } else {
        $used['turns']++;
    }
    $_SESSION['guest_chat'] = $used;
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
    checkGuestQuota($params);
    session_write_close();   // ghi phiên xong thì nhả khoá, để trả lời dài không chặn các yêu cầu khác của cùng người dùng
    (new ChatController())->stream($params);
} catch (\Throwable $e) {
    $status = $e instanceof HttpException ? $e->status : 500;
    if (!$e instanceof HttpException) error_log('[chatbot] Request failed: ' . get_class($e));
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $e instanceof HttpException ? $e->getMessage() : 'FoodBot tạm thời chưa trả lời được. Bạn vui lòng thử lại sau.'], JSON_UNESCAPED_UNICODE);
}
