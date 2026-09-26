<?php
declare(strict_types=1);

namespace App\Repositories;

/** Bảng `audit` (nhật ký hoạt động): mới nhất nằm đầu danh sách. */
final class AuditRepository extends Repository
{
    protected const TABLE = 'audit';

    /** @param array<string,mixed> $entry */
    public function prepend(array $entry): void
    {
        $rows = $this->all();
        array_unshift($rows, $entry);
        $this->replaceAll(array_slice($rows, 0, 5000)); // giữ tối đa 5.000 sự kiện gần nhất
    }
}
