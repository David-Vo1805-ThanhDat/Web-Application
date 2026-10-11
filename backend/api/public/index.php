<?php
declare(strict_types=1);

/** API công khai (không cần đăng nhập):  POST backend/api/public/index.php?action=foods.list | feedback.create | recipe.stats | reviews.forFood */
require dirname(__DIR__, 2) . '/src/bootstrap.php';

use App\Controllers\PublicController as PublicApi;
use App\Core\Request;
use App\Core\Router;

(new Router([
    'foods.list' => [PublicApi::class, 'foods'],
    'feedback.create' => [PublicApi::class, 'feedbackCreate'],
    'recipe.stats' => [PublicApi::class, 'recipeStats'],
    'reviews.forFood' => [PublicApi::class, 'reviewsForFood'],
]))->run(new Request());
