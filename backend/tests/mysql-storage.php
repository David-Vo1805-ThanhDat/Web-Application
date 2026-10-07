<?php
declare(strict_types=1);
require dirname(__DIR__) . '/src/bootstrap.php';
use App\Core\App;
use App\Storage\MySqlStore;
use App\Storage\MySqlConnection;

if (!preg_match('/^hnag_test_[a-z0-9_]+$/', (string) App::config('mysql')['dbname'])) throw new RuntimeException('Test database required');
$store = App::store();
if (!$store instanceof MySqlStore) throw new RuntimeException('MySQL store required');
if (($argv[1] ?? '') === 'worker') {
    $store->transaction(function () use ($store): void {
        $users = $store->read('users');
        foreach ($users as &$user) if ($user['id'] === 1) $user['favorites']++;
        unset($user);
        usleep(250000);
        $store->write('users', $users);
    });
    exit;
}
$checks = 0;
$check = static function (bool $condition, string $name) use (&$checks): void {
    if (!$condition) throw new RuntimeException('FAIL: ' . $name);
    $checks++; echo "OK: $name\n";
};
$pdo = MySqlConnection::open(App::config('mysql'));
$foods = $store->read('foods');
$first = $foods[0];
$check(is_int($first['createdAt']) && is_bool($first['popular']) && is_float($first['rating']), 'SQL types mapped to the API');
$store->transaction(function () use ($store, $foods): void {
    $foods[0]['price'] += 1;
    $foods[0]['mealType'] = array_reverse($foods[0]['mealType']);
    $foods[0]['tags'] = array_reverse($foods[0]['tags']);
    $foods[0]['ingredients'] = [['name'=>'Test ingredient', 'amount'=>'1 spoon'], ['name'=>'Test ingredient', 'amount'=>'2 spoons']];
    $foods[0]['instructions'] = ['First test step', 'Second test step'];
    $store->write('foods', $foods);
});
$changed = $store->read('foods')[0];
$check($changed['mealType'] === array_reverse($first['mealType']) && $changed['tags'] === array_reverse($first['tags']), 'food relation order preserved');
$check(count($changed['ingredients']) === 2 && $changed['instructions'] === ['First test step', 'Second test step'], 'ingredients and instructions round trip');
$usersBefore = $store->read('users');
try {
    $store->transaction(function () use ($store): void {
        $foods = $store->read('foods'); $foods[0]['price'] += 99; $store->write('foods', $foods);
        $users = $store->read('users'); $users[0]['name'] = 'Must roll back'; $store->write('users', $users);
        throw new RuntimeException('rollback test');
    });
} catch (RuntimeException $e) { if ($e->getMessage() !== 'rollback test') throw $e; }
$check($store->read('foods') === [$changed, ...array_slice($foods, 1)] && $store->read('users') === $usersBefore, 'multiple-table failure rolls back');
$stamp = (int) round(microtime(true) * 1000);
$store->write('user_state', [['id'=>'1', 'favorites'=>null, 'healthProfile'=>['weightKg'=>65], 'updatedAt'=>$stamp],
    ['id'=>'admin-1', 'group'=>[['name'=>'Admin friend']], 'updatedAt'=>$stamp]]);
$state = array_column($store->read('user_state'), null, 'id');
$check(array_key_exists('favorites', $state[1]) && $state[1]['favorites'] === null && !array_key_exists('weeklyPlan', $state[1]), 'explicit deletion differs from missing state key');
$check($state['admin-1']['group'][0]['name'] === 'Admin friend', 'admin state supported without violating user foreign key');
$check((int) $pdo->query('SELECT COUNT(*) FROM user_state')->fetchColumn() === 1, 'regular state is stored in user_state');
$countBefore = (int) $pdo->query('SELECT favorites_count FROM users WHERE id=1')->fetchColumn();
$workers = [];
for ($i = 0; $i < 2; $i++) {
    $process = proc_open([PHP_BINARY, __FILE__, 'worker'], [0=>['pipe','r'], 1=>['pipe','w'], 2=>['pipe','w']], $pipes);
    $workers[] = [$process, $pipes];
}
foreach ($workers as [$worker, $pipes]) {
    foreach ($pipes as $pipe) fclose($pipe);
    $check(proc_close($worker) === 0, 'concurrent worker commits');
}
$check((int) $pdo->query('SELECT favorites_count FROM users WHERE id=1')->fetchColumn() === $countBefore + 2, 'concurrent read-modify-write keeps both changes');
$store->backup();
$backups = glob(App::config('storage_dir') . '/backups/mysql-*.sql') ?: [];
$backup = (string) file_get_contents(end($backups));
$check(count($backups) > 0 && str_contains($backup, 'CREATE TABLE'), 'SQL backup includes schema and data');
$restoreName = App::config('mysql')['dbname'] . '_restore';
$pdo->exec("CREATE DATABASE `$restoreName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
try {
    $restore = MySqlConnection::open(array_replace(App::config('mysql'), ['dbname'=>$restoreName]));
    $restore->exec($backup);
    $check((int) $restore->query('SELECT COUNT(*) FROM foods')->fetchColumn() === count($foods)
        && (int) $restore->query('SELECT COUNT(*) FROM users')->fetchColumn() === count($usersBefore), 'SQL backup restores into a fresh database');
} finally { $pdo->exec("DROP DATABASE `$restoreName`"); }
$store->reset();
$check(count($store->read('foods')) === 31 && count($store->read('users')) === 1284 && $store->read('user_state') === [], 'demo reset restores data transactionally');
$check($store->read('taxonomy')['CATEGORIES'][0]['slug'] === 'mon-nuoc', 'taxonomy order after reset');
echo "$checks MySQL storage checks passed.\n";
