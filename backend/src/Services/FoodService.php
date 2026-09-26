<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\HttpException;
use App\Core\Session;
use App\Repositories\FoodRepository;
use App\Repositories\RestaurantRepository;
use App\Support\Paginator;
use App\Support\Str;

/** Quản lý món ăn: danh sách/lọc, xem, thêm/sửa, xoá, thao tác hàng loạt. */
final class FoodService
{
    private const STATUSES = ['visible', 'hidden', 'pending'];

    private FoodRepository $foods;
    private RestaurantRepository $restaurants;
    private TaxonomyService $taxonomy;
    private AuditService $audit;

    public function __construct()
    {
        $this->foods = new FoodRepository();
        $this->restaurants = new RestaurantRepository();
        $this->taxonomy = new TaxonomyService();
        $this->audit = new AuditService();
    }

    /** @param array<string,mixed> $p q, category, meal, region, status, sort, page, pageSize */
    public function list(array $p): array
    {
        $q = Str::norm($p['q'] ?? '');
        $all = $this->foods->all();
        $list = array_values(array_filter($all, static function (array $f) use ($q, $p): bool {
            if ($q !== '' && !str_contains(Str::norm($f['name'] . ' ' . $f['englishName'] . ' ' . $f['id']), $q)) return false;
            if (($p['category'] ?? 'all') !== 'all' && $f['category'] !== $p['category']) return false;
            if (($p['meal'] ?? 'all') !== 'all' && !in_array($p['meal'], $f['mealType'], true)) return false;
            if (($p['region'] ?? 'all') !== 'all' && $f['region'] !== $p['region']) return false;
            return !(($p['status'] ?? 'all') !== 'all' && $f['status'] !== $p['status']);
        }));
        $cmp = match ($p['sort'] ?? 'no') {
            'name' => static fn ($a, $b) => strcmp(Str::norm($a['name']), Str::norm($b['name'])),
            'price' => static fn ($a, $b) => $a['price'] <=> $b['price'],
            'rating' => static fn ($a, $b) => $b['rating'] <=> $a['rating'],
            default => static fn ($a, $b) => $a['no'] <=> $b['no'],
        };
        usort($list, $cmp);
        $out = Paginator::paginate($list, $p);
        $out['all'] = count($all);
        return $out;
    }

    public function get(string $id): array
    {
        $f = $this->foods->find($id);
        if ($f === null) throw new HttpException(404, 'Không tìm thấy món ăn');
        $f['restaurants'] = array_values(array_filter($this->restaurants->all(), static fn ($r) => $r['foodId'] === $id));
        return $f;
    }

    /** @param array<string,mixed> $p food{...}, restaurants[] */
    public function save(array $p): array
    {
        $in = is_array($p['food'] ?? null) ? $p['food'] : throw new HttpException(422, 'Thiếu dữ liệu món ăn');
        $food = $this->clean($in);
        $rows = $this->foods->all();
        $idx = null;
        foreach ($rows as $i => $r) if ($food['id'] !== '' && $r['id'] === $food['id']) $idx = $i;

        if ($idx === null) { // thêm mới
            $food['id'] = $this->uniqueId($rows, $food['id'] !== '' ? $food['id'] : Str::slug($food['name']));
            $food += ['no' => count($rows) + 1, 'createdAt' => AuditService::nowMs(), 'createdBy' => Session::actorName(),
                'stats' => ['views' => 0, 'spins' => 0, 'favorites' => 0], 'rating' => 0, 'reviewCount' => 0];
            $food['updatedAt'] = AuditService::nowMs();
            $rows[] = $food;
            $this->audit->log('add', 'đã thêm món mới “' . $food['name'] . '”');
        } else { // sửa: giữ các trường hệ thống
            $old = $rows[$idx];
            foreach (['no', 'stats', 'rating', 'reviewCount', 'createdAt', 'createdBy'] as $k) $food[$k] = $old[$k];
            $food['updatedAt'] = AuditService::nowMs();
            $rows[$idx] = $food;
            $this->audit->log('edit', 'đã cập nhật món “' . $food['name'] . '”');
        }
        $this->foods->replaceAll($rows);

        if (is_array($p['restaurants'] ?? null)) { // thay toàn bộ quán gợi ý của món bằng danh sách từ form
            $rs = $this->restaurants->all();
            $keep = array_values(array_filter($rs, static fn ($r) => $r['foodId'] !== $food['id']));
            $nextId = $this->restaurants->nextId();
            foreach ($p['restaurants'] as $r) {
                $name = trim((string) ($r['name'] ?? ''));
                if ($name === '') continue;
                $keep[] = ['id' => !empty($r['id']) ? (int) $r['id'] : $nextId++, 'foodId' => $food['id'], 'name' => mb_substr($name, 0, 120),
                    'address' => mb_substr(trim((string) ($r['address'] ?? '')), 0, 200), 'city' => mb_substr(trim((string) ($r['city'] ?? '')), 0, 60),
                    'priceText' => mb_substr(trim((string) ($r['priceText'] ?? '')), 0, 60)]
                    + RestaurantService::priceRange((string) ($r['priceText'] ?? ''));
            }
            $this->restaurants->replaceAll($keep);
        }
        return $food;
    }

    public function remove(string $id): array
    {
        $rows = $this->foods->all();
        foreach ($rows as $i => $f) {
            if ($f['id'] !== $id) continue;
            $plans = intdiv((int) $f['stats']['favorites'], 100);
            if ($plans > 0) throw new HttpException(409, "Món đang được gắn trong $plans thực đơn sức khỏe của người dùng. Hãy ẩn món thay vì xoá.");
            array_splice($rows, $i, 1);
            $this->foods->replaceAll($rows);
            $this->restaurants->replaceAll(array_values(array_filter($this->restaurants->all(), static fn ($r) => $r['foodId'] !== $id)));
            $this->audit->log('delete', 'đã xoá món “' . $f['name'] . '”');
            return ['ok' => true];
        }
        throw new HttpException(404, 'Không tìm thấy món ăn');
    }

    /** @param array<string,mixed> $p ids[], action hide|show|delete */
    public function bulk(array $p): array
    {
        $action = (string) ($p['action'] ?? '');
        if (!in_array($action, ['hide', 'show', 'delete'], true)) throw new HttpException(422, 'Thao tác không hợp lệ');
        $ids = array_map('strval', (array) ($p['ids'] ?? []));
        $rows = $this->foods->all();
        $n = 0;
        foreach ($rows as $i => $f) {
            if (!in_array($f['id'], $ids, true)) continue;
            if ($action === 'delete') {
                if (intdiv((int) $f['stats']['favorites'], 100) > 0) continue;
                unset($rows[$i]);
            } else {
                $rows[$i]['status'] = $action === 'hide' ? 'hidden' : 'visible';
            }
            $n++;
        }
        $this->foods->replaceAll(array_values($rows));
        $this->audit->log($action === 'delete' ? 'delete' : 'edit', 'đã ' . ['hide' => 'ẩn', 'show' => 'hiện', 'delete' => 'xoá'][$action] . " $n món ăn");
        return ['ok' => true, 'count' => $n];
    }

    /**
     * Làm sạch dữ liệu từ form: chỉ giữ các trường hợp lệ, ép kiểu, kiểm tra bắt buộc.
     * @param array<string,mixed> $in
     * @return array<string,mixed>
     */
    private function clean(array $in): array
    {
        $opt = $this->taxonomy->options();
        $slugs = static fn (array $list): array => array_map(static fn ($x) => is_array($x) ? $x['slug'] : $x, $list);
        $list = static fn (mixed $v, ?array $allowed = null): array => array_values(array_unique(array_filter(array_map(
            static fn ($x) => trim((string) $x), (array) $v), static fn ($x) => $x !== '' && ($allowed === null || in_array($x, $allowed, true)))));
        $int = static fn (mixed $v): int => max(0, (int) $v);

        $name = trim((string) ($in['name'] ?? ''));
        $desc = trim((string) ($in['description'] ?? ''));
        $price = $int($in['price'] ?? 0);
        if ($name === '') throw new HttpException(422, 'Vui lòng nhập tên món');
        if ($desc === '') throw new HttpException(422, 'Vui lòng nhập mô tả món');
        if ($price <= 0) throw new HttpException(422, 'Giá phải lớn hơn 0');
        $category = (string) ($in['category'] ?? '');
        if (!in_array($category, $slugs($opt['categories']), true)) throw new HttpException(422, 'Danh mục không hợp lệ');
        $region = (string) ($in['region'] ?? '');
        if (!in_array($region, $slugs($opt['regions']), true)) throw new HttpException(422, 'Vùng miền không hợp lệ');
        $image = trim((string) ($in['image'] ?? ''));
        if (strlen($image) > 2_500_000) throw new HttpException(422, 'Ảnh quá lớn');
        if ($image !== '' && !preg_match('#^(https?://|data:image/(png|jpe?g|webp);base64,|[\w./-]+$)#i', $image)) throw new HttpException(422, 'Đường dẫn ảnh không hợp lệ');
        $status = (string) ($in['status'] ?? 'hidden');

        return [
            'id' => Str::slug((string) ($in['id'] ?? '')), 'name' => mb_substr($name, 0, 120), 'englishName' => mb_substr(trim((string) ($in['englishName'] ?? '')), 0, 120),
            'description' => mb_substr($desc, 0, 1000), 'category' => $category, 'region' => $region, 'cookTimeMinutes' => $int($in['cookTimeMinutes'] ?? 0),
            'mealType' => $list($in['mealType'] ?? [], $slugs($opt['meals'])), 'taste' => $list($in['taste'] ?? [], $slugs($opt['tastes'])),
            'dietary' => $list($in['dietary'] ?? [], $slugs($opt['diets'])), 'tags' => $list($in['tags'] ?? []),
            'price' => $price, 'priceRange' => mb_substr(trim((string) ($in['priceRange'] ?? '')), 0, 40), 'calories' => $int($in['calories'] ?? 0),
            'nutrition' => ['protein' => $int($in['nutrition']['protein'] ?? 0), 'carbs' => $int($in['nutrition']['carbs'] ?? 0), 'fat' => $int($in['nutrition']['fat'] ?? 0)],
            'image' => $image,
            'ingredients' => array_values(array_filter(array_map(static fn ($x) => ['name' => mb_substr(trim((string) ($x['name'] ?? '')), 0, 120), 'amount' => mb_substr(trim((string) ($x['amount'] ?? '')), 0, 60)], (array) ($in['ingredients'] ?? [])), static fn ($x) => $x['name'] !== '')),
            'instructions' => $list($in['instructions'] ?? []),
            'popular' => !empty($in['popular']), 'status' => in_array($status, self::STATUSES, true) ? $status : 'hidden',
        ];
    }

    /** @param list<array<string,mixed>> $rows */
    private function uniqueId(array $rows, string $base): string
    {
        $base = $base !== '' ? $base : 'mon-an';
        $ids = array_column($rows, 'id');
        $id = $base;
        for ($n = 2; in_array($id, $ids, true); $n++) $id = $base . '-' . $n;
        return $id;
    }
}
