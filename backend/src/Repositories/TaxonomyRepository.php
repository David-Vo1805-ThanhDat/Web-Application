<?php
declare(strict_types=1);

namespace App\Repositories;

/**
 * Bảng `taxonomy`: danh mục (CATEGORIES), vùng miền (REGIONS), khẩu vị (TASTES), chế độ ăn (DIETS),
 * bữa ăn (MEALS), thẻ (TAGS — chuỗi). Khi chuyển MySQL sẽ tách thành các bảng categories/regions/tastes/diets/meals/tags.
 */
final class TaxonomyRepository extends Repository
{
    protected const TABLE = 'taxonomy';

    /** @return array<string,mixed> */
    public function get(): array
    {
        return $this->all();
    }

    /** @param array<string,mixed> $taxonomy */
    public function save(array $taxonomy): void
    {
        $this->replaceAll($taxonomy);
    }
}
