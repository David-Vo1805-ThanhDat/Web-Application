'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  Heart,
  GridIcon,
  ListIcon,
  ChevronDown,
  X,
  Utensils,
} from 'lucide-react';
import FoodCard from '@/components/FoodCard';
import { allFoods, filterFoods, getFavoritesFromStorage } from '@/lib/food-utils';
import { FoodItem, CategoryType, RegionType, TasteType, DietaryType } from '@/types/food';

function KhamPhaContent() {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>(
    searchParams.get('tab') === 'favorites' ? 'favorites' : 'all'
  );
  const [category, setCategory] = useState<CategoryType | 'all'>(
    (searchParams.get('category') as CategoryType) || 'all'
  );
  const [priceFilter, setPriceFilter] = useState<'all' | 'under-30k' | '30k-60k' | '60k-150k' | 'above-150k'>('all');
  const [tasteFilter, setTasteFilter] = useState<TasteType | 'all'>('all');
  const [dietaryFilter, setDietaryFilter] = useState<DietaryType | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState<RegionType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'price-asc' | 'price-desc' | 'rating' | 'time' | 'calories'>('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [favIds, setFavIds] = useState<string[]>([]);

  useEffect(() => {
    setFavIds(getFavoritesFromStorage());
    const handler = () => setFavIds(getFavoritesFromStorage());
    window.addEventListener('favorites-updated', handler);
    return () => window.removeEventListener('favorites-updated', handler);
  }, []);

  const filteredFoods = useMemo(() => {
    const base = filterFoods(allFoods, {
      searchQuery: query,
      category: category,
      priceCategory: priceFilter,
      taste: tasteFilter,
      dietary: dietaryFilter,
      region: regionFilter,
      sortBy: sortBy,
    });
    if (activeTab === 'favorites') {
      return base.filter((f) => favIds.includes(f.id));
    }
    return base;
  }, [query, category, priceFilter, tasteFilter, dietaryFilter, regionFilter, sortBy, activeTab, favIds]);

  const categoryOptions = [
    { id: 'all', label: 'Tất Cả', emoji: '🍽️' },
    { id: 'mon-nuoc', label: 'Món Nước', emoji: '🍜' },
    { id: 'com', label: 'Cơm', emoji: '🍚' },
    { id: 'cuon-tron', label: 'Đồ Cuốn', emoji: '🥢' },
    { id: 'an-vat', label: 'Ăn Vặt', emoji: '🥪' },
    { id: 'lau-nuong', label: 'Lẩu & Nướng', emoji: '🍲' },
    { id: 'chay', label: 'Chay & Healthy', emoji: '🥗' },
    { id: 'trang-mieng', label: 'Tráng Miệng', emoji: '🧋' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
          <Utensils className="w-3.5 h-3.5" />
          <span>Thực Đơn Phong Phú</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          Khám Phá Ẩm Thực 🧭
        </h1>
        <p className="text-sm text-slate-600">
          35+ món ăn đặc sắc từ Bắc vào Nam — tìm kiếm, lọc và lưu những món yêu thích của bạn.
        </p>
      </div>

      {/* Tabs: All vs Favorites */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-0">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3.5 px-1 font-bold text-sm sm:text-base border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Tất Cả Món Ăn ({allFoods.length})
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`pb-3.5 px-1 font-bold text-sm sm:text-base border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'favorites'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className={`w-4 h-4 ${favIds.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
          <span>Đã Lưu Yêu Thích</span>
          {favIds.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full font-bold">
              {favIds.length}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên món, nguyên liệu, khẩu vị... (vd: phở, cay, bún, healthy)"
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categoryOptions.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id as any)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all border ${
              category === cat.id
                ? 'bg-brand-500 text-white border-brand-500 shadow-md'
                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-200 hover:text-brand-600'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Advanced Filters + Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-brand-300 transition-colors shadow-sm"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Bộ Lọc Nâng Cao</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 font-medium whitespace-nowrap">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400 shadow-sm"
          >
            <option value="recommended">Được Đề Xuất</option>
            <option value="price-asc">Giá Thấp → Cao</option>
            <option value="price-desc">Giá Cao → Thấp</option>
            <option value="rating">Đánh Giá Cao Nhất</option>
            <option value="time">Nấu Nhanh Nhất</option>
            <option value="calories">Ít Calo Nhất</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm animate-in slide-in-from-top-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                💰 Mức Giá
              </label>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="all">Tất cả mức giá</option>
                <option value="under-30k">Dưới 30.000đ</option>
                <option value="30k-60k">30k - 60k</option>
                <option value="60k-150k">60k - 150k</option>
                <option value="above-150k">Trên 150.000đ</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                🔥 Khẩu Vị
              </label>
              <select
                value={tasteFilter}
                onChange={(e) => setTasteFilter(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="all">Mọi khẩu vị</option>
                <option value="cay">Cay nồng 🌶️</option>
                <option value="thanh-dam">Thanh đạm 🍃</option>
                <option value="dam-da">Đậm đà 🍲</option>
                <option value="chua-cay">Chua cay 🍋</option>
                <option value="beo-ngay">Béo ngậy 🧀</option>
                <option value="ngot">Ngọt bùi 🍯</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                🌍 Vùng Miền
              </label>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="all">Tất cả vùng miền</option>
                <option value="Bắc">Miền Bắc 🏯</option>
                <option value="Trung">Miền Trung 🌅</option>
                <option value="Nam">Miền Nam 🌴</option>
                <option value="Quốc tế">Quốc Tế 🌐</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              🥗 Chế Độ Ăn
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'Tất Cả' },
                { id: 'normal', label: 'Bình Thường' },
                { id: 'vegetarian', label: 'Ăn Chay 🌱' },
                { id: 'eat-clean', label: 'Eat Clean 🥑' },
                { id: 'low-carb', label: 'Low-Carb 🥩' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setDietaryFilter(item.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    dietaryFilter === item.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t border-slate-100">
        <span>
          Hiển thị <strong className="text-slate-800">{filteredFoods.length}</strong> món ăn
          {query && <span className="text-brand-600"> cho &quot;{query}&quot;</span>}
        </span>
        {(query || category !== 'all' || priceFilter !== 'all' || tasteFilter !== 'all' || dietaryFilter !== 'all' || regionFilter !== 'all') && (
          <button
            onClick={() => {
              setQuery('');
              setCategory('all');
              setPriceFilter('all');
              setTasteFilter('all');
              setDietaryFilter('all');
              setRegionFilter('all');
            }}
            className="text-brand-600 font-semibold hover:underline"
          >
            Xóa tất cả bộ lọc
          </button>
        )}
      </div>

      {/* Food Grid */}
      {filteredFoods.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="text-6xl">🍽️</div>
          <h3 className="font-bold text-slate-800 text-xl">
            {activeTab === 'favorites'
              ? 'Chưa có món ăn nào được lưu yêu thích!'
              : 'Không tìm thấy món ăn phù hợp!'}
          </h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            {activeTab === 'favorites'
              ? 'Hãy nhấn biểu tượng ❤️ trên các thẻ món ăn để lưu những món bạn yêu thích.'
              : 'Thử điều chỉnh từ khóa tìm kiếm hoặc nới lỏng bộ lọc để có thêm lựa chọn.'}
          </p>
          {activeTab === 'favorites' && (
            <button
              onClick={() => setActiveTab('all')}
              className="px-5 py-2.5 rounded-xl bg-brand-500 text-white font-bold text-sm shadow-md"
            >
              Xem Toàn Bộ Thực Đơn
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {filteredFoods.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function KhamPhaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-32 text-slate-400">Đang tải thực đơn...</div>}>
      <KhamPhaContent />
    </Suspense>
  );
}
