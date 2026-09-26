<?php
declare(strict_types=1);

namespace App\Services;

use App\Repositories\FoodRepository;
use App\Repositories\RestaurantRepository;

/**
 * Món ăn cho WEB NGƯỜI DÙNG (công khai, không cần đăng nhập): chỉ món đang hiển thị, đúng dạng dữ liệu mà web đã dùng
 * (allFoods). Nhờ vậy món admin thêm/sửa/ẩn ở bảng quản trị hiện ngay trên web người dùng.
 */
final class PublicFoodService
{
    private FoodRepository $foods;
    private RestaurantRepository $restaurants;

    public function __construct()
    {
        $this->foods = new FoodRepository();
        $this->restaurants = new RestaurantRepository();
    }

    /** @return list<array<string,mixed>> */
    public function catalog(): array
    {
        $byFood = [];
        foreach ($this->restaurants->all() as $r) {
            $byFood[$r['foodId']][] = ['name' => $r['name'], 'address' => $r['address'], 'city' => $r['city'], 'priceEstimate' => $r['priceText']];
        }
        $rows = array_values(array_filter($this->foods->all(), static fn ($f) => $f['status'] === 'visible'));
        usort($rows, static fn ($a, $b) => $a['no'] <=> $b['no']);

        return array_map(static fn (array $f): array => [
            'id' => $f['id'], 'name' => $f['name'], 'englishName' => $f['englishName'], 'description' => $f['description'],
            'category' => $f['category'], 'mealType' => $f['mealType'], 'price' => $f['price'], 'priceRange' => $f['priceRange'],
            'taste' => $f['taste'], 'dietary' => $f['dietary'], 'region' => $f['region'], 'cookTimeMinutes' => $f['cookTimeMinutes'],
            'calories' => $f['calories'], 'rating' => $f['rating'], 'reviewCount' => $f['reviewCount'], 'image' => $f['image'],
            'tags' => $f['tags'], 'popular' => $f['popular'], 'nutrition' => $f['nutrition'], 'ingredients' => $f['ingredients'],
            'instructions' => $f['instructions'], 'suggestedRestaurants' => $byFood[$f['id']] ?? [],
        ], $rows);
    }
}
