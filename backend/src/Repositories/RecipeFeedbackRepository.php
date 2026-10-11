<?php
declare(strict_types=1);

namespace App\Repositories;

/** Bảng `recipe_feedback` — phản hồi "Nấu thử món này" (1 dòng / người dùng / món). */
final class RecipeFeedbackRepository extends Repository
{
    protected const TABLE = 'recipe_feedback';

    /** @return array<string,mixed>|null */
    public function findFor(int $userId, string $foodId): ?array
    {
        foreach ($this->all() as $row) {
            if ($row['userId'] === $userId && $row['foodId'] === $foodId) return $row;
        }
        return null;
    }

    /** @return list<array<string,mixed>> */
    public function forFood(string $foodId): array
    {
        return array_values(array_filter($this->all(), static fn ($r) => $r['foodId'] === $foodId));
    }
}
