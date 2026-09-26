<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\App;
use App\Core\HttpException;
use App\Repositories\SettingsRepository;

/** Cài đặt hệ thống: thông tin chung, tài khoản quản trị, thông báo, bảo mật, sao lưu, đặt lại dữ liệu demo. */
final class SettingsService
{
    private SettingsRepository $repo;
    private AuditService $audit;

    public function __construct()
    {
        $this->repo = new SettingsRepository();
        $this->audit = new AuditService();
    }

    public function get(): array
    {
        return self::publicView($this->repo->get());
    }

    /** @param array<string,mixed> $p settings{general,admins,notify,security} */
    public function save(array $p): array
    {
        $in = is_array($p['settings'] ?? null) ? $p['settings'] : throw new HttpException(422, 'Thiếu dữ liệu cài đặt');
        $s = $this->repo->get();

        if (is_array($in['general'] ?? null)) {
            $g = $in['general'];
            $name = trim((string) ($g['platformName'] ?? ''));
            $mail = trim((string) ($g['contactEmail'] ?? ''));
            if ($name === '') throw new HttpException(422, 'Tên nền tảng không được để trống');
            if (!filter_var($mail, FILTER_VALIDATE_EMAIL)) throw new HttpException(422, 'Email liên hệ không hợp lệ');
            $s['general'] = ['platformName' => mb_substr($name, 0, 80), 'tagline' => mb_substr(trim((string) ($g['tagline'] ?? '')), 0, 160), 'contactEmail' => $mail,
                'timezone' => mb_substr((string) ($g['timezone'] ?? $s['general']['timezone']), 0, 60), 'maintenance' => !empty($g['maintenance'])];
        }
        foreach (['notify', 'security'] as $group) {
            if (is_array($in[$group] ?? null)) {
                foreach (array_keys($s[$group]) as $k) $s[$group][$k] = !empty($in[$group][$k]);
            }
        }
        if (is_array($in['admins'] ?? null)) {
            $s['admins'] = $this->mergeAdmins($s['admins'], $in['admins']);
        }
        $this->repo->save($s);
        $this->audit->log('edit', 'đã lưu cài đặt hệ thống');
        return self::publicView($s);
    }

    public function backup(): array
    {
        App::store()->backup();
        $s = $this->repo->get();
        $s['backup']['last'] = 'Hôm nay, ' . date('H:i');
        $this->repo->save($s);
        $this->audit->log('add', 'đã sao lưu dữ liệu thủ công');
        return $s['backup'];
    }

    /** Xoá mọi thay đổi, quay về dữ liệu mẫu ban đầu. */
    public function resetDemo(): array
    {
        App::store()->reset();
        return ['ok' => true];
    }

    /**
     * Giữ mật khẩu băm của quản trị viên cũ; người mới mời nhận mật khẩu demo. Phải còn ít nhất 1 Super admin.
     * @param list<array<string,mixed>> $old
     * @param list<mixed> $incoming
     * @return list<array<string,mixed>>
     */
    private function mergeAdmins(array $old, array $incoming): array
    {
        $byId = array_column($old, null, 'id');
        $out = [];
        $emails = [];
        $nextId = max(array_column($old, 'id') ?: [0]) + 1;
        foreach ($incoming as $a) {
            $name = trim((string) ($a['name'] ?? ''));
            $email = mb_strtolower(trim((string) ($a['email'] ?? '')));
            if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) throw new HttpException(422, 'Họ tên hoặc email quản trị viên không hợp lệ');
            if (isset($emails[$email])) throw new HttpException(409, 'Email quản trị viên bị trùng: ' . $email);
            $emails[$email] = true;
            $role = ($a['role'] ?? '') === 'super' ? 'super' : 'moderator';
            $known = isset($a['id']) ? ($byId[$a['id']] ?? null) : null;
            $out[] = $known
                ? ['id' => $known['id'], 'name' => mb_substr($name, 0, 80), 'email' => $email, 'role' => $role, 'passwordHash' => $known['passwordHash'] ?? '']
                : ['id' => $nextId++, 'name' => mb_substr($name, 0, 80), 'email' => $email, 'role' => $role,
                    'passwordHash' => password_hash((string) App::config('demo_admin_password'), PASSWORD_DEFAULT)];
        }
        if (!array_filter($out, static fn ($a) => $a['role'] === 'super')) throw new HttpException(422, 'Phải còn ít nhất một Super admin');
        return $out;
    }

    /** @param array<string,mixed> $s @return array<string,mixed> */
    private static function publicView(array $s): array
    {
        $s['admins'] = array_map(static function (array $a): array { unset($a['passwordHash']); return $a; }, $s['admins']);
        return $s;
    }
}
