<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\HttpException;
use App\Core\Session;
use App\Repositories\FeedbackRepository;
use App\Repositories\FoodRepository;
use App\Repositories\ReviewRepository;
use App\Support\Paginator;

/** Đánh giá món ăn (duyệt / ẩn / trả lời) và góp ý liên hệ (phản hồi). */
final class ReviewService
{
    private ReviewRepository $reviews;
    private FeedbackRepository $feedback;
    private FoodRepository $foods;
    private AuditService $audit;

    public function __construct()
    {
        $this->reviews = new ReviewRepository();
        $this->feedback = new FeedbackRepository();
        $this->foods = new FoodRepository();
        $this->audit = new AuditService();
    }

    public function stats(): array
    {
        $f = $this->foods->all();
        $rc = array_sum(array_column($f, 'reviewCount'));
        $sum = array_sum(array_map(static fn ($x) => $x['rating'] * $x['reviewCount'], $f));
        $fb = $this->feedback->all();
        return [
            'total' => $rc, 'avg' => $rc ? $sum / $rc : 0,
            'pending' => count(array_filter($this->reviews->all(), static fn ($r) => $r['status'] === 'pending')),
            'foods' => count($f), 'feedbackTotal' => count($fb),
            'feedbackNew' => count(array_filter($fb, static fn ($x) => $x['status'] === 'new')),
        ];
    }

    /** @param array<string,mixed> $p status, page, pageSize */
    public function listReviews(array $p): array
    {
        $rows = array_values(array_filter($this->reviews->all(), static fn ($r) => empty($p['status']) || $p['status'] === 'all' || $r['status'] === $p['status']));
        usort($rows, static fn ($a, $b) => $b['createdAt'] <=> $a['createdAt']);
        return Paginator::paginate($rows, $p, 4);
    }

    public function setStatus(int $id, string $status): array
    {
        if (!in_array($status, ['pending', 'approved', 'hidden'], true)) throw new HttpException(422, 'Trạng thái không hợp lệ');
        $r = $this->reviews->find($id) ?? throw new HttpException(404, 'Không tìm thấy đánh giá');
        $r['status'] = $status;
        // Đánh giá gửi từ web: chỉ khi được duyệt mới tính vào điểm và số lượt đánh giá của món (đánh giá mẫu ban đầu thì không đụng tới)
        if (($r['source'] ?? '') === 'site') {
            $counted = !empty($r['counted']);
            if ($status === 'approved' && !$counted) { $this->adjustFoodRating($r['foodId'], (int) $r['stars'], +1); $r['counted'] = true; }
            elseif ($status !== 'approved' && $counted) { $this->adjustFoodRating($r['foodId'], (int) $r['stars'], -1); $r['counted'] = false; }
        }
        $this->reviews->update($r);
        $this->audit->log($status === 'approved' ? 'approve' : 'edit',
            $status === 'approved' ? 'đã duyệt đánh giá ' . $r['stars'] . '★ cho “' . $r['foodName'] . '”' : 'đã ẩn đánh giá của ' . $r['userName'] . ' cho “' . $r['foodName'] . '”');
        return $r;
    }

    public function replyReview(int $id, string $text): array
    {
        $text = self::replyText($text);
        $r = $this->reviews->find($id) ?? throw new HttpException(404, 'Không tìm thấy đánh giá');
        $r['reply'] = $text;
        $this->reviews->update($r);
        $this->audit->log('reply', 'đã trả lời đánh giá của ' . $r['userName']);
        return $r;
    }

    /** @param array<string,mixed> $p page, pageSize */
    public function listFeedback(array $p): array
    {
        $rows = $this->feedback->all();
        usort($rows, static fn ($a, $b) => $b['createdAt'] <=> $a['createdAt']);
        return Paginator::paginate($rows, $p, 4);
    }

    public function replyFeedback(int $id, string $text): array
    {
        $text = self::replyText($text);
        $f = $this->feedback->find($id) ?? throw new HttpException(404, 'Không tìm thấy góp ý');
        $f['reply'] = $text;
        $f['status'] = 'replied';
        $this->feedback->update($f);
        $this->audit->log('reply', 'đã phản hồi góp ý #' . $f['id']);
        return $f;
    }

    /**
     * Người dùng đã đăng nhập gửi đánh giá cho 1 món; chờ quản trị duyệt mới hiển thị và tính điểm.
     * @param array<string,mixed> $p foodId, stars (1-5), text
     */
    public function create(array $p): array
    {
        $u = Session::user() ?? throw new HttpException(401, 'Bạn cần đăng nhập để đánh giá');
        $food = $this->foods->find((string) ($p['foodId'] ?? ''));
        if ($food === null || $food['status'] !== 'visible') throw new HttpException(404, 'Không tìm thấy món ăn');
        $stars = (int) ($p['stars'] ?? 0);
        $text = trim((string) ($p['text'] ?? ''));
        if ($stars < 1 || $stars > 5) throw new HttpException(422, 'Vui lòng chọn số sao từ 1 đến 5');
        if (mb_strlen($text) < 5) throw new HttpException(422, 'Nhận xét cần ít nhất 5 ký tự');
        foreach ($this->reviews->all() as $r) {
            if ((string) ($r['userId'] ?? '') === (string) $u['id'] && $r['foodId'] === $food['id'] && $r['status'] !== 'hidden') {
                throw new HttpException(409, 'Bạn đã đánh giá món này rồi');
            }
        }
        $rows = $this->reviews->all();
        $row = ['id' => $this->reviews->nextId(), 'userId' => $u['id'], 'userName' => $u['name'], 'foodId' => $food['id'], 'foodName' => $food['name'],
            'stars' => $stars, 'text' => mb_substr($text, 0, 1000), 'createdAt' => AuditService::nowMs(), 'status' => 'pending', 'reply' => '',
            'source' => 'site', 'counted' => false];
        $rows[] = $row;
        $this->reviews->replaceAll($rows);
        return ['id' => $row['id'], 'status' => 'pending'];
    }

    /** Đánh giá đã duyệt của 1 món (công khai). @return list<array<string,mixed>> */
    public function forFood(string $foodId): array
    {
        $rows = array_values(array_filter($this->reviews->all(), static fn ($r) => $r['foodId'] === $foodId && $r['status'] === 'approved'));
        usort($rows, static fn ($a, $b) => $b['createdAt'] <=> $a['createdAt']);
        return array_map(static fn ($r) => ['userName' => $r['userName'], 'stars' => $r['stars'], 'text' => $r['text'], 'reply' => $r['reply'], 'createdAt' => $r['createdAt']], array_slice($rows, 0, 20));
    }

    /** direction +1: thêm 1 lượt đánh giá; -1: gỡ 1 lượt. */
    private function adjustFoodRating(string $foodId, int $stars, int $direction): void
    {
        $food = $this->foods->find($foodId);
        if ($food === null) return;
        $n = (int) $food['reviewCount'];
        $sum = $food['rating'] * $n + $direction * $stars;
        $n += $direction;
        $food['reviewCount'] = max(0, $n);
        $food['rating'] = $n > 0 ? round(min(5, max(0, $sum / $n)), 2) : 0;
        $this->foods->update($food);
    }

    private static function replyText(string $text): string
    {
        $text = trim($text);
        if ($text === '') throw new HttpException(422, 'Vui lòng nhập nội dung phản hồi');
        return mb_substr($text, 0, 2000);
    }
}
