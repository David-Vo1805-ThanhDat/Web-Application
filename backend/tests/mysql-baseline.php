<?php
declare(strict_types=1);
require dirname(__DIR__) . '/src/bootstrap.php';
use App\Core\App;
use App\Storage\MySqlConnection;

if (!str_starts_with(App::config('mysql')['dbname'], 'hnag_test_')) throw new RuntimeException('Test database required');
$pdo = MySqlConnection::open(App::config('mysql'));
$n = static fn ($sql) => (int) $pdo->query($sql)->fetchColumn();
$tax = App::store()->read('taxonomy');
$category = $pdo->prepare('SELECT COUNT(*) FROM foods WHERE category_slug = ?'); $category->execute([$tax['CATEGORIES'][0]['slug']]);
$cities = [];
foreach ($pdo->query('SELECT city FROM restaurants')->fetchAll(PDO::FETCH_COLUMN) as $city) foreach (explode('/', $city) as $part) if (trim($part) !== '' && trim($part) !== 'Toàn quốc') $cities[trim($part)] = true;
$sum = $n('SELECT COALESCE(SUM(review_count),0) FROM foods');
echo json_encode([
    'foods'=>$n('SELECT COUNT(*) FROM foods'), 'restaurants'=>$n('SELECT COUNT(*) FROM restaurants'),
    'visible'=>$n("SELECT COUNT(*) FROM foods WHERE status='visible'"), 'pending'=>$n("SELECT COUNT(*) FROM reviews WHERE status='pending'"),
    'feedbackNew'=>$n("SELECT COUNT(*) FROM feedback WHERE status='new'"), 'users'=>$n('SELECT COUNT(*) FROM users'),
    'hasHealth'=>$n('SELECT COUNT(*) FROM users WHERE has_health_profile=1'), 'locked'=>$n("SELECT COUNT(*) FROM users WHERE status='locked'"),
    'admins'=>$n('SELECT COUNT(*) FROM admins'), 'cities'=>count($cities), 'withoutRestaurant'=>$n('SELECT COUNT(*) FROM foods f WHERE NOT EXISTS (SELECT 1 FROM restaurants r WHERE r.food_id=f.id)'),
    'firstCategoryCount'=>(int) $category->fetchColumn(), 'damDa'=>$n("SELECT COUNT(*) FROM food_tastes WHERE taste_slug='dam-da'"),
    'reviewCount'=>$sum, 'rating'=>$sum ? (float) $pdo->query('SELECT SUM(rating*review_count)/SUM(review_count) FROM foods')->fetchColumn() : 0,
    'spins'=>$n('SELECT COALESCE(SUM(spins),0) FROM foods'), 'categories'=>count($tax['CATEGORIES']),
], JSON_THROW_ON_ERROR);
