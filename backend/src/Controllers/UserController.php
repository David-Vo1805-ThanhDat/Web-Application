<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\ReviewService;
use App\Services\UserStateService;

/** Hành động của người dùng đã đăng nhập (dữ liệu riêng, gửi đánh giá). */
final class UserController
{
    public function stateGet(): array { return (new UserStateService())->get(); }
    public function stateSave(array $p): array { return (new UserStateService())->save((string) ($p['key'] ?? ''), $p['value'] ?? null); }
    public function reviewCreate(array $p): array { return (new ReviewService())->create($p); }
}
