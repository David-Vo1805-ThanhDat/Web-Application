<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\HttpException;
use App\Repositories\UserRepository;
use App\Support\Paginator;
use App\Support\Str;

/** Người dùng: thống kê, danh sách/lọc, xem hồ sơ, khoá/mở khoá. Không bao giờ trả mật khẩu băm ra ngoài. */
final class UserService
{
    private const STATUSES = ['active', 'unverified', 'locked'];

    private UserRepository $repo;
    private AuditService $audit;

    public function __construct()
    {
        $this->repo = new UserRepository();
        $this->audit = new AuditService();
    }

    public function stats(): array
    {
        $u = $this->repo->all();
        $today = (int) strtotime('today') * 1000;
        $since = AuditService::nowMs() - 30 * 86400000;
        return [
            'total' => count($u),
            'activeToday' => count(array_filter($u, static fn ($x) => ($x['lastActiveAt'] ?? 0) >= $today)),
            'hasHealth' => count(array_filter($u, static fn ($x) => $x['hasHealthProfile'])),
            'locked' => count(array_filter($u, static fn ($x) => $x['status'] === 'locked')),
            'new30' => count(array_filter($u, static fn ($x) => $x['joinedAt'] >= $since)),
        ];
    }

    /** @param array<string,mixed> $p q, status, role, sort(new|name|favorites), page, pageSize */
    public function list(array $p): array
    {
        $q = Str::norm($p['q'] ?? '');
        $rows = array_values(array_filter($this->repo->all(), static function (array $u) use ($q, $p): bool {
            if ($q !== '' && !str_contains(Str::norm($u['name'] . ' ' . $u['email']), $q)) return false;
            if (($p['status'] ?? 'all') !== 'all' && $u['status'] !== $p['status']) return false;
            return !(($p['role'] ?? 'all') !== 'all' && $u['role'] !== $p['role']);
        }));
        if (($p['sort'] ?? '') === 'name') usort($rows, static fn ($a, $b) => strcmp(Str::norm($a['name']), Str::norm($b['name'])));
        elseif (($p['sort'] ?? '') === 'favorites') usort($rows, static fn ($a, $b) => $b['favorites'] <=> $a['favorites']);
        $out = Paginator::paginate($rows, $p);
        $out['items'] = array_map([self::class, 'publicUser'], $out['items']);
        return $out;
    }

    public function get(int $id): array
    {
        $u = $this->repo->find($id) ?? throw new HttpException(404, 'Không tìm thấy người dùng');
        return self::publicUser($u);
    }

    public function setStatus(int $id, string $status): array
    {
        if (!in_array($status, self::STATUSES, true)) throw new HttpException(422, 'Trạng thái không hợp lệ');
        $u = $this->repo->find($id) ?? throw new HttpException(404, 'Không tìm thấy người dùng');
        $u['status'] = $status;
        $this->repo->update($u);
        $this->audit->log('lock', ($status === 'locked' ? 'đã tạm khoá tài khoản ' : 'đã mở khoá tài khoản ') . $u['email']);
        return self::publicUser($u);
    }

    /** @param array<string,mixed> $u */
    public static function publicUser(array $u): array
    {
        unset($u['passwordHash']);
        return $u;
    }
}
