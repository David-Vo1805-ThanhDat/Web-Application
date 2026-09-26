<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\ReviewService;

/** reviews.* và feedback.* */
final class ReviewsController
{
    public function stats(): array { return (new ReviewService())->stats(); }
    public function list(array $p): array { return (new ReviewService())->listReviews($p); }
    public function setStatus(array $p): array { return (new ReviewService())->setStatus((int) ($p['id'] ?? 0), (string) ($p['status'] ?? '')); }
    public function reply(array $p): array { return (new ReviewService())->replyReview((int) ($p['id'] ?? 0), (string) ($p['text'] ?? '')); }
    public function feedbackList(array $p): array { return (new ReviewService())->listFeedback($p); }
    public function feedbackReply(array $p): array { return (new ReviewService())->replyFeedback((int) ($p['id'] ?? 0), (string) ($p['text'] ?? '')); }
}
