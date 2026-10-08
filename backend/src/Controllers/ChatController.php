<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\HttpException;
use App\Services\ChatService;

/** Separate streaming response: the normal Router always serializes one JSON body. */
final class ChatController
{
    public function __construct(private ?ChatService $service = null) {}

    public function stream(array $params): void
    {
        $history = $this->validateHistory($params['history'] ?? null);
        $started = false;
        try {
            ($this->service ?? new ChatService())->stream($history, static function (string $text) use (&$started): void {
                if (!$started) {
                    header('Content-Type: text/event-stream; charset=utf-8');
                    header('Cache-Control: no-store, no-transform');
                    header('X-Accel-Buffering: no');
                    ini_set('zlib.output_compression', '0');
                    while (ob_get_level() > 0) {
                        if (!ob_end_flush()) break;
                    }
                    $started = true;
                }
                self::event(null, ['text' => $text]);
            });
            self::event('done', new \stdClass());
        } catch (\Throwable $e) {
            if (!$started) throw $e;
            if (!$e instanceof HttpException) error_log('[chatbot] Stream failed: ' . get_class($e));
            self::event('error', ['error' => $e instanceof HttpException ? $e->getMessage() : 'Phản hồi bị gián đoạn. Bạn vui lòng gửi lại tin nhắn.']);
        }
    }

    private function validateHistory(mixed $history): array
    {
        if (!is_array($history) || !array_is_list($history) || count($history) < 1 || count($history) > 25 || count($history) % 2 !== 1) {
            throw new HttpException(422, 'Lịch sử trò chuyện không hợp lệ hoặc quá dài.');
        }
        $out = [];
        $total = 0;
        foreach ($history as $index => $message) {
            $role = $index % 2 === 0 ? 'user' : 'model';
            if (!is_array($message) || ($message['role'] ?? null) !== $role || !isset($message['parts']) || !is_array($message['parts']) || !array_is_list($message['parts']) || count($message['parts']) !== 1) {
                throw new HttpException(422, 'Lịch sử trò chuyện không hợp lệ.');
            }
            $text = $message['parts'][0]['text'] ?? null;
            if (!is_string($text) || trim($text) === '' || mb_strlen($text) > 4000) {
                throw new HttpException(422, 'Tin nhắn cần có nội dung và không quá 4.000 ký tự.');
            }
            $total += mb_strlen($text);
            if ($total > 20000) throw new HttpException(422, 'Cuộc trò chuyện quá dài. Bạn hãy tải lại trang để bắt đầu cuộc trò chuyện mới.');
            $out[] = ['role' => $role, 'parts' => [['text' => trim($text)]]];
        }
        return $out;
    }

    private static function event(?string $type, array|\stdClass $payload): void
    {
        if ($type !== null) echo 'event: ', $type, "\n";
        echo 'data: ', json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR), "\n\n";
        flush();
    }
}
