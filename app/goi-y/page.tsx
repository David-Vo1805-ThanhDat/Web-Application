'use client';

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Filter, 
  RotateCcw, 
  Check, 
  Dices, 
  Flame, 
  DollarSign, 
  Utensils, 
  Leaf,
  Globe,
  HelpCircle
} from 'lucide-react';
import LuckyWheel from '@/components/LuckyWheel';
import DiceRandomizer from '@/components/DiceRandomizer';
import ResultModal from '@/components/ResultModal';
import FoodCard from '@/components/FoodCard';
import { allFoods, filterFoods } from '@/lib/food-utils';
import { FoodItem, MealType, TasteType, DietaryType, RegionType } from '@/types/food';

export default function GoiYPage() {
  // Modes: 'wheel' or 'dice'
  const [mode, setMode] = useState<'wheel' | 'dice'>('wheel');

  // Filter States
  const [selectedMeal, setSelectedMeal] = useState<MealType | 'all'>('all');
  const [selectedPrice, setSelectedPrice] = useState<'all' | 'under-30k' | '30k-60k' | '60k-150k' | 'above-150k'>('all');
  const [selectedTaste, setSelectedTaste] = useState<TasteType | 'all'>('all');
  const [selectedDietary, setSelectedDietary] = useState<DietaryType | 'all'>('all');
  const [selectedRegion, setSelectedRegion] = useState<RegionType | 'all'>('all');

  // Result Modal
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Compute filtered candidates based on selected criteria
  const candidates = useMemo(() => {
    return filterFoods(allFoods, {
      mealType: selectedMeal,
      priceCategory: selectedPrice,
      taste: selectedTaste,
      dietary: selectedDietary,
      region: selectedRegion,
    });
  }, [selectedMeal, selectedPrice, selectedTaste, selectedDietary, selectedRegion]);

  const handleResetFilters = () => {
    setSelectedMeal('all');
    setSelectedPrice('all');
    setSelectedTaste('all');
    setSelectedDietary('all');
    setSelectedRegion('all');
  };

  const handleFoodChosen = (food: FoodItem) => {
    setSelectedFood(food);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-700 text-xs sm:text-sm font-bold">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <span>Máy Gợi Ý Đồ Ăn Thông Minh</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
          Hôm Nay Bạn Muốn <span className="text-gradient-food">Ăn Gì?</span> 🎯
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Tùy chỉnh bữa ăn, ngân sách, khẩu vị và chế độ ăn của bạn, sau đó để vòng quay may mắn chọn giúp bạn món ngon lý tưởng cho ngày hôm nay!
        </p>
      </div>

      {/* Filter Selection Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-brand-600" />
            <h2 className="font-bold text-slate-800 text-lg">
              Bộ Lọc Tiêu Chí Ẩm Thực
            </h2>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-slate-500 hover:text-brand-600 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại bộ lọc mặc định</span>
          </button>
        </div>

        {/* 1. Bữa Ăn */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-brand-500" />
            <span>1. Thời Điểm Bữa Ăn</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Tất Cả' },
              { id: 'sang', label: 'Bữa Sáng ☀️' },
              { id: 'trua', label: 'Bữa Trưa 🍚' },
              { id: 'toi', label: 'Bữa Tối 🍲' },
              { id: 'an-vat', label: 'Ăn Vặt / Đêm 🧋' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedMeal(item.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  selectedMeal === item.id
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Ngân Sách */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-brand-500" />
            <span>2. Mức Ngân Sách / Ví Tiền</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'Mọi mức giá' },
              { id: 'under-30k', label: '< 30.000đ (Sinh viên)' },
              { id: '30k-60k', label: '30k - 60k (Bình dân)' },
              { id: '60k-150k', label: '60k - 150k (Sang xịn)' },
              { id: 'above-150k', label: '> 150.000đ (Lẩu & Tiệc)' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedPrice(item.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  selectedPrice === item.id
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Khẩu Vị & Chế Độ Ăn */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Khẩu vị */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-brand-500" />
              <span>3. Khẩu Vị Ưu Tiên</span>
            </label>
            <select
              value={selectedTaste}
              onChange={(e) => setSelectedTaste(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Bất kỳ khẩu vị nào</option>
              <option value="cay">Cay nồng xé lưỡi 🌶️</option>
              <option value="thanh-dam">Thanh đạm, nhẹ bụng 🍃</option>
              <option value="dam-da">Đậm đà chuẩn vị 🍲</option>
              <option value="chua-cay">Chua cay bùng nổ 🍋</option>
              <option value="beo-ngay">Béo ngậy thơm ngon 🧀</option>
              <option value="ngot">Ngọt bùi tráng miệng 🍯</option>
            </select>
          </div>

          {/* Chế độ ăn */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-emerald-500" />
              <span>4. Chế Độ Ăn</span>
            </label>
            <select
              value={selectedDietary}
              onChange={(e) => setSelectedDietary(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Mọi chế độ</option>
              <option value="normal">Ăn bình thường</option>
              <option value="vegetarian">Ăn chay thanh tịnh 🥗</option>
              <option value="eat-clean">Eat Clean / Healthy 🥑</option>
              <option value="low-carb">Low-Carb / Ít tinh bột 🥩</option>
            </select>
          </div>

          {/* Vùng miền */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>5. Vùng Miền Ẩm Thực</span>
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Cả 3 miền & Quốc tế</option>
              <option value="Bắc">Miền Bắc (Hà Nội, vùng cao)</option>
              <option value="Trung">Miền Trung (Huế, Đà Nẵng)</option>
              <option value="Nam">Miền Nam (Sài Gòn, miền Tây)</option>
              <option value="Quốc tế">Món Á - Âu Quốc tế</option>
            </select>
          </div>
        </div>

        {/* Current status info */}
        <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-between text-xs sm:text-sm font-semibold text-brand-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Có <strong>{candidates.length}</strong> món ăn đáp ứng tiêu chí đã chọn!</span>
          </div>
          {candidates.length === 0 && (
            <button
              onClick={handleResetFilters}
              className="text-red-600 underline font-bold"
            >
              Đặt lại tiêu chí khác
            </button>
          )}
        </div>
      </div>

      {/* Mode Switch: Wheel vs Dice */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setMode('wheel')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
            mode === 'wheel'
              ? 'bg-slate-900 text-white shadow-lg'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>🎯 Vòng Quay May Mắn</span>
        </button>

        <button
          onClick={() => setMode('dice')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
            mode === 'dice'
              ? 'bg-slate-900 text-white shadow-lg'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Dices className="w-4 h-4" />
          <span>Hộp Bí Mật & Xúc Xắc</span>
        </button>
      </div>

      {/* Main Interactive Stage */}
      <div className="bg-gradient-to-b from-white to-orange-50/50 rounded-3xl p-6 sm:p-12 border border-orange-100 shadow-xl flex flex-col items-center justify-center min-h-[460px]">
        {candidates.length === 0 ? (
          <div className="text-center py-12 space-y-4 max-w-md">
            <div className="text-5xl">🤔</div>
            <h3 className="font-bold text-slate-800 text-lg">
              Không tìm thấy món ăn phù hợp với toàn bộ tiêu chí này!
            </h3>
            <p className="text-xs text-slate-500">
              Hãy thử nới lỏng ngân sách hoặc chọn khẩu vị &ldquo;Tất cả&rdquo; để có nhiều lựa chọn thơm ngon hơn.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-brand-500 text-white shadow-md hover:bg-brand-600 transition-colors"
            >
              Mở Rộng Bộ Lọc
            </button>
          </div>
        ) : mode === 'wheel' ? (
          <LuckyWheel candidates={candidates} onFinish={handleFoodChosen} />
        ) : (
          <DiceRandomizer candidates={candidates} onFinish={handleFoodChosen} />
        )}
      </div>

      {/* Candidate List Preview */}
      {candidates.length > 0 && (
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xl">
              Các Món Trong Danh Sách Gợi Ý ({candidates.length})
            </h3>
            <span className="text-xs text-slate-400">
              Bấm vào từng món để xem chi tiết
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {candidates.slice(0, 8).map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        </div>
      )}

      {/* Result Celebration Modal */}
      <ResultModal
        food={selectedFood}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSpinAgain={() => {
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
