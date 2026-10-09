<?php
declare(strict_types=1);

namespace App\Storage;

interface DataStore
{
    /** @return array<mixed> */
    public function read(string $table): array;

    /** @param array<mixed> $rows */
    public function write(string $table, array $rows): void;

    public function backup(): void;

}
