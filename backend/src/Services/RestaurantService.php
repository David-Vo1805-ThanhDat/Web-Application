<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\HttpException;
use App\Repositories\FoodRepository;
use App\Repositories\RestaurantRepository;
use App\Support\Paginator;
use App\Support\Str;

/** Quán ăn gợi ý (mỗi quán gắn với 1 món). */
final class RestaurantService
{
    private RestaurantRepository $repo;
    private FoodRepository $foods;
    private AuditService $audit;

    public function __construct()
    {
        $this->repo = new RestaurantRepository();
        $this->foods = new FoodRepository();
        $this->audit = new AuditService();
    }

    /** "TP.HCM / Hà Nội" = quán có ở nhiều thành phố; "Toàn quốc" không tính là thành phố. @return list<string> */
    public static function cityParts(string $city): array
    {
        return array_values(array_filter(array_map('trim', explode('/', $city)), static fn ($c) => $c !== '' && $c !== 'Toàn quốc'));
    }

    /** "60.000đ - 85.000đ" → ['priceMin' => 60000, 'priceMax' => 85000]. @return array{priceMin:int,priceMax:int} */
    public static function priceRange(string $text): array
    {
        preg_match_all('/[\d.]+/', $text, $m);
        $n = array_map(static fn ($s) => (int) str_replace('.', '', $s), $m[0]);
        return ['priceMin' => $n[0] ?? 0, 'priceMax' => $n[1] ?? 0];
    }

    /** @param array<string,mixed> $p q, foodId, city, page, pageSize */
    public function list(array $p): array
    {
        $q = Str::norm($p['q'] ?? '');
        $names = array_column($this->foods->all(), 'name', 'id');
        $all = $this->repo->all();
        $rows = [];
        foreach ($all as $r) {
            if ($q !== '' && !str_contains(Str::norm($r['name'] . ' ' . $r['address']), $q)) continue;
            if (($p['foodId'] ?? 'all') !== 'all' && $r['foodId'] !== $p['foodId']) continue;
            if (($p['city'] ?? 'all') !== 'all' && !in_array($p['city'], self::cityParts($r['city']), true)) continue;
            $r['foodName'] = $names[$r['foodId']] ?? '—';
            $rows[] = $r;
        }
        $out = Paginator::paginate($rows, $p);
        $out['all'] = count($all);
        return $out;
    }

    public function stats(): array
    {
        $rs = $this->repo->all();
        $cities = [];
        foreach ($rs as $r) foreach (self::cityParts($r['city']) as $c) $cities[$c] = ($cities[$c] ?? 0) + 1;
        arsort($cities);
        $with = array_flip(array_column($rs, 'foodId'));
        $foods = $this->foods->all();
        return [
            'total' => count($rs), 'cities' => array_keys($cities),
            'foodsWithoutRestaurant' => count(array_filter($foods, static fn ($f) => !isset($with[$f['id']]))),
            'avgPerFood' => count($rs) / max(1, count($foods)),
        ];
    }

    /** @param array<string,mixed> $p restaurant{id?,name,foodId,address,city,priceText} */
    public function save(array $p): array
    {
        $in = is_array($p['restaurant'] ?? null) ? $p['restaurant'] : throw new HttpException(422, 'Thiếu dữ liệu quán ăn');
        $name = trim((string) ($in['name'] ?? ''));
        $address = trim((string) ($in['address'] ?? ''));
        $city = trim((string) ($in['city'] ?? ''));
        $foodId = (string) ($in['foodId'] ?? '');
        if ($name === '' || $address === '' || $city === '') throw new HttpException(422, 'Vui lòng nhập tên quán, địa chỉ và thành phố');
        if ($this->foods->find($foodId) === null) throw new HttpException(422, 'Món ăn liên kết không tồn tại');
        $price = mb_substr(trim((string) ($in['priceText'] ?? '')), 0, 60);
        $row = ['name' => mb_substr($name, 0, 120), 'foodId' => $foodId, 'address' => mb_substr($address, 0, 200), 'city' => mb_substr($city, 0, 60), 'priceText' => $price] + self::priceRange($price);

        if (!empty($in['id'])) {
            if ($this->repo->find((int) $in['id']) === null) throw new HttpException(404, 'Không tìm thấy quán');
            $row = ['id' => (int) $in['id']] + $row;
            $this->repo->update($row);
            $this->audit->log('edit', 'đã sửa quán “' . $row['name'] . '”');
        } else {
            $rows = $this->repo->all();
            $row = ['id' => $this->repo->nextId()] + $row;
            $rows[] = $row;
            $this->repo->replaceAll($rows);
            $this->audit->log('add', 'đã thêm quán “' . $row['name'] . '”');
        }
        return $row;
    }

    public function remove(int $id): array
    {
        $rows = $this->repo->all();
        foreach ($rows as $i => $r) {
            if ($r['id'] === $id) {
                array_splice($rows, $i, 1);
                $this->repo->replaceAll($rows);
                $this->audit->log('delete', 'đã xoá quán “' . $r['name'] . '”');
                return ['ok' => true];
            }
        }
        throw new HttpException(404, 'Không tìm thấy quán');
    }
}
