<?php
declare(strict_types=1);

namespace App\Support;

use App\Core\App;

/** Phân trang mảng: trả { items, total, page, pages, pageSize } đúng như giao diện admin mong đợi. */
final class Paginator
{
    /**
     * @param list<mixed> $list
     * @param array<string,mixed> $p  page, pageSize
     * @return array{items:list<mixed>,total:int,page:int,pages:int,pageSize:int}
     */
    public static function paginate(array $list, array $p, ?int $defaultSize = null): array
    {
        $size = max(1, (int) ($p['pageSize'] ?? 0) ?: ($defaultSize ?? (int) App::config('page_size', 8)));
        $size = min($size, 5000);
        $total = count($list);
        $pages = max(1, (int) ceil($total / $size));
        $page = min(max(1, (int) ($p['page'] ?? 1)), $pages);
        return [
            'items' => array_values(array_slice($list, ($page - 1) * $size, $size)),
            'total' => $total, 'page' => $page, 'pages' => $pages, 'pageSize' => $size,
        ];
    }

}
