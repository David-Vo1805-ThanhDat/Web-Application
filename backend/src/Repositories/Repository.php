<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Core\App;
use App\Storage\DataStore;

/**
 * Lớp gốc của các Repository: mỗi Repository quản lý 1 bảng và là nơi DUY NHẤT chạm vào DataStore.
 * Tầng Service chỉ gọi Repository, không biết dữ liệu nằm ở file JSON hay MySQL.
 */
abstract class Repository
{
    /** Tên bảng (tên file storage/db/<bảng>.json, cũng là tên bảng trong database/schema.sql). */
    protected const TABLE = '';

    protected DataStore $store;

    public function __construct(?DataStore $store = null)
    {
        $this->store = $store ?? App::store();
    }

    /** @return array<mixed> */
    public function all(): array
    {
        return $this->store->read(static::TABLE);
    }

    /** @param array<mixed> $rows */
    public function replaceAll(array $rows): void
    {
        $this->store->write(static::TABLE, $rows);
    }

    /** @return array<string,mixed>|null */
    public function find(int|string $id): ?array
    {
        foreach ($this->all() as $row) {
            if (($row['id'] ?? null) === $id || (string) ($row['id'] ?? '') === (string) $id) {
                return $row;
            }
        }
        return null;
    }

    /** Thay 1 dòng theo id (giữ vị trí). */
    public function update(array $row): void
    {
        $rows = $this->all();
        foreach ($rows as $i => $r) {
            if ((string) $r['id'] === (string) $row['id']) {
                $rows[$i] = $row;
                $this->replaceAll($rows);
                return;
            }
        }
    }

    public function nextId(): int
    {
        $max = 0;
        foreach ($this->all() as $r) {
            $max = max($max, (int) ($r['id'] ?? 0));
        }
        return $max + 1;
    }
}
