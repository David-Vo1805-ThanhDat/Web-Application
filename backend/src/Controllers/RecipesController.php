<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Services\RecipeFeedbackService;

/** recipe.quality.* — trang admin "Chất lượng công thức" (cong-thuc.html), 12/10/2026. */
final class RecipesController
{
    public function qualityList(array $p): array { return (new RecipeFeedbackService())->qualityList($p); }
    public function qualityGet(array $p): array { return (new RecipeFeedbackService())->qualityGet($p); }
}
