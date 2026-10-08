<?php
declare(strict_types=1);

namespace App\Storage;

use App\Core\App;
use App\Core\HttpException;

/** Đọc dữ liệu mẫu (data/seed/*.json) và bổ sung phần chỉ backend mới có: mật khẩu băm cho tài khoản demo. */
final class Seeder
{
    /** @return array<mixed> */
    public static function load(string $table, string $seedDir): array
    {
        $file = $seedDir . '/' . $table . '.json';
        if (!is_file($file) && in_array($table, ['user_state'], true)) {
            return []; // bảng chỉ có dữ liệu do người dùng tạo ra, không có dữ liệu mẫu
        }
        if (!is_file($file)) {
            throw new HttpException(500, 'Thiếu dữ liệu mẫu: ' . $table . '.json (chạy node backend/scripts/export_seed.js)');
        }
        $data = json_decode((string) file_get_contents($file), true);
        if (!is_array($data)) {
            throw new HttpException(500, 'Dữ liệu mẫu ' . $table . '.json không hợp lệ');
        }
        return match ($table) {
            'users' => self::prepareUsers($data),
            'settings' => self::prepareSettings($data),
            default => $data,
        };
    }

    /** @param list<array<string,mixed>> $users */
    private static function prepareUsers(array $users): array
    {
        $hash = password_hash((string) App::config('demo_user_password'), PASSWORD_DEFAULT); // 1 hash dùng chung cho dữ liệu mẫu
        $today = self::todayMs();
        $now = (int) round(microtime(true) * 1000);
        $step = (int) (445 * 86400000 / max(1, count($users) - 7)); // 7 người đầu giữ ngày cố định; còn lại rải đều trong ~445 ngày gần đây
        foreach ($users as $i => &$u) {
            if ($i >= 7) {
                $u['joinedAt'] = $now - ($i - 7) * $step - 3600000;
            }
            $u['passwordHash'] = $hash;
            $u['lastActiveAt'] = ($i % 4 === 0 && $i < 1248) ? $today + ($i % 600) * 60000 : null; // 312 người "hoạt động hôm nay"
        }
        return $users;
    }

    /** @param array<string,mixed> $settings */
    private static function prepareSettings(array $settings): array
    {
        $hash = password_hash((string) App::config('demo_admin_password'), PASSWORD_DEFAULT);
        foreach ($settings['admins'] as &$a) {
            $a['passwordHash'] = $hash;
        }
        return $settings;
    }

    private static function todayMs(): int
    {
        return (int) strtotime('today') * 1000;
    }
}
