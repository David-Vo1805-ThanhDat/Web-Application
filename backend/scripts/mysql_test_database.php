<?php
declare(strict_types=1);

/** Test-only lifecycle. The strict name guard prevents touching the application database. */
require dirname(__DIR__) . '/src/bootstrap.php';
use App\Core\App;
use App\Storage\MySqlConnection;

$name = (string) ($argv[2] ?? '');
if (!preg_match('/^hnag_test_[a-z0-9_]+$/', $name)) {
    fwrite(STDERR, "Only hnag_test_* databases are allowed.\n"); exit(1);
}
try {
    $pdo = MySqlConnection::open(App::config('mysql'), false);
    if (($argv[1] ?? '') === 'create') {
        $pdo->exec("CREATE DATABASE `$name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE `$name`");
        $sql = (string) file_get_contents(BACKEND_ROOT . '/database/schema.sql');
        $sql = preg_replace('/^CREATE DATABASE[^;]+;\s*USE[^;]+;/m', '', $sql);
        $pdo->exec($sql);
        $sourceName = (string) ($argv[3] ?? '');
        if ($sourceName !== '') {
            if (!preg_match('/^[a-zA-Z][a-zA-Z0-9_]*$/', $sourceName) || $sourceName === $name) throw new RuntimeException('Invalid source database');
            $source = MySqlConnection::open(array_replace(App::config('mysql'), ['dbname'=>$sourceName]));
            $source->beginTransaction();
            try {
                foreach (array_reverse(\App\Storage\MySqlStore::SQL_TABLES) as $table) {
                    foreach ($source->query("SELECT * FROM `$table`")->fetchAll() as $row) {
                        $columns = implode(',', array_map(static fn ($c) => "`$c`", array_keys($row)));
                        $stmt = $pdo->prepare("INSERT INTO `$table` ($columns) VALUES (" . implode(',', array_fill(0, count($row), '?')) . ')');
                        $stmt->execute(array_values($row));
                    }
                }
                $source->commit();
            } catch (Throwable $e) { $source->rollBack(); throw $e; }
        }
    } elseif (($argv[1] ?? '') === 'drop') {
        $pdo->exec("DROP DATABASE IF EXISTS `$name`");
    } else {
        throw new RuntimeException('Expected create or drop');
    }
    echo ($argv[1] ?? '') . ': ' . $name . "\n";
} catch (Throwable $e) {
    fwrite(STDERR, $e->getMessage() . "\n"); exit(1);
}
