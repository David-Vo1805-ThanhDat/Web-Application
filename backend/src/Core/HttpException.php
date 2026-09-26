<?php
declare(strict_types=1);

namespace App\Core;

/** Lỗi nghiệp vụ có mã HTTP (400 sai dữ liệu, 401 chưa đăng nhập, 403 không đủ quyền, 404, 409, 422...). */
final class HttpException extends \RuntimeException
{
    public function __construct(public readonly int $status, string $message)
    {
        parent::__construct($message);
    }
}
