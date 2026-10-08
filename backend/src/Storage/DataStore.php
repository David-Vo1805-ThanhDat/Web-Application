<?php
declare(strict_types=1);

namespace App\Storage;

/**
 * Nơi lưu dữ liệu: đọc/ghi từng "bảng" (foods, users, reviews...). Repository là lớp duy nhất được gọi vào đây.
 * Hiện có JsonFileStore. Khi chuyển sang MySQL: các Repository chuyển sang truy vấn SQL (xem backend/README.md).
 */
interface DataStore
{
    /** @return array<mixed> danh sách dòng (hoặc object cấu hình như settings/taxonomy) */
    public function read(string $table): array;

    /** @param array<mixed> $data */
    public function write(string $table, array $data): void;

    /** Xoá toàn bộ dữ liệu đã thay đổi, lần đọc sau sẽ khởi tạo lại từ dữ liệu mẫu. */
    public function reset(): void;

    /** Sao lưu toàn bộ dữ liệu; trả tên bản sao lưu. */
    public function backup(): string;
}
