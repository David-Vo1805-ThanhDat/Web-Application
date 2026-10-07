<?php
declare(strict_types=1);

namespace App\Storage;

final class Seeder
{
    /** @param array<mixed> $rows @return array<mixed> */
    public static function withDemoCredentials(string $table, array $rows, string $adminPassword, string $userPassword): array
    {
        if ($table === 'users') {
            $hash = null;
            foreach ($rows as &$row) {
                if (is_array($row) && empty($row['passwordHash'])) {
                    // Demo accounts share a known password; hash it once during initialization.
                    $row['passwordHash'] = $hash ??= password_hash($userPassword, PASSWORD_DEFAULT);
                }
            }
            unset($row);
        }

        if ($table === 'settings' && isset($rows['admins']) && is_array($rows['admins'])) {
            foreach ($rows['admins'] as &$admin) {
                if (is_array($admin) && empty($admin['passwordHash'])) {
                    $admin['passwordHash'] = password_hash($adminPassword, PASSWORD_DEFAULT);
                }
            }
            unset($admin);
        }

        return $rows;
    }
}
