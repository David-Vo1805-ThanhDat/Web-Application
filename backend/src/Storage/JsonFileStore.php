<?php
declare(strict_types=1);

namespace App\Storage;

use App\Core\HttpException;

/**
 * Lưu mỗi bảng thành 1 file JSON trong storage/db/. Lần đầu chưa có file → khởi tạo từ data/seed/<bảng>.json.
 * Ghi có khoá file (LOCK_EX) và ghi qua file tạm để không hỏng dữ liệu khi có nhiều yêu cầu cùng lúc.
 */
final class JsonFileStore implements DataStore
{
    /** @var array<string,array<mixed>> */
    private array $cache = [];

    public function __construct(private string $storageDir, private string $seedDir)
    {
    }

    public function read(string $table): array
    {
        if (isset($this->cache[$table])) {
            return $this->cache[$table];
        }
        $file = $this->file($table);
        if (!is_file($file)) {
            $this->write($table, Seeder::load($table, $this->seedDir));
            return $this->cache[$table];
        }
        $data = json_decode((string) file_get_contents($file), true);
        if (!is_array($data)) {
            throw new HttpException(500, 'Dữ liệu bảng ' . $table . ' bị hỏng');
        }
        return $this->cache[$table] = $data;
    }

    public function write(string $table, array $data): void
    {
        $dir = $this->storageDir . '/db';
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new HttpException(500, 'Không tạo được thư mục lưu dữ liệu');
        }
        $tmp = $this->file($table) . '.tmp';
        $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        if (file_put_contents($tmp, $json, LOCK_EX) === false || !rename($tmp, $this->file($table))) {
            throw new HttpException(500, 'Không ghi được dữ liệu bảng ' . $table);
        }
        $this->cache[$table] = $data;
    }

    public function reset(): void
    {
        foreach (glob($this->storageDir . '/db/*.json') ?: [] as $f) {
            @unlink($f);
        }
        $this->cache = [];
    }

    public function backup(): string
    {
        $name = date('Ymd-His');
        $dest = $this->storageDir . '/backups/' . $name;
        if (!is_dir($dest) && !mkdir($dest, 0775, true) && !is_dir($dest)) {
            throw new HttpException(500, 'Không tạo được thư mục sao lưu');
        }
        foreach (glob($this->storageDir . '/db/*.json') ?: [] as $f) {
            copy($f, $dest . '/' . basename($f));
        }
        return $name;
    }

    private function file(string $table): string
    {
        return $this->storageDir . '/db/' . preg_replace('/[^a-z_]/', '', $table) . '.json';
    }
}
