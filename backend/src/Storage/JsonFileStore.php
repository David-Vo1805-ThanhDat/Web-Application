<?php
declare(strict_types=1);

namespace App\Storage;

use RuntimeException;

final class JsonFileStore implements DataStore
{
    private string $databaseDir;
    private string $backupDir;

    public function __construct(
        private string $storageDir,
        private string $seedDir,
        private string $demoAdminPassword,
        private string $demoUserPassword,
    )
    {
        $this->databaseDir = $this->storageDir . DIRECTORY_SEPARATOR . 'db';
        $this->backupDir = $this->storageDir . DIRECTORY_SEPARATOR . 'backups';
    }

    public function read(string $table): array
    {
        $path = $this->path($table);
        if (!is_file($path)) {
            $this->seed($table, $path);
        }

        $contents = file_get_contents($path);
        if ($contents === false) {
            throw new RuntimeException('Không thể đọc dữ liệu: ' . $table);
        }

        $data = json_decode($contents, true);
        if (!is_array($data)) {
            throw new RuntimeException('Dữ liệu JSON không hợp lệ: ' . $table);
        }
        return $data;
    }

    public function write(string $table, array $rows): void
    {
        $path = $this->path($table);
        $this->ensureDirectory($this->databaseDir);
        $json = json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        if ($json === false) {
            throw new RuntimeException('Không thể mã hóa dữ liệu: ' . $table);
        }

        $temporary = $path . '.tmp.' . bin2hex(random_bytes(6));
        if (file_put_contents($temporary, $json . PHP_EOL, LOCK_EX) === false || !rename($temporary, $path)) {
            @unlink($temporary);
            throw new RuntimeException('Không thể ghi dữ liệu: ' . $table);
        }
    }

    public function backup(): void
    {
        $this->ensureDirectory($this->backupDir);
        $target = $this->backupDir . DIRECTORY_SEPARATOR . date('Ymd-His');
        $suffix = 1;
        while (is_dir($target)) {
            $target = $this->backupDir . DIRECTORY_SEPARATOR . date('Ymd-His') . '-' . $suffix++;
        }
        $this->ensureDirectory($target);
        if (is_dir($this->databaseDir)) {
            foreach (glob($this->databaseDir . DIRECTORY_SEPARATOR . '*.json') ?: [] as $source) {
                if (!copy($source, $target . DIRECTORY_SEPARATOR . basename($source))) {
                    throw new RuntimeException('Không thể sao lưu dữ liệu');
                }
            }
        }
    }

    public function reset(): void
    {
        if (is_dir($this->databaseDir)) {
            foreach (glob($this->databaseDir . DIRECTORY_SEPARATOR . '*.json') ?: [] as $path) {
                @unlink($path);
            }
        }
    }

    private function seed(string $table, string $path): void
    {
        $source = $this->seedDir . DIRECTORY_SEPARATOR . $table . '.json';
        if (!is_file($source)) {
            if (in_array($table, ['user_state'], true)) {
                $this->ensureDirectory($this->databaseDir);
                if (file_put_contents($path, "[]\n", LOCK_EX) !== false) {
                    return;
                }
            }
            throw new RuntimeException('Không tìm thấy dữ liệu khởi tạo: ' . $table);
        }
        $this->ensureDirectory($this->databaseDir);
        $data = json_decode((string) file_get_contents($source), true);
        if (!is_array($data)) {
            throw new RuntimeException('Dữ liệu khởi tạo không hợp lệ: ' . $table);
        }
        $data = Seeder::withDemoCredentials($table, $data, $this->demoAdminPassword, $this->demoUserPassword);
        $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        if ($json === false || file_put_contents($path, $json . PHP_EOL, LOCK_EX) === false) {
            throw new RuntimeException('Không thể khởi tạo dữ liệu: ' . $table);
        }
    }

    private function path(string $table): string
    {
        if (!preg_match('/^[a-z][a-z0-9_]*$/', $table)) {
            throw new RuntimeException('Tên bảng không hợp lệ');
        }
        return $this->databaseDir . DIRECTORY_SEPARATOR . $table . '.json';
    }

    private function ensureDirectory(string $directory): void
    {
        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
            throw new RuntimeException('Không thể tạo thư mục lưu dữ liệu');
        }
    }
}