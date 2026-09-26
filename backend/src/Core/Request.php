<?php
declare(strict_types=1);

namespace App\Core;

/** Yêu cầu từ giao diện: ?action=<tên hành động> + thân JSON (POST). */
final class Request
{
    public readonly string $action;
    /** @var array<string,mixed> */
    public readonly array $params;

    public function __construct()
    {
        $this->action = (string) ($_GET['action'] ?? '');
        $raw = file_get_contents('php://input');
        $body = ($raw !== false && $raw !== '') ? json_decode($raw, true) : [];
        $this->params = is_array($body) ? $body : [];
    }

    public function ip(): string
    {
        return (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    }
}
