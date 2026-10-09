<?php
declare(strict_types=1);

namespace App\Services;

use App\Repositories\FeedbackRepository;
use App\Repositories\FoodRepository;
use App\Repositories\RestaurantRepository;
use App\Repositories\ReviewRepository;
use App\Repositories\TaxonomyRepository;
use App\Repositories\UserRepository;
use App\Support\Str;

/**
 * Số liệu cho Dashboard, Thống kê, số đếm trên menu và tìm kiếm toàn cục.
 * Những số suy ra từ dữ liệu thật (món, người dùng, đánh giá, quán...) được tính trực tiếp.
 * Chỉ trả số liệu có trong database; chỉ số chưa có dữ liệu trả null hoặc mảng trống.
 */
final class StatsService
{
    /** Màu thanh theo bữa ăn (theo thứ tự trong taxonomy.MEALS). */
    private const MEAL_TONES = ['blue', 'orange', 'purple', 'green'];

    private FoodRepository $foods;
    private UserRepository $users;
    private ReviewRepository $reviews;
    private FeedbackRepository $feedback;
    private RestaurantRepository $restaurants;
    private TaxonomyRepository $taxonomy;

    public function __construct()
    {
        $this->foods = new FoodRepository();
        $this->users = new UserRepository();
        $this->reviews = new ReviewRepository();
        $this->feedback = new FeedbackRepository();
        $this->restaurants = new RestaurantRepository();
        $this->taxonomy = new TaxonomyRepository();
    }

    public function counts(): array
    {
        return [
            'foods' => count($this->foods->all()), 'restaurants' => count($this->restaurants->all()),
            'pending' => $this->pendingReviews(), 'feedbackNew' => $this->newFeedback(),
        ];
    }

    /** @param array<string,mixed> $p q */
    public function search(array $p): array
    {
        $q = Str::norm($p['q'] ?? '');
        if ($q === '') return ['foods' => [], 'users' => [], 'restaurants' => []];
        $pick = static fn (array $rows, callable $text): array => array_slice(array_values(array_filter($rows, static fn ($x) => str_contains(Str::norm($text($x)), $q))), 0, 4);
        return [
            'foods' => $pick($this->foods->all(), static fn ($f) => $f['name'] . ' ' . $f['englishName'] . ' ' . $f['id']),
            'users' => array_map([UserService::class, 'publicUser'], $pick($this->users->all(), static fn ($u) => $u['name'] . ' ' . $u['email'])),
            'restaurants' => $pick($this->restaurants->all(), static fn ($r) => $r['name'] . ' ' . $r['address']),
        ];
    }

    /** @param array<string,mixed> $p range (today|7|30|90) | days */
    public function dashboard(array $p): array
    {
        $f = $this->foods->all();
        $users = $this->users->all();
        $tax = $this->taxonomy->get();
        $visible = count(array_filter($f, static fn ($x) => $x['status'] === 'visible'));
        $spins = array_sum(array_map(static fn ($x) => $x['stats']['spins'], $f));
        $favs = array_sum(array_map(static fn ($x) => $x['stats']['favorites'], $f));
        $rc = array_sum(array_column($f, 'reviewCount'));
        $avg = $rc ? array_sum(array_map(static fn ($x) => $x['rating'] * $x['reviewCount'], $f)) / $rc : 0;
        $hp = count(array_filter($users, static fn ($u) => $u['hasHealthProfile']));
        $new30 = count(array_filter($users, static fn ($u) => $u['joinedAt'] >= AuditService::nowMs() - 30 * 86400000));

        $byCat = array_map(static fn ($c) => ['slug' => $c['slug'], 'label' => $c['label'], 'tone' => $c['tone'],
            'count' => count(array_filter($f, static fn ($x) => $x['category'] === $c['slug']))], $tax['CATEGORIES']);
        $byReviews = $f; usort($byReviews, static fn ($a, $b) => $b['reviewCount'] <=> $a['reviewCount']);
        $byFavs = $f; usort($byFavs, static fn ($a, $b) => $b['stats']['favorites'] <=> $a['stats']['favorites']);

        $daily = []; // No event timeline exists in the database.

        return [
            'kpis' => [
                'foods' => ['value' => $visible, 'total' => count($f), 'note' => 'Tổng ' . count($f) . ' món trong hệ thống'],
                'users' => ['value' => count($users), 'note' => '+' . $new30 . ' so với tháng trước'],
                'spins' => ['value' => $spins, 'note' => 'Tổng lưu trong database'],
                'favorites' => ['value' => $favs, 'note' => 'Tổng lưu trong database'],
                'rating' => ['value' => $avg, 'count' => $rc, 'note' => number_format($rc, 0, ',', '.') . ' lượt đánh giá'],
                'health' => ['value' => $hp, 'note' => (int) round($hp / max(1, count($users)) * 100) . '% người dùng'],
            ],
            'daily' => $daily, 'categories' => $byCat,
            'topSpun' => array_map(static fn ($x) => ['id' => $x['id'], 'name' => $x['name'], 'reviewCount' => $x['reviewCount'], 'rating' => $x['rating']], array_slice($byReviews, 0, 5)),
            'topFav' => array_map(static fn ($x) => ['id' => $x['id'], 'name' => $x['name'], 'favorites' => $x['stats']['favorites']], array_slice($byFavs, 0, 5)),
            'recent' => (new AuditService())->recent(5),
            'attention' => ['pendingReviews' => $this->pendingReviews(), 'unansweredFeedback' => $this->newFeedback()],
        ];
    }

    /** @param array<string,mixed> $p range (7|30|quy) | days */
    public function stats(array $p): array
    {
        $n = !empty($p['days']) ? (int) $p['days'] : (['7' => 7, '30' => 30, 'quy' => 90][(string) ($p['range'] ?? '30')] ?? 30);
        $f = $this->foods->all();
        $users = $this->users->all();
        $tax = $this->taxonomy->get();
        $now = AuditService::nowMs();
        $day = 86400000;

        $joined = static fn (int $from, int $to): int => count(array_filter($users, static fn ($u) => $u['joinedAt'] >= $from && $u['joinedAt'] < $to));
        $newUsers = $joined($now - $n * $day, $now + 1);
        $prev = $joined($now - 2 * $n * $day, $now - $n * $day);
        $spinsAll = array_sum(array_map(static fn ($x) => $x['stats']['spins'], $f));
        $favsAll = array_sum(array_map(static fn ($x) => $x['stats']['favorites'], $f));

        $series = []; // No fabricated daily values.

        // Lượt quay theo bữa: chia tổng lượt quay của mỗi món đều cho các bữa món đó thuộc về (dữ liệu thật của món).
        $meals = [];
        foreach ($tax['MEALS'] as $i => $m) {
            $v = 0.0;
            foreach ($f as $x) if (in_array($m['slug'], $x['mealType'], true)) $v += $x['stats']['spins'] / max(1, count($x['mealType']));
            $meals[] = ['label' => $m['label'], 'value' => (int) round($v), 'tone' => self::MEAL_TONES[$i % 4]];
        }
        $byRegion = array_map(static fn ($r) => ['label' => $r['label'], 'count' => count(array_filter($f, static fn ($x) => $x['region'] === $r['slug'])), 'dot' => $r['dot']], $tax['REGIONS']);

        $ranked = $f; usort($ranked, static fn ($a, $b) => $b['stats']['spins'] <=> $a['stats']['spins']);
        $perf = [];
        foreach (array_slice($ranked, 0, 8) as $i => $x) {
            $perf[] = ['id' => $x['id'], 'name' => $x['name'], 'views' => $x['stats']['views'], 'spins' => $x['stats']['spins'], 'favorites' => $x['stats']['favorites'],
                'decide' => null, 'rating' => $x['rating']];
        }
        return [
            'kpis' => [
                'newUsers' => ['value' => $newUsers, 'delta' => $prev > 0 ? round(($newUsers - $prev) / $prev * 100, 1) : 0],
                'spins' => ['value' => $spinsAll, 'delta' => null],
                'favorites' => ['value' => $favsAll, 'delta' => null],
                'decideRate' => ['value' => null, 'delta' => null],
            ],
            'series' => $series, 'byMeal' => $meals, 'byRegion' => $byRegion, 'performance' => $perf,
        ];
    }

    private function pendingReviews(): int
    {
        return count(array_filter($this->reviews->all(), static fn ($r) => $r['status'] === 'pending'));
    }

    private function newFeedback(): int
    {
        return count(array_filter($this->feedback->all(), static fn ($x) => $x['status'] === 'new'));
    }
}
