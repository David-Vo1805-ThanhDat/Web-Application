<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\RecipeFeedbackService;
use App\Services\ReviewService;
use App\Services\UserStateService;

/** Hành động của người dùng đã đăng nhập (dữ liệu riêng, gửi đánh giá). */
final class UserController
{
    public function stateGet(): array { return (new UserStateService())->get(); }
    public function stateSave(array $p): array { return (new UserStateService())->save((string) ($p['key'] ?? ''), $p['value'] ?? null); }
    public function reviewCreate(array $p): array { return (new ReviewService())->create($p); }
    /** Phản hồi "Nấu thử món này" (12/10/2026): xem RecipeFeedbackService. */
    public function recipeMine(array $p): ?array { return (new RecipeFeedbackService())->mine($p); }
    public function recipeSubmit(array $p): array { return (new RecipeFeedbackService())->submit($p); }
    /**
     * Đổi tên hiển thị và/hoặc ảnh đại diện.  { name?: string, avatar?: "data:image/...;base64,..." | null (null/"" = xoá ảnh) }
     * Ảnh (11/10/2026): chỉ người dùng thường (admin chưa hỗ trợ); JPEG/PNG/WebP, tối đa 150 KB, tối đa 1024px mỗi chiều.
     */
    public function profileUpdate(array $p): array
    {
        $hasName = array_key_exists('name', $p);
        $hasAvatar = array_key_exists('avatar', $p);
        if (!$hasName && !$hasAvatar) throw new \App\Core\HttpException(422, 'Không có thông tin nào để cập nhật');
        $name = trim((string) ($p['name'] ?? ''));
        if ($hasName && ($name === '' || mb_strlen($name) > 80)) throw new \App\Core\HttpException(422, 'Tên hiển thị cần từ 1 đến 80 ký tự');
        $avatar = $hasAvatar ? self::validAvatar($p['avatar']) : null;
        $user = \App\Core\Session::user();
        if ($user['role'] === 'admin') {
            if ($hasAvatar) throw new \App\Core\HttpException(422, 'Tài khoản quản trị chưa hỗ trợ ảnh đại diện');
            $repo = new \App\Repositories\SettingsRepository(); $settings = $repo->get();
            foreach ($settings['admins'] as &$admin) if ('admin-' . $admin['id'] === (string) $user['id']) $admin['name'] = $name;
            unset($admin); $repo->save($settings);
            return ['name'=>$name];
        }
        $repo = new \App\Repositories\UserRepository(); $row = $repo->find($user['id']);
        if ($hasName) $row['name'] = $name;
        if ($hasAvatar) $row['avatar'] = $avatar;
        $repo->update($row);
        return ['name'=>$row['name'], 'avatar'=>$row['avatar'] ?? null];
    }

    /** Kiểm tra ảnh đại diện; trả data URL hợp lệ hoặc null (xoá ảnh). */
    private static function validAvatar(mixed $value): ?string
    {
        if ($value === null || $value === '') return null;
        $bad = new \App\Core\HttpException(422, 'Ảnh đại diện không hợp lệ (chỉ nhận JPG, PNG, WebP dưới 150 KB)');
        if (!is_string($value) || strlen($value) > 210000) throw $bad;   // ~150 KB sau khi mã hoá base64
        if (!preg_match('#^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$#', $value, $m)) throw $bad;
        $bytes = base64_decode($m[2], true);
        if ($bytes === false || strlen($bytes) > 150 * 1024) throw $bad;
        $info = @getimagesizefromstring($bytes);   // giải mã thật để chắc đúng là ảnh, không tin phần đầu chuỗi
        if ($info === false || $info['mime'] !== 'image/' . $m[1] || $info[0] < 1 || $info[1] < 1 || $info[0] > 1024 || $info[1] > 1024) throw $bad;
        return $value;
    }
}
