<?php
declare(strict_types=1);

namespace App\Repositories;

/** Bảng `settings`: một tài liệu duy nhất (general, admins, notify, security, backup). */
final class SettingsRepository extends Repository
{
    protected const TABLE = 'settings';

    /** @return array<string,mixed> */
    public function get(): array
    {
        return $this->all();
    }

    /** @param array<string,mixed> $settings */
    public function save(array $settings): void
    {
        $this->replaceAll($settings);
    }
}
