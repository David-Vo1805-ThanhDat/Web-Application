<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\ReviewService;
use App\Services\UserStateService;

/** Hành động của người dùng đã đăng nhập (dữ liệu riêng, gửi đánh giá). */
final class UserController
{
    public function stateGet(): array { return (new UserStateService())->get(); }
    public function stateSave(array $p): array { return (new UserStateService())->save((string) ($p['key'] ?? ''), $p['value'] ?? null); }
    public function reviewCreate(array $p): array { return (new ReviewService())->create($p); }
    public function profileUpdate(array $p): array
    {
        $name = trim((string) ($p['name'] ?? ''));
        if ($name === '' || mb_strlen($name) > 80) throw new \App\Core\HttpException(422, 'Tên hiển thị cần từ 1 đến 80 ký tự');
        $user = \App\Core\Session::user();
        if ($user['role'] === 'admin') {
            $repo = new \App\Repositories\SettingsRepository(); $settings = $repo->get();
            foreach ($settings['admins'] as &$admin) if ('admin-' . $admin['id'] === (string) $user['id']) $admin['name'] = $name;
            unset($admin); $repo->save($settings);
        } else {
            $repo = new \App\Repositories\UserRepository(); $row = $repo->find($user['id']);
            $row['name'] = $name; $repo->update($row);
        }
        return ['name'=>$name];
    }
}
