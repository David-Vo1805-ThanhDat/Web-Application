export type MealType = 'sang' | 'trua' | 'toi' | 'an-vat';

export type TasteType = 
  | 'cay' 
  | 'ngot' 
  | 'man' 
  | 'chua' 
  | 'chua-cay' 
  | 'thanh-dam' 
  | 'beo-ngay';

export type DietaryType = 'normal' | 'vegetarian' | 'eat-clean' | 'low-carb';

export type RegionType = 'Bắc' | 'Trung' | 'Nam' | 'Quốc tế';

export type CategoryType = 
  | 'mon-nuoc' 
  | 'com' 
  | 'cuon-tron' 
  | 'an-vat' 
  | 'lau-nuong' 
  | 'chay' 
  | 'trang-mieng';

export interface Ingredient {
  name: string;
  amount: string;
}

export interface SuggestedRestaurant {
  name: string;
  address: string;
  city: string;
  priceEstimate: string;
}

export interface NutritionInfo {
  protein: number; // in grams
  carbs: number;   // in grams
  fat: number;     // in grams
}

export interface FoodItem {
  id: string;
  name: string;
  englishName: string;
  description: string;
  category: CategoryType;
  mealType: MealType[];
  price: number; // Trung bình VNĐ (ví dụ: 45000)
  priceRange: string; // "< 30k" | "30k - 60k" | "60k - 150k" | "> 150k"
  taste: TasteType[];
  dietary: DietaryType[];
  region: RegionType;
  cookTimeMinutes: number;
  calories: number; // kcal
  rating: number; // 1 to 5
  reviewCount: number;
  image: string;
  tags: string[];
  ingredients: Ingredient[];
  instructions: string[];
  suggestedRestaurants: SuggestedRestaurant[];
  nutrition: NutritionInfo;
  popular?: boolean;
}

export interface FilterOptions {
  mealType?: MealType | 'all';
  priceCategory?: 'all' | 'under-30k' | '30k-60k' | '60k-150k' | 'above-150k';
  taste?: TasteType | 'all';
  dietary?: DietaryType | 'all';
  category?: CategoryType | 'all';
  region?: RegionType | 'all';
  searchQuery?: string;
  sortBy?: 'recommended' | 'price-asc' | 'price-desc' | 'rating' | 'time' | 'calories';
}

export interface ReviewItem {
  id: string;
  foodId: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
}
