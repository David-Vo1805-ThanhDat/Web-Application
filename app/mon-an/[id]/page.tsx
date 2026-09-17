'use client';

import React, { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  Clock,
  Flame,
  Star,
  MapPin,
  ChevronLeft,
  Check,
  Users,
  Globe,
  DollarSign,
  CheckSquare,
  Square,
  Share2,
  ChefHat,
  Utensils,
} from 'lucide-react';
import FoodCard from '@/components/FoodCard';
import Toast, { ToastMessage } from '@/components/Toast';
import {
  getFoodById,
  getRelatedFoods,
  formatPrice,
  getFavoritesFromStorage,
  toggleFavoriteInStorage,
} from '@/lib/food-utils';

export default function FoodDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const food = getFoodById(id);
  if (!food) {
    notFound();
  }

  const relatedFoods = getRelatedFoods(food, 3);

  const [isFavorite, setIsFavorite] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [imgSrc, setImgSrc] = useState(food.image);

  useEffect(() => {
    const list = getFavoritesFromStorage();
    setIsFavorite(list.includes(food.id));

    const handler = () => {
      const updatedList = getFavoritesFromStorage();
      setIsFavorite(updatedList.includes(food.id));
    };
    window.addEventListener('favorites-updated', handler);
    return () => window.removeEventListener('favorites-updated', handler);
  }, [food.id]);

  const handleFavoriteToggle = () => {
    const updated = toggleFavoriteInStorage(food.id);
    setIsFavorite(updated);
    setToast({
      id: Date.now().toString(),
      type: updated ? 'success' : 'info',
      message: updated
        ? `Đã lưu "${food.name}" vào danh sách yêu thích! ❤️`
        : `Đã bỏ lưu "${food.name}" khỏi yêu thích.`,
    });
  };

  const toggleIngredient = (index: number) => {
    const next = new Set(checkedIngredients);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setCheckedIngredients(next);
  };

  const getRegionColor = () => {
    switch (food.region) {
      case 'Bắc': return 'from-blue-600 to-blue-800';
      case 'Trung': return 'from-amber-600 to-orange-700';
      case 'Nam': return 'from-emerald-600 to-teal-700';
      default: return 'from-purple-600 to-indigo-700';
    }
  };

  return (
    <div className="pb-20">
      {/* Hero Banner Section */}
      <section className="relative h-64 sm:h-80 lg:h-96 w-full overflow-hidden">
        <Image
          src={imgSrc}
          alt={food.name}
          fill
          priority
          className="object-cover"
          onError={() => setImgSrc('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&auto=format&fit=crop&q=80')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

        {/* Back Button */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
          <Link
            href="/kham-pha"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/50 backdrop-blur-md text-white text-xs sm:text-sm font-semibold hover:bg-black/70 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Quay Lại</span>
          </Link>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 lg:p-12">
          <div className="max-w-4xl">
            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getRegionColor()}`}>
                {food.region}
              </span>
              {food.popular && (
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-red-600">
                  🔥 Hot & Trending
                </span>
              )}
              {food.dietary.includes('eat-clean') && (
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-emerald-600">
                  🥗 Eat Clean
                </span>
              )}
              {food.dietary.includes('vegetarian') && (
                <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-green-600">
                  🌱 Ăn Chay
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white drop-shadow-md">
              {food.name}
            </h1>
            <p className="text-sm text-slate-300 italic mt-1">
              {food.englishName}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 sm:top-20 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 py-3 overflow-x-auto">
          <div className="flex items-center gap-5 sm:gap-8 flex-shrink-0">
            <div className="flex flex-col items-center text-center">
              <span className="font-black text-base sm:text-lg text-brand-600">{formatPrice(food.price)}</span>
              <span className="text-[10px] text-slate-400 font-medium">Giá ước tính</span>
            </div>
            <div className="flex flex-col items-center text-center border-l border-slate-200 pl-5 sm:pl-8">
              <span className="font-bold text-base sm:text-lg text-slate-800 flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                {food.cookTimeMinutes} phút
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Thời gian</span>
            </div>
            <div className="flex flex-col items-center text-center border-l border-slate-200 pl-5 sm:pl-8">
              <span className="font-bold text-base sm:text-lg text-orange-600 flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                {food.calories} kcal
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Calo</span>
            </div>
            <div className="flex flex-col items-center text-center border-l border-slate-200 pl-5 sm:pl-8">
              <span className="font-bold text-base sm:text-lg text-amber-600 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {food.rating}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">{food.reviewCount} đánh giá</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleFavoriteToggle}
              className={`p-2.5 rounded-xl border transition-all ${
                isFavorite
                  ? 'bg-red-50 border-red-300 text-red-600'
                  : 'border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-500'
              }`}
              title={isFavorite ? 'Bỏ lưu yêu thích' : 'Lưu vào yêu thích'}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* Description */}
        <section className="space-y-3">
          <p className="text-base text-slate-700 leading-relaxed">
            {food.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 pt-1">
            {food.tags.map((tag, i) => (
              <span key={i} className="px-3 py-1 text-xs font-semibold bg-orange-50 text-brand-700 border border-orange-200 rounded-lg">
                #{tag}
              </span>
            ))}
          </div>
        </section>

        {/* Nutrition Info */}
        <section className="bg-gradient-to-r from-slate-50 to-orange-50/40 rounded-2xl p-5 sm:p-6 border border-slate-200/80">
          <h2 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Thông Tin Dinh Dưỡng (trên 1 phần ăn)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-white rounded-xl p-3 border border-orange-100 shadow-sm">
              <span className="block text-xl sm:text-2xl font-black text-orange-600">{food.calories}</span>
              <span className="text-xs text-slate-500 font-medium">Calo (kcal)</span>
            </div>
            <div className="bg-white rounded-xl p-3 border border-blue-100 shadow-sm">
              <span className="block text-xl sm:text-2xl font-black text-blue-600">{food.nutrition.protein}g</span>
              <span className="text-xs text-slate-500 font-medium">Protein</span>
            </div>
            <div className="bg-white rounded-xl p-3 border border-amber-100 shadow-sm">
              <span className="block text-xl sm:text-2xl font-black text-amber-600">{food.nutrition.carbs}g</span>
              <span className="text-xs text-slate-500 font-medium">Carbs</span>
            </div>
            <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm">
              <span className="block text-xl sm:text-2xl font-black text-rose-600">{food.nutrition.fat}g</span>
              <span className="text-xs text-slate-500 font-medium">Chất béo</span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Interactive Ingredient Checklist */}
          <section className="space-y-4">
            <h2 className="font-bold text-slate-800 text-xl flex items-center gap-2">
              <Utensils className="w-5 h-5 text-brand-500" />
              Nguyên Liệu Cần Chuẩn Bị
              <span className="text-xs font-normal text-slate-400 ml-1">
                ({checkedIngredients.size}/{food.ingredients.length} đã chuẩn bị)
              </span>
            </h2>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${(checkedIngredients.size / food.ingredients.length) * 100}%` }}
              />
            </div>

            <ul className="space-y-2">
              {food.ingredients.map((ingredient, i) => (
                <li key={i}>
                  <button
                    onClick={() => toggleIngredient(i)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                      checkedIngredients.has(i)
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-white border border-slate-200 hover:border-brand-200 hover:bg-orange-50/30'
                    }`}
                  >
                    {checkedIngredients.has(i) ? (
                      <CheckSquare className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-semibold ${checkedIngredients.has(i) ? 'line-through text-emerald-600' : 'text-slate-800'}`}>
                        {ingredient.name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium flex-shrink-0">
                      {ingredient.amount}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {checkedIngredients.size === food.ingredients.length && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-sm font-bold text-emerald-700">
                🎉 Bạn đã chuẩn bị đủ nguyên liệu! Bắt đầu nào!
              </div>
            )}
          </section>

          {/* Cooking Steps */}
          <section className="space-y-4">
            <h2 className="font-bold text-slate-800 text-xl flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-brand-500" />
              Các Bước Thực Hiện
            </h2>

            <ol className="space-y-3">
              {food.instructions.map((step, i) => (
                <li key={i}>
                  <button
                    onClick={() => setActiveStep(activeStep === i ? null : i)}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl text-left transition-all ${
                      activeStep === i
                        ? 'bg-brand-50 border border-brand-200'
                        : 'bg-white border border-slate-200 hover:border-brand-200'
                    }`}
                  >
                    <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                      activeStep === i ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {i + 1}
                    </span>
                    <p className={`text-sm leading-relaxed ${activeStep === i ? 'text-brand-700 font-medium' : 'text-slate-700'}`}>
                      {step}
                    </p>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Suggested Restaurants */}
        <section className="space-y-4">
          <h2 className="font-bold text-slate-800 text-xl flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-500" />
            Quán Ăn Ngon Không Cần Nấu 📍
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {food.suggestedRestaurants.map((restaurant, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 hover:border-brand-200 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-800 text-sm leading-snug">{restaurant.name}</h3>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-600 text-xs font-bold flex items-center justify-center">
                    #{i + 1}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span>{restaurant.address}</span>
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                    <Globe className="w-3 h-3" />
                    {restaurant.city}
                  </span>
                  <span className="text-xs font-bold text-brand-600">{restaurant.priceEstimate}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Related Foods */}
        {relatedFoods.length > 0 && (
          <section className="space-y-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-xl">
                Món Ăn Tương Tự Bạn Có Thể Thích 🍽️
              </h2>
              <Link href="/kham-pha" className="text-sm text-brand-600 font-semibold hover:underline">
                Xem Tất Cả →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedFoods.map((food) => (
                <FoodCard key={food.id} food={food} />
              ))}
            </div>
          </section>
        )}
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
