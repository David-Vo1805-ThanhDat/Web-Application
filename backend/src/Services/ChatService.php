<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\HttpException;

/** Gemini REST streaming, independent of the food database and PHP sessions. */
final class ChatService
{
    private array $config;

    public function __construct(?array $config = null)
    {
        $this->config = $config ?? require dirname(__DIR__, 2) . '/config/chatbot.php';
    }

    /** @param list<array{role:string,parts:list<array{text:string}>}> $history */
    public function stream(array $history, callable $emitText): void
    {
        if (empty($this->config['api_key']) || !extension_loaded('curl')) {
            error_log('[chatbot] Missing API key or PHP cURL extension.');
            throw new HttpException(503, 'FoodBot hiện chưa sẵn sàng. Bạn vui lòng thử lại sau.');
        }
        if (!preg_match('/^[a-zA-Z0-9._-]+$/D', $this->config['model'])) {
            throw new HttpException(503, 'FoodBot hiện chưa sẵn sàng. Bạn vui lòng thử lại sau.');
        }
        $prompt = is_readable($this->config['prompt_file']) ? file_get_contents($this->config['prompt_file']) : false;
        if ($prompt === false || trim($prompt) === '') {
            throw new HttpException(503, 'FoodBot hiện chưa sẵn sàng. Bạn vui lòng thử lại sau.');
        }
        $payload = json_encode([
            'systemInstruction' => ['parts' => [['text' => $prompt]]],
            'contents' => $history,
            'generationConfig' => ['maxOutputTokens' => 400, 'temperature' => 0.3, 'topP' => 0.1],
        ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $url = rtrim($this->config['base_url'], '/') . '/models/' . $this->config['model'] . ':streamGenerateContent?alt=sse';

        // Retry transient upstream errors only before any text has reached the browser.
        for ($attempt = 0; $attempt < 2; $attempt++) {
            $pending = '';
            $dataLines = [];
            $receivedBytes = 0;
            $hasText = false;
            $finished = false;
            $consumeEvent = static function () use (&$dataLines, &$hasText, &$finished, $emitText): void {
                if (!$dataLines) return;
                $raw = implode("\n", $dataLines);
                $dataLines = [];
                try {
                    $event = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
                } catch (\JsonException) {
                    throw new HttpException(502, 'Phản hồi bị gián đoạn. Bạn vui lòng gửi lại tin nhắn.');
                }
                if (!is_array($event) || isset($event['error'])) {
                    throw new HttpException(502, 'Phản hồi bị gián đoạn. Bạn vui lòng gửi lại tin nhắn.');
                }
                $candidate = $event['candidates'][0] ?? [];
                $reason = $candidate['finishReason'] ?? '';
                if (!empty($event['promptFeedback']['blockReason']) || ($reason !== '' && !in_array($reason, ['STOP', 'MAX_TOKENS'], true))) {
                    throw new HttpException(422, 'Mình chưa thể trả lời câu này. Bạn thử hỏi lại về món ăn nhé.');
                }
                foreach ($candidate['content']['parts'] ?? [] as $part) {
                    if (!empty($part['thought'])) continue;
                    $text = $part['text'] ?? '';
                    if (is_string($text) && $text !== '') {
                        $hasText = true;
                        $emitText($text);
                    }
                }
                if ($reason !== '') $finished = true;
            };

            $curl = curl_init($url);
            if ($curl === false) throw new HttpException(503, 'FoodBot hiện chưa sẵn sàng.');
            curl_setopt_array($curl, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $payload,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: text/event-stream', 'x-goog-api-key: ' . $this->config['api_key']],
                CURLOPT_CONNECTTIMEOUT => 10,
                CURLOPT_TIMEOUT => (int) ($this->config['timeout'] ?? 45),
                CURLOPT_FOLLOWLOCATION => false,
                CURLOPT_WRITEFUNCTION => static function ($handle, string $chunk) use (&$pending, &$dataLines, &$receivedBytes, $consumeEvent): int {
                    if (connection_aborted()) return 0;
                    $size = strlen($chunk);
                    $receivedBytes += $size;
                    if ($receivedBytes > 262144) throw new HttpException(502, 'Phản hồi quá dài. Bạn thử hỏi ngắn gọn hơn nhé.');
                    $status = curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
                    if ($status < 200 || $status >= 300) return $size;
                    $type = curl_getinfo($handle, CURLINFO_CONTENT_TYPE) ?: '';
                    if (stripos($type, 'text/event-stream') !== 0) {
                        throw new HttpException(502, 'FoodBot chưa nhận được phản hồi hợp lệ. Bạn vui lòng thử lại.');
                    }
                    $pending .= $chunk;
                    while (($newline = strpos($pending, "\n")) !== false) {
                        $line = rtrim(substr($pending, 0, $newline), "\r");
                        $pending = substr($pending, $newline + 1);
                        if ($line === '') $consumeEvent();
                        elseif (str_starts_with($line, 'data:')) $dataLines[] = ltrim(substr($line, 5), ' ');
                    }
                    return $size;
                },
            ]);
            try {
                $ok = curl_exec($curl);
                $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
                $errno = curl_errno($curl);
            } finally {
                curl_close($curl);
            }
            if (!$hasText && $attempt === 0 && in_array($status, [500, 502, 503, 504], true)) {
                usleep(300000);
                continue;
            }
            if ($status === 429) throw new HttpException(429, 'FoodBot đang nhận nhiều yêu cầu. Bạn đợi một chút rồi thử lại nhé.');
            if ($ok === false || $status < 200 || $status >= 300) {
                // Do not log keys, upstream bodies, or conversation contents.
                error_log('[chatbot] Upstream HTTP ' . $status . ', cURL ' . $errno);
                throw new HttpException(in_array($status, [401, 403, 404, 503], true) ? 503 : 502, 'FoodBot tạm thời chưa trả lời được. Bạn vui lòng thử lại sau.');
            }
            if (!$hasText || !$finished || trim($pending) !== '' || $dataLines) {
                throw new HttpException(502, 'Phản hồi bị gián đoạn. Bạn vui lòng gửi lại tin nhắn.');
            }
            return;
        }
    }
}
