<?php
declare(strict_types=1);

namespace App\Storage;

use PDO;

final class MySqlConnection
{
    public static function open(array $config, bool $withDatabase = true): PDO
    {
        $dsn = sprintf('mysql:host=%s;port=%d;%scharset=%s', $config['host'], $config['port'],
            $withDatabase ? 'dbname=' . $config['dbname'] . ';' : '', $config['charset']);
        return new PDO($dsn, $config['user'], $config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
}
