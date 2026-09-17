import foodsData from '@/data/foods.json';
import { FoodItem, FilterOptions, MealType } from '@/types/food';

export const allFoods: FoodItem[] = foodsData as FoodItem[];

export function getAllFoods(): FoodItem[] {
  return allFoods;
}

export function getFoodById(id: string): FoodItem | undefined {
  return allFoods.find((f) => f.id === id);
}

export function getRelatedFoods(currentFood: FoodItem, limit: number = 3): FoodItem[] {
  return allFoods
    .filter((f) => f.id !== currentFood.id)
    .filter((f) => 
      f.category === currentFood.category || 
      f.region === currentFood.region ||
      f.mealType.some((m) => currentFood.mealType.includes(m))
    )
    .slice(0, limit);
}

export function filterFoods(foods: FoodItem[], options: FilterOptions): FoodItem[] {
  let result = [...foods];

  // Search Query
  if (options.searchQuery && options.searchQuery.trim() !== '') {
    const q = options.searchQuery.toLowerCase().trim();
    result = result.filter((f) => 
      f.name.toLowerCase().includes(q) ||
      f.englishName.toLowerCase().includes(q) ||
      f.tags.some((t) => t.toLowerCase().includes(q)) ||
      f.description.toLowerCase().includes(q) ||
      f.ingredients.some((i) => i.name.toLowerCase().includes(q))
    );
  }

  // Meal Type
  if (options.mealType && options.mealType !== 'all') {
    result = result.filter((f) => f.mealType.includes(options.mealType as MealType));
  }

  // Price Category
  if (options.priceCategory && options.priceCategory !== 'all') {
    result = result.filter((f) => {
      if (options.priceCategory === 'under-30k') return f.price < 30000;
      if (options.priceCategory === '30k-60k') return f.price >= 30000 && f.price <= 60000;
      if (options.priceCategory === '60k-150k') return f.price > 60000 && f.price <= 150000;
      if (options.priceCategory === 'above-150k') return f.price > 150000;
      return true;
    });
  }

  // Taste
  if (options.taste && options.taste !== 'all') {
    result = result.filter((f) => f.taste.includes(options.taste as any));
  }

  // Dietary
  if (options.dietary && options.dietary !== 'all') {
    result = result.filter((f) => f.dietary.includes(options.dietary as any));
  }

  // Category
  if (options.category && options.category !== 'all') {
    result = result.filter((f) => f.category === options.category);
  }

  // Region
  if (options.region && options.region !== 'all') {
    result = result.filter((f) => f.region === options.region);
  }

  // Sorting
  if (options.sortBy) {
    switch (options.sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'time':
        result.sort((a, b) => a.cookTimeMinutes - b.cookTimeMinutes);
        break;
      case 'calories':
        result.sort((a, b) => a.calories - b.calories);
        break;
      case 'recommended':
      default:
        result.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0) || b.rating - a.rating);
        break;
    }
  }

  return result;
}

export function getRandomFood(candidates: FoodItem[] = allFoods): FoodItem {
  if (!candidates || candidates.length === 0) {
    return allFoods[Math.floor(Math.random() * allFoods.length)];
  }
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

export function getCurrentMealInfo(): {
  mealType: MealType;
  title: string;
  subtitle: string;
  badge: string;
} {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 10) {
    return {
      mealType: 'sang',
      title: 'Bữa Sáng Nạp Năng Lượng',
      subtitle: 'Khởi đầu ngày mới tỉnh táo với các món ăn nóng hổi bổ dưỡng!',
      badge: 'Bữa Sáng ☀️',
    };
  } else if (hour >= 10 && hour < 14) {
    return {
      mealType: 'trua',
      title: 'Bữa Trưa Chắc Bụng',
      subtitle: 'Nạp lại năng lượng sau giờ làm việc và học tập căng thẳng!',
      badge: 'Bữa Trưa 🍚',
    };
  } else if (hour >= 14 && hour < 17) {
    return {
      mealType: 'an-vat',
      title: 'Xế Chiều Ăn Vặt Tráng Miệng',
      subtitle: 'Trà sữa, bánh ngọt và đồ ăn vặt đánh tan cơn buồn ngủ chiều nay!',
      badge: 'Ăn Vặt Xế Chiều 🧋',
    };
  } else if (hour >= 17 && hour < 22) {
    return {
      mealType: 'toi',
      title: 'Bữa Tối Ấm Cúng',
      subtitle: 'Thưởng thức bữa tối ngon lành cùng gia đình hoặc bạn bè!',
      badge: 'Bữa Tối 🍲',
    };
  } else {
    return {
      mealType: 'an-vat',
      title: 'Cú Đêm Ăn Khuya',
      subtitle: 'Chiếc bụng đói nửa đêm cần được xoa dịu ngay lập tức!',
      badge: 'Ăn Đêm 🌙',
    };
  }
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// LocalStorage helpers for favorites
const FAVORITES_KEY = 'hom_nay_an_gi_favorites';

export function getFavoritesFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteInStorage(id: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const list = getFavoritesFromStorage();
    const exists = list.includes(id);
    let updated: string[];
    if (exists) {
      updated = list.filter((item) => item !== id);
    } else {
      updated = [...list, id];
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    // Trigger custom event so header / other components update immediately
    window.dispatchEvent(new Event('favorites-updated'));
    return !exists;
  } catch {
    return false;
  }
}
