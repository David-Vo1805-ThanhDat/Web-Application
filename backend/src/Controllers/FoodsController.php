<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\FoodService;
use App\Services\TaxonomyService;

/** foods.* và taxonomy.* — nhận tham số từ giao diện, gọi Service, trả dữ liệu. */
final class FoodsController
{
    public function filterOptions(): array { return (new TaxonomyService())->options(); }
    public function list(array $p): array { return (new FoodService())->list($p); }
    public function get(array $p): array { return (new FoodService())->get((string) ($p['id'] ?? '')); }
    public function save(array $p): array { return (new FoodService())->save($p); }
    public function remove(array $p): array { return (new FoodService())->remove((string) ($p['id'] ?? '')); }
    public function bulk(array $p): array { return (new FoodService())->bulk($p); }

    public function taxonomyGet(): array { return (new TaxonomyService())->get(); }
    public function taxonomySave(array $p): array { return (new TaxonomyService())->save($p); }
    public function taxonomyRemove(array $p): array { return (new TaxonomyService())->remove($p); }
}
