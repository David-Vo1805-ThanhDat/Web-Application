<?php
declare(strict_types=1);

namespace App\Repositories;

/**
 * Bảng `user_state`: dữ liệu riêng của từng tài khoản trên web người dùng — món yêu thích, hồ sơ sức khỏe,
 * nhật ký cân nặng, lịch sử món, thực đơn tuần, nhóm bạn. Mỗi dòng: { id: "<mã tài khoản>", <khoá>: giá trị, updatedAt }.
 */
final class UserStateRepository extends Repository
{
    protected const TABLE = 'user_state';

    /** @return array<string,mixed>|null */
    public function findByUser(string $userId): ?array
    {
        return $this->find($userId);
    }

    /** Thêm mới hoặc thay dòng của tài khoản. @param array<string,mixed> $row */
    public function upsert(array $row): void
    {
        $rows = $this->all();
        foreach ($rows as $i => $r) {
            if ((string) $r['id'] === (string) $row['id']) {
                $rows[$i] = $row;
                $this->replaceAll($rows);
                return;
            }
        }
        $rows[] = $row;
        $this->replaceAll($rows);
    }
}
