<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\RestaurantService;

/** restaurants.* */
final class RestaurantsController
{
    public function list(array $p): array { return (new RestaurantService())->list($p); }
    public function stats(): array { return (new RestaurantService())->stats(); }
    public function save(array $p): array { return (new RestaurantService())->save($p); }
    public function remove(array $p): array { return (new RestaurantService())->remove((int) ($p['id'] ?? 0)); }
}
