<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\App;
use App\Core\HttpException;
use App\Core\Session;
use App\Repositories\FoodRepository;
use App\Repositories\RecipeFeedbackRepository;
use App\Support\Paginator;
use App\Support\Str;

/**
 * Phản hồi "Nấu thử món này" (12/10/2026, Đạt — hợp đồng ở backend/HANDOFF.md mục 5).
 * Người dùng nấu thử rồi báo từng nguyên liệu vừa/nên giảm/nên tăng, vị, độ khó, thời gian, có hợp khẩu vị không.
 * Mỗi người 1 phản hồi cho mỗi món (gửi lại là ghi đè). Số tổng hợp chỉ công khai khi đủ COOK_MIN lượt;
 * ghi chú (note) chỉ admin đọc. Trạng thái "review" (cần xem lại công thức) do server quyết định.
 */
final class RecipeFeedbackService
{
    private const ING_STATUS = ['ok', 'less', 'more'];
    private const TASTE_KEYS = ['salty', 'sweet', 'spicy'];
    private const LEVELS = ['low', 'ok', 'high'];
    private const DIFFICULTY = ['easy', 'medium', 'hard'];
    private const TIME = ['faster', 'same', 'slower'];
    private const MAX_PER_HOUR = 20;      // số món khác nhau 1 tài khoản được gửi phản hồi trong 1 giờ
    private const REVIEW_RATIO = 0.30;    // nguyên liệu có ≥ 30% người báo lệch (giảm + tăng) → cần xem lại
    private const REVIEW_FIT = 60;        // hoặc dưới 60% người thấy hợp khẩu vị → cần xem lại

    private RecipeFeedbackRepository $repo;
    private FoodRepository $foods;

    public function __construct()
    {
        $this->repo = new RecipeFeedbackRepository();
        $this->foods = new FoodRepository();
    }

    /** Số lượt nấu thử tối thiểu để công khai số liệu tổng hợp (cấu hình `recipe_cook_min`, mặc định 5). */
    public static function cookMin(): int
    {
        return max(1, (int) App::config('recipe_cook_min', 5));
    }

    // ---------------- Người dùng ----------------

    /** api/user recipe.mine { foodId } → phản hồi đã lưu hoặc null. */
    public function mine(array $p): ?array
    {
        $userId = self::memberId();
        $food = $this->visibleFood($p['foodId'] ?? '');
        $row = $this->repo->findFor($userId, $food['id']);
        return $row === null ? null : self::shape($row);
    }

    /** api/user recipe.submit — upsert phản hồi của người dùng cho 1 món. */
    public function submit(array $p): array
    {
        $userId = self::memberId();
        $food = $this->visibleFood($p['foodId'] ?? '');
        $clean = self::validate($p, count($food['ingredients'] ?? []));

        $now = AuditService::nowMs();
        $rows = $this->repo->all();
        $recent = count(array_filter($rows, static fn ($r) => $r['userId'] === $userId && $r['foodId'] !== $food['id'] && $r['updatedAt'] >= $now - 3600000));
        if ($recent >= self::MAX_PER_HOUR) throw new HttpException(429, 'Bạn gửi hơi nhiều, vui lòng thử lại sau ít phút');

        $user = Session::user();
        $existing = $this->repo->findFor($userId, $food['id']);
        $row = ($existing ?? ['id' => $this->repo->nextId(), 'userId' => $userId, 'foodId' => $food['id'], 'createdAt' => $now])
            + ['userName' => '', 'updatedAt' => $now];
        $row = array_replace($row, $clean, ['userName' => mb_substr((string) $user['name'], 0, 80), 'updatedAt' => $now]);
        if ($existing !== null) {
            $this->repo->update($row);
        } else {
            $rows[] = $row;
            $this->repo->replaceAll($rows);
        }
        return ['ok' => true, 'updatedAt' => $now];
    }

    // ---------------- Công khai ----------------

    /** api/public recipe.stats { foodId } — chưa đủ COOK_MIN lượt thì chỉ trả số lượt (server giấu chi tiết). */
    public function stats(array $p): array
    {
        $food = $this->visibleFood($p['foodId'] ?? '');
        $agg = self::aggregate($food, $this->repo->forFood($food['id']));
        if ($agg['cooks'] < self::cookMin()) return ['foodId' => $food['id'], 'cooks' => $agg['cooks'], 'enough' => false];
        return ['foodId' => $food['id'], 'cooks' => $agg['cooks'], 'enough' => true, 'fitRate' => $agg['fitRate'],
            'ingredients' => array_values(array_filter($agg['ingredients'], static fn ($x) => $x['total'] > 0)),
            'taste' => $agg['taste'], 'difficulty' => $agg['difficulty'], 'time' => $agg['time']];
    }

    // ---------------- Quản trị ----------------

    /** api/admin recipe.quality.list { status?, q?, sort?, page, pageSize } — mọi món đang hiện, kể cả món chưa ai nấu. */
    public function qualityList(array $p): array
    {
        $byFood = $this->groupByFood();
        $items = [];
        $totalCooks = $totalFit = $toReview = 0;
        foreach ($this->foods->all() as $food) {
            if (($food['status'] ?? '') !== 'visible') continue;
            $agg = self::aggregate($food, $byFood[$food['id']] ?? []);
            $status = self::status($agg);
            $totalCooks += $agg['cooks'];
            $totalFit += $agg['fitYes'];
            if ($status === 'review') $toReview++;
            $items[] = ['foodId' => $food['id'], 'foodName' => $food['name'], 'image' => $food['image'] ?? '', 'cooks' => $agg['cooks'],
                'fitRate' => $agg['fitRate'], 'status' => $status, 'topIssue' => self::topIssue($agg, $food)];
        }

        $status = (string) ($p['status'] ?? 'all');
        if (in_array($status, ['review', 'ok', 'low-data'], true)) $items = array_values(array_filter($items, static fn ($x) => $x['status'] === $status));
        $q = Str::norm($p['q'] ?? '');
        if ($q !== '') $items = array_values(array_filter($items, static fn ($x) => str_contains(Str::norm($x['foodName'] . ' ' . $x['foodId']), $q)));

        $byName = static fn ($a, $b) => strcmp($a['foodName'], $b['foodName']);
        $sort = (string) ($p['sort'] ?? '');
        usort($items, match ($sort) {
            'cooks' => static fn ($a, $b) => [$b['cooks'], $a['foodName']] <=> [$a['cooks'], $b['foodName']],
            'fit' => static fn ($a, $b) => [$a['fitRate'] === null, $a['fitRate'] ?? 0] <=> [$b['fitRate'] === null, $b['fitRate'] ?? 0] ?: $byName($a, $b),
            'issue' => static fn ($a, $b) => ($b['topIssue']['percent'] ?? -1) <=> ($a['topIssue']['percent'] ?? -1) ?: $byName($a, $b),
            default => static fn ($a, $b) => [$a['status'] !== 'review', -$a['cooks']] <=> [$b['status'] !== 'review', -$b['cooks']] ?: $byName($a, $b),
        });

        return Paginator::paginate($items, $p) + ['summary' => [
            'totalCooks' => $totalCooks,
            'fitRate' => $totalCooks ? (int) round(100 * $totalFit / $totalCooks) : null,
            'recipesToReview' => $toReview,
        ]];
    }

    /** api/admin recipe.quality.get { foodId } — chi tiết đầy đủ (không bị giấu bởi COOK_MIN) + ghi chú mới nhất. */
    public function qualityGet(array $p): array
    {
        $id = (string) ($p['foodId'] ?? '');
        $food = $this->foods->find($id) ?? throw new HttpException(404, 'Không tìm thấy món ăn');
        $rows = $this->repo->forFood($food['id']);
        $agg = self::aggregate($food, $rows);

        $ingredients = [];
        foreach ($agg['ingredients'] as $x) {
            if ($x['total'] === 0) continue;
            $ing = $food['ingredients'][$x['index']];
            $ingredients[] = ['index' => $x['index'], 'name' => $ing['name'], 'amount' => $ing['amount']] + $x;
        }

        $notes = [];
        foreach ($rows as $r) {
            $parts = [];
            if (($r['note'] ?? '') !== '') $parts[] = $r['note'];
            foreach ($r['ingredients'] as $x) {
                if (($x['note'] ?? '') !== '' && isset($food['ingredients'][$x['index']])) $parts[] = $food['ingredients'][$x['index']]['name'] . ': ' . $x['note'];
            }
            if ($parts) $notes[] = ['id' => $r['id'], 'userName' => $r['userName'], 'portions' => $r['portions'], 'fit' => $r['fit'],
                'text' => implode('; ', $parts), 'createdAt' => $r['updatedAt']];
        }
        usort($notes, static fn ($a, $b) => $b['createdAt'] <=> $a['createdAt']);

        return ['food' => ['id' => $food['id'], 'name' => $food['name']], 'cooks' => $agg['cooks'], 'fitRate' => $agg['fitRate'],
            'status' => self::status($agg), 'ingredients' => $ingredients, 'taste' => $agg['taste'],
            'difficulty' => $agg['difficulty'], 'time' => $agg['time'], 'notes' => array_slice($notes, 0, 50)];
    }

    /** Số món đang hiện có trạng thái "review" — dùng cho counts (chuông thông báo) và dashboard. */
    public function recipesToReview(): int
    {
        $byFood = $this->groupByFood();
        $n = 0;
        foreach ($this->foods->all() as $food) {
            if (($food['status'] ?? '') === 'visible' && isset($byFood[$food['id']]) && self::status(self::aggregate($food, $byFood[$food['id']])) === 'review') $n++;
        }
        return $n;
    }

    // ---------------- Nội bộ ----------------

    private static function memberId(): int
    {
        $u = Session::user() ?? throw new HttpException(401, 'Bạn chưa đăng nhập');
        if ($u['role'] === 'admin') throw new HttpException(403, 'Tài khoản quản trị không gửi phản hồi nấu thử');
        return (int) $u['id'];
    }

    private function visibleFood(mixed $id): array
    {
        $food = is_string($id) && $id !== '' ? $this->foods->find($id) : null;
        if ($food === null || ($food['status'] ?? '') !== 'visible') throw new HttpException(404, 'Không tìm thấy món ăn');
        return $food;
    }

    /** @return array<string,list<array<string,mixed>>> */
    private function groupByFood(): array
    {
        $out = [];
        foreach ($this->repo->all() as $r) $out[$r['foodId']][] = $r;
        return $out;
    }

    /** Dạng trả về cho recipe.mine (giống đầu vào recipe.submit, thêm updatedAt). */
    private static function shape(array $r): array
    {
        return ['foodId' => $r['foodId'], 'portions' => $r['portions'], 'ingredients' => $r['ingredients'], 'taste' => $r['taste'],
            'fit' => $r['fit'], 'difficulty' => $r['difficulty'], 'time' => $r['time'], 'note' => $r['note'], 'updatedAt' => $r['updatedAt']];
    }

    /** Kiểm tra đầu vào recipe.submit; sai → 422 kèm thông báo tiếng Việt. */
    private static function validate(array $p, int $ingredientCount): array
    {
        $fail = static fn (string $m) => throw new HttpException(422, $m);
        $portions = $p['portions'] ?? null;
        if (!is_int($portions) || $portions < 1 || $portions > 10) $fail('Số người ăn cần là số nguyên từ 1 đến 10');

        $list = $p['ingredients'] ?? [];
        if (!is_array($list) || !array_is_list($list)) $fail('Danh sách nguyên liệu không hợp lệ');
        $ingredients = [];
        foreach ($list as $x) {
            $i = is_array($x) ? ($x['index'] ?? null) : null;
            if (!is_int($i) || $i < 0 || $i >= $ingredientCount) $fail('Nguyên liệu không có trong công thức món này');
            if (isset($ingredients[$i])) $fail('Mỗi nguyên liệu chỉ chọn một lần');
            if (!in_array($x['status'] ?? null, self::ING_STATUS, true)) $fail('Trạng thái nguyên liệu chỉ nhận vừa đủ / nên giảm / nên tăng');
            $note = $x['note'] ?? '';
            if (!is_string($note) || mb_strlen(trim($note)) > 80) $fail('Ghi chú cho mỗi nguyên liệu tối đa 80 ký tự');
            $ingredients[$i] = ['index' => $i, 'status' => $x['status']] + (trim($note) !== '' ? ['note' => trim($note)] : []);
        }
        ksort($ingredients);

        $tasteIn = $p['taste'] ?? [];
        if (!is_array($tasteIn)) $fail('Phần vị món ăn không hợp lệ');
        $taste = [];
        foreach (self::TASTE_KEYS as $k) {
            $v = $tasteIn[$k] ?? null;
            if ($v !== null && !in_array($v, self::LEVELS, true)) $fail('Mức vị chỉ nhận nhạt / vừa / đậm');
            $taste[$k] = $v;
        }

        if (!is_bool($p['fit'] ?? null)) $fail('Hãy cho biết món có hợp khẩu vị của bạn không');
        $difficulty = $p['difficulty'] ?? null;
        if ($difficulty !== null && !in_array($difficulty, self::DIFFICULTY, true)) $fail('Độ khó chỉ nhận dễ / vừa / khó');
        $time = $p['time'] ?? null;
        if ($time !== null && !in_array($time, self::TIME, true)) $fail('Thời gian chỉ nhận nhanh hơn / đúng / lâu hơn');
        $note = $p['note'] ?? '';
        if (!is_string($note) || mb_strlen(trim($note)) > 300) $fail('Ghi chú tối đa 300 ký tự');

        return ['portions' => $portions, 'ingredients' => array_values($ingredients), 'taste' => $taste, 'fit' => $p['fit'],
            'difficulty' => $difficulty, 'time' => $time, 'note' => trim($note)];
    }

    /** Tổng hợp mọi phản hồi của 1 món. Nhóm vị/độ khó/thời gian chỉ đếm người có trả lời (bỏ null). */
    private static function aggregate(array $food, array $rows): array
    {
        $n = count($food['ingredients'] ?? []);
        $ing = [];
        for ($i = 0; $i < $n; $i++) $ing[$i] = ['index' => $i, 'total' => 0, 'ok' => 0, 'less' => 0, 'more' => 0];
        $taste = array_fill_keys(self::TASTE_KEYS, array_fill_keys(self::LEVELS, 0));
        $difficulty = array_fill_keys(self::DIFFICULTY, 0);
        $time = array_fill_keys(self::TIME, 0);
        $fitYes = 0;
        foreach ($rows as $r) {
            if ($r['fit']) $fitYes++;
            foreach ($r['ingredients'] as $x) {
                // công thức có thể đã bị sửa sau khi người dùng gửi: bỏ qua chỉ số không còn tồn tại
                if (!isset($ing[$x['index']]) || !in_array($x['status'], self::ING_STATUS, true)) continue;
                $ing[$x['index']][$x['status']]++;
                $ing[$x['index']]['total']++;
            }
            foreach (self::TASTE_KEYS as $k) if (isset($taste[$k][$r['taste'][$k] ?? ''])) $taste[$k][$r['taste'][$k]]++;
            if (isset($difficulty[$r['difficulty'] ?? ''])) $difficulty[$r['difficulty']]++;
            if (isset($time[$r['time'] ?? ''])) $time[$r['time']]++;
        }
        $cooks = count($rows);
        return ['cooks' => $cooks, 'fitYes' => $fitYes, 'fitRate' => $cooks ? (int) round(100 * $fitYes / $cooks) : null,
            'ingredients' => array_values($ing), 'taste' => $taste, 'difficulty' => $difficulty, 'time' => $time];
    }

    /** low-data: chưa đủ COOK_MIN lượt; review: có nguyên liệu (đủ COOK_MIN phản hồi) lệch ≥ 30% hoặc hợp khẩu vị < 60%; còn lại ok. */
    private static function status(array $agg): string
    {
        $min = self::cookMin();
        if ($agg['cooks'] < $min) return 'low-data';
        if ($agg['fitRate'] < self::REVIEW_FIT) return 'review';
        foreach ($agg['ingredients'] as $x) {
            if ($x['total'] >= $min && ($x['less'] + $x['more']) / $x['total'] >= self::REVIEW_RATIO) return 'review';
        }
        return 'ok';
    }

    /** Nguyên liệu lệch nhiều nhất (chỉ xét nguyên liệu có đủ COOK_MIN phản hồi); null nếu không có. */
    private static function topIssue(array $agg, array $food): ?array
    {
        $best = null;
        foreach ($agg['ingredients'] as $x) {
            if ($x['total'] < self::cookMin() || $x['less'] + $x['more'] === 0) continue;
            $kind = $x['less'] >= $x['more'] ? 'less' : 'more';
            $percent = (int) round(100 * $x[$kind] / $x['total']);
            if ($best === null || $percent > $best['percent']) {
                $best = ['index' => $x['index'], 'name' => $food['ingredients'][$x['index']]['name'], 'kind' => $kind, 'percent' => $percent];
            }
        }
        return $best;
    }
}
