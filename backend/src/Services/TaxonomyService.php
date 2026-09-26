<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\HttpException;
use App\Repositories\FoodRepository;
use App\Repositories\TaxonomyRepository;
use App\Support\Str;

/** Danh mục, vùng miền, khẩu vị, chế độ ăn, thẻ. */
final class TaxonomyService
{
    private const LABEL = ['CATEGORIES' => 'danh mục', 'TASTES' => 'khẩu vị', 'DIETS' => 'chế độ ăn', 'TAGS' => 'thẻ', 'REGIONS' => 'vùng miền'];
    /** Trường của món ăn tham chiếu tới từng loại. */
    private const FOOD_FIELD = ['CATEGORIES' => 'category', 'REGIONS' => 'region', 'TASTES' => 'taste', 'DIETS' => 'dietary', 'TAGS' => 'tags'];

    private TaxonomyRepository $repo;
    private FoodRepository $foods;
    private AuditService $audit;

    public function __construct()
    {
        $this->repo = new TaxonomyRepository();
        $this->foods = new FoodRepository();
        $this->audit = new AuditService();
    }

    /** Cho bộ lọc / form: chưa kèm số đếm. */
    public function options(): array
    {
        $t = $this->repo->get();
        return ['categories' => $t['CATEGORIES'], 'regions' => $t['REGIONS'], 'meals' => $t['MEALS'], 'tastes' => $t['TASTES'], 'diets' => $t['DIETS'], 'tags' => $t['TAGS']];
    }

    /** Trang Danh mục & thẻ: mỗi mục kèm số món đang dùng. */
    public function get(): array
    {
        $t = $this->repo->get();
        $foods = $this->foods->all();
        $count = static fn (callable $fn): int => count(array_filter($foods, $fn));
        foreach ($t['CATEGORIES'] as &$c) $c['count'] = $count(static fn ($f) => $f['category'] === $c['slug']);
        foreach ($t['REGIONS'] as &$r) $r['count'] = $count(static fn ($f) => $f['region'] === $r['slug']);
        foreach ($t['TASTES'] as &$x) $x['count'] = $count(static fn ($f) => in_array($x['slug'], $f['taste'], true));
        foreach ($t['DIETS'] as &$d) $d['count'] = $count(static fn ($f) => in_array($d['slug'], $f['dietary'], true));
        unset($c, $r, $x, $d);
        $t['TAGS'] = array_map(static fn (string $name): array => ['slug' => $name, 'label' => $name, 'count' => $count(static fn ($f) => in_array($name, $f['tags'], true))], $t['TAGS']);
        return $t;
    }

    /** @param array<string,mixed> $p type, item{label,slug,tone,icon,dot}, original */
    public function save(array $p): array
    {
        $type = (string) ($p['type'] ?? '');
        if (!isset(self::LABEL[$type])) throw new HttpException(422, 'Loại không hợp lệ');
        $item = is_array($p['item'] ?? null) ? $p['item'] : [];
        $label = trim((string) ($item['label'] ?? ''));
        if ($label === '') throw new HttpException(422, 'Vui lòng nhập tên ' . self::LABEL[$type]);
        $label = mb_substr($label, 0, 40);
        $t = $this->repo->get();
        $original = isset($p['original']) && $p['original'] !== '' ? (string) $p['original'] : null;

        if ($type === 'TAGS') {
            if (in_array($label, $t['TAGS'], true) && $label !== $original) throw new HttpException(409, 'Thẻ này đã tồn tại');
            if ($original !== null) { // đổi tên thẻ → cập nhật luôn các món đang dùng
                $t['TAGS'] = array_map(static fn ($x) => $x === $original ? $label : $x, $t['TAGS']);
                $foods = $this->foods->all();
                foreach ($foods as &$f) $f['tags'] = array_values(array_unique(array_map(static fn ($x) => $x === $original ? $label : $x, $f['tags'])));
                unset($f);
                $this->foods->replaceAll($foods);
            } else {
                $t['TAGS'][] = $label;
            }
        } elseif ($original !== null) {
            $found = false;
            foreach ($t[$type] as &$x) {
                if ($x['slug'] === $original) { $x = $this->merge($x, $item, $label, $type); $found = true; }
            }
            unset($x);
            if (!$found) throw new HttpException(404, 'Không tìm thấy mục cần sửa');
        } else {
            $slug = Str::slug((string) ($item['slug'] ?? '') ?: $label);
            if ($type === 'REGIONS') $slug = $label; // mã vùng miền chính là tên (khớp trường region của món)
            if ($slug === '') throw new HttpException(422, 'Mã (slug) không hợp lệ');
            foreach ($t[$type] as $x) if ($x['slug'] === $slug) throw new HttpException(409, 'Mã (slug) này đã tồn tại');
            $t[$type][] = $this->merge(['slug' => $slug], $item, $label, $type);
        }
        $this->repo->save($t);
        $this->audit->log('add', 'đã lưu ' . self::LABEL[$type] . ' “' . $label . '”');
        return ['ok' => true];
    }

    /** @param array<string,mixed> $p type, slug */
    public function remove(array $p): array
    {
        $type = (string) ($p['type'] ?? '');
        $slug = (string) ($p['slug'] ?? '');
        if (!isset(self::LABEL[$type])) throw new HttpException(422, 'Loại không hợp lệ');
        $t = $this->repo->get();
        $idx = null;
        foreach ($t[$type] as $i => $x) if ((is_array($x) ? $x['slug'] : $x) === $slug) $idx = $i;
        if ($idx === null) throw new HttpException(404, 'Không tìm thấy');
        $field = self::FOOD_FIELD[$type];
        $used = count(array_filter($this->foods->all(), static fn ($f) => is_array($f[$field]) ? in_array($slug, $f[$field], true) : $f[$field] === $slug));
        if ($used) throw new HttpException(409, "Đang có $used món dùng mục này, hãy chuyển các món sang mục khác trước khi xoá.");
        array_splice($t[$type], $idx, 1);
        $this->repo->save($t);
        $this->audit->log('delete', 'đã xoá ' . self::LABEL[$type] . ' “' . $slug . '”');
        return ['ok' => true];
    }

    /** Chỉ nhận các trường hợp lệ theo từng loại. */
    private function merge(array $base, array $item, string $label, string $type): array
    {
        $tones = ['orange', 'blue', 'purple', 'green', 'amber', 'rose', 'sky'];
        $base['label'] = $label;
        if ($type === 'CATEGORIES') {
            $base['tone'] = in_array($item['tone'] ?? '', $tones, true) ? $item['tone'] : ($base['tone'] ?? 'orange');
            $base['icon'] = in_array($item['icon'] ?? '', ['bowl', 'tag', 'leaf', 'fire', 'star', 'heart'], true) ? $item['icon'] : ($base['icon'] ?? 'tag');
        }
        if ($type === 'REGIONS') {
            $base['dot'] = in_array($item['dot'] ?? '', $tones, true) ? $item['dot'] : ($base['dot'] ?? 'orange');
        }
        return $base;
    }
}
