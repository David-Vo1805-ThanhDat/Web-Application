<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\HttpException;
use App\Core\Session;
use App\Repositories\UserRepository;
use App\Repositories\UserStateRepository;

/**
 * Dữ liệu riêng của người dùng trên web (yêu thích, hồ sơ sức khỏe, nhật ký, lịch sử, thực đơn tuần, nhóm bạn).
 * Server là nơi lưu chính; trình duyệt chỉ giữ bản sao để chạy nhanh (xem frontend/user/js/core/sync.js).
 */
final class UserStateService
{
    /** khoá → kiểu dữ liệu hợp lệ: list = mảng, object = đối tượng, any = một trong hai */
    public const KEYS = ['favorites' => 'list', 'healthProfile' => 'object', 'healthLog' => 'list', 'foodHistory' => 'list', 'weeklyPlan' => 'object', 'group' => 'list'];
    private const MAX_BYTES = 262144;   // 256 KB mỗi khoá
    private const MAX_ITEMS = 2000;

    private UserStateRepository $repo;
    private UserRepository $users;

    public function __construct()
    {
        $this->repo = new UserStateRepository();
        $this->users = new UserRepository();
    }

    /** @return array<string,mixed> chỉ gồm khoá đã từng lưu (null = người dùng đã xoá); khoá chưa từng lưu thì không có */
    public function get(): array
    {
        $row = $this->repo->findByUser($this->userId()) ?? [];
        $out = [];
        foreach (array_keys(self::KEYS) as $k) if (array_key_exists($k, $row)) $out[$k] = $row[$k];
        return $out;
    }

    /** @return array{ok:bool,updatedAt:int} */
    public function save(string $key, mixed $value): array
    {
        if (!isset(self::KEYS[$key])) throw new HttpException(422, 'Khoá dữ liệu không hợp lệ');
        if ($value !== null) $this->validate($key, $value);

        $uid = $this->userId();
        $row = $this->repo->findByUser($uid) ?? ['id' => $uid];
        $row[$key] = $value;
        $row['updatedAt'] = AuditService::nowMs();
        $this->repo->upsert($row);
        $this->reflectOnUser($key, $value);
        return ['ok' => true, 'updatedAt' => $row['updatedAt']];
    }

    private function validate(string $key, mixed $value): void
    {
        $type = self::KEYS[$key];
        $isList = is_array($value) && array_is_list($value);
        if (!is_array($value) || ($type === 'list' && !$isList) || ($type === 'object' && $isList && $value !== [])) {
            throw new HttpException(422, 'Dữ liệu ' . $key . ' sai dạng');
        }
        if ($isList && count($value) > self::MAX_ITEMS) throw new HttpException(422, 'Dữ liệu ' . $key . ' quá dài');
        if (strlen((string) json_encode($value, JSON_UNESCAPED_UNICODE)) > self::MAX_BYTES) throw new HttpException(422, 'Dữ liệu ' . $key . ' quá lớn');
        if ($key === 'favorites') {
            foreach ($value as $id) if (!is_string($id) || strlen($id) > 80) throw new HttpException(422, 'Danh sách yêu thích không hợp lệ');
        }
    }

    /** Cập nhật số liệu hiển thị ở trang admin: số món yêu thích và trạng thái có hồ sơ sức khỏe của người dùng. */
    private function reflectOnUser(string $key, mixed $value): void
    {
        $u = $this->users->find($this->userId());
        if ($u === null) return; // tài khoản quản trị không nằm trong bảng users
        if ($key === 'favorites') $u['favorites'] = is_array($value) ? count($value) : 0;
        elseif ($key === 'healthProfile') $u['hasHealthProfile'] = is_array($value) && $value !== [];
        else return;
        $this->users->update($u);
    }

    private function userId(): string
    {
        $u = Session::user();
        if ($u === null) throw new HttpException(401, 'Bạn chưa đăng nhập');
        return (string) $u['id'];
    }
}
