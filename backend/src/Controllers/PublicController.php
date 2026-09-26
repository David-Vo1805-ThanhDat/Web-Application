<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\FeedbackService;
use App\Services\PublicFoodService;
use App\Services\ReviewService;

/** Hành động công khai (không cần đăng nhập) của web người dùng. */
final class PublicController
{
    public function foods(): array { return (new PublicFoodService())->catalog(); }
    public function feedbackCreate(array $p): array { return (new FeedbackService())->create($p); }
    public function reviewsForFood(array $p): array { return (new ReviewService())->forFood((string) ($p['foodId'] ?? '')); }
}
