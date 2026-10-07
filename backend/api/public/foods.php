<?php
declare(strict_types=1);

/**
 * Danh sách món ăn cho web người dùng dưới dạng SCRIPT:  <script src="../../backend/api/public/foods.php"></script>
 * Trả về `const allFoods = [...]` — đúng biến mà code web người dùng vẫn dùng, nên trang nạp đồng bộ như file foods.js trước đây,
 * nhưng dữ liệu lấy từ backend (món admin thêm/sửa/ẩn có hiệu lực ngay).
 */
require dirname(__DIR__, 2) . '/src/bootstrap.php';

use App\Services\PublicFoodService;
use App\Core\App;
use App\Repositories\TaxonomyRepository;

header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: no-cache');
try {
    [$foods, $categories] = App::transaction(static fn () => [
        (new PublicFoodService())->catalog(),
        array_map(static fn ($c) => ['slug'=>$c['slug'], 'label'=>$c['label']], (new TaxonomyRepository())->get()['CATEGORIES']),
    ], false);
    echo '// Sinh tự động bởi backend/api/public/foods.php — KHÔNG sửa tay. Sửa món ở bảng quản trị.', "\n";
    echo 'const allFoods = ', json_encode($foods, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR), ";\n";
    echo 'const allCategories = ', json_encode($categories, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR), ";\n";
} catch (Throwable $e) {
    error_log('[backend] ' . $e);
    http_response_code(500);
    echo "const allFoods = [];\nconst allCategories = [];\nconsole.error('Không tải được danh sách món ăn từ backend.');\n";
}
