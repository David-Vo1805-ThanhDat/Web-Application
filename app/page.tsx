'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, 
  ArrowRight, 
  Utensils, 
  Flame, 
  Clock, 
  Star, 
  Compass, 
  HelpCircle,
  ThumbsUp,
  Award,
  Users
} from 'lucide-react';
import FoodCard from '@/components/FoodCard';
import LuckyWheel from '@/components/LuckyWheel';
import ResultModal from '@/components/ResultModal';
import { allFoods, getCurrentMealInfo, getRandomFood } from '@/lib/food-utils';
import { FoodItem } from '@/types/food';

export default function HomePage() {
  const [mealInfo, setMealInfo] = useState<{
    mealType: 'sang' | 'trua' | 'toi' | 'an-vat';
    title: string;
    subtitle: string;
    badge: string;
  }>({
    mealType: 'trua',
    title: 'Bữa Trưa Chắc Bụng',
    subtitle: 'Nạp lại năng lượng sau giờ làm việc và học tập căng thẳng!',
    badge: 'Bữa Trưa 🍚',
  });

  const [selectedMealType, setSelectedMealType] = useState<'sang' | 'trua' | 'toi' | 'an-vat'>('trua');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const current = getCurrentMealInfo();
    setMealInfo(current);
    setSelectedMealType(current.mealType);
  }, []);

  // Filter foods for the current meal tab
  const mealFoods = allFoods.filter((f) => f.mealType.includes(selectedMealType)).slice(0, 4);

  // Popular hot foods
  const popularFoods = allFoods.filter((f) => f.popular).slice(0, 6);

  const handleFoodWon = (food: FoodItem) => {
    setSelectedFood(food);
    setIsModalOpen(true);
  };

  const handleQuickRandom = () => {
    const food = getRandomFood();
    handleFoodWon(food);
  };

  const categories = [
    { id: 'mon-nuoc', name: 'Món Nước Bốc Khói', icon: '🍜', count: '10 món', desc: 'Phở, Bún bò, Hủ tiếu, Canh chua...' },
    { id: 'com', name: 'Cơm Chắc Bụng', icon: '🍚', count: '8 món', desc: 'Cơm tấm, Cơm niêu, Cơm gà xối mỡ...' },
    { id: 'cuon-tron', name: 'Đồ Cuốn Thanh Mát', icon: '🥢', count: '5 món', desc: 'Gỏi cuốn, Bánh xèo, Bún đậu, Nem nướng...' },
    { id: 'an-vat', name: 'Ăn Vặt Phố Thị', icon: '🥪', count: '7 món', desc: 'Bánh mì thịt, Bánh tráng nướng, Xôi mặn...' },
    { id: 'lau-nuong', name: 'Lẩu & Nướng Tụ Tập', icon: '🍲', count: '4 món', desc: 'Lẩu Thái chua cay, Bò né, Vịt quay...' },
    { id: 'chay', name: 'Món Chay & Eat Clean', icon: '🥗', count: '5 món', desc: 'Salad ức gà, Lẩu nấm chay thanh tịnh...' },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 sm:pb-20">
        {/* Background glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100/80 border border-orange-200 text-brand-700 text-xs sm:text-sm font-bold shadow-sm">
                <Sparkles className="w-4 h-4 text-brand-600 animate-spin-slow" />
                <span>Giải cứu chiếc bụng đói chỉ trong 5 giây</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Hôm Nay Bạn <br className="hidden sm:block" />
                <span className="text-gradient-food">Muốn Ăn Gì?</span> 🍜
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Đừng để câu hỏi &ldquo;Trưa nay ăn gì?&rdquo; hay &ldquo;Tối nay đi đâu?&rdquo; làm bạn mất thời gian quý giá. Quay vòng quay may mắn hoặc lọc theo ngân sách, khẩu vị để chốt món ngay!
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                <Link
                  href="/goi-y"
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl font-extrabold text-base text-white bg-gradient-to-r from-brand-600 via-orange-500 to-amber-500 hover:from-brand-700 hover:to-amber-600 shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Quay Ngẫu Nhiên Ngay</span>
                </Link>

                <button
                  onClick={handleQuickRandom}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl font-bold text-base text-slate-700 bg-white border border-slate-200 hover:border-brand-300 hover:text-brand-600 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  <span>🎲 Gợi ý nhanh 1 món</span>
                </button>
              </div>

              {/* Quick Trust Badges */}
              <div className="pt-4 grid grid-cols-3 gap-2 sm:gap-4 max-w-md mx-auto lg:mx-0 border-t border-slate-100">
                <div className="text-center lg:text-left">
                  <span className="block font-black text-xl sm:text-2xl text-brand-600">35+</span>
                  <span className="text-xs text-slate-500">Món ngon đặc sắc</span>
                </div>
                <div className="text-center lg:text-left border-x border-slate-200 px-2">
                  <span className="block font-black text-xl sm:text-2xl text-amber-500">5 Giây</span>
                  <span className="text-xs text-slate-500">Quyết định bữa ăn</span>
                </div>
                <div className="text-center lg:text-left">
                  <span className="block font-black text-xl sm:text-2xl text-emerald-600">100%</span>
                  <span className="text-xs text-slate-500">Hài lòng no nê</span>
                </div>
              </div>
            </div>

            {/* Right Hero Interactive Wheel Preview */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative p-4 sm:p-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-orange-100 shadow-2xl shadow-orange-500/10 w-full max-w-md">
                <div className="text-center mb-4">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-brand-600 bg-orange-50 mb-1">
                    VÒNG QUAY MAY MẮN
                  </span>
                  <h3 className="font-bold text-slate-800 text-lg">
                    Thử vận may bữa hôm nay!
                  </h3>
                </div>

                {/* Embedded Wheel */}
                <LuckyWheel candidates={allFoods.slice(0, 8)} onFinish={handleFoodWon} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Real-time Meal Recommendation Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-200/80 rounded-3xl p-6 sm:p-10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-bold mb-2 shadow-sm">
                <span>{mealInfo.badge}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {mealInfo.title}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {mealInfo.subtitle}
              </p>
            </div>

            {/* Meal Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl shadow-sm border border-orange-100 self-stretch sm:self-auto overflow-x-auto">
              {[
                { id: 'sang', label: 'Bữa Sáng ☀️' },
                { id: 'trua', label: 'Bữa Trưa 🍚' },
                { id: 'toi', label: 'Bữa Tối 🍲' },
                { id: 'an-vat', label: 'Ăn Vặt 🧋' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedMealType(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                    selectedMealType === tab.id
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'text-slate-600 hover:text-brand-600 hover:bg-orange-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Dishes for Selected Meal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {mealFoods.map((food) => (
              <FoodCard key={food.id} food={food} />
            ))}
          </div>
        </div>
      </section>

      {/* 3. Featured Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-orange-100 px-3 py-1 rounded-full">
            Đa Dạng Lựa Chọn
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Danh Mục Món Ăn Nổi Bật
          </h2>
          <p className="text-sm text-slate-600">
            Khám phá hương vị phong phú từ Bắc chí Nam cùng các món ăn quốc tế được yêu thích
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/kham-pha?category=${cat.id}`}
              className="group p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  {cat.icon}
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 group-hover:bg-brand-100 group-hover:text-brand-700 transition-colors">
                  {cat.count}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="font-bold text-slate-800 text-lg group-hover:text-brand-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                  {cat.desc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-600 group-hover:translate-x-1 transition-transform">
                <span>Khám phá danh mục</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Top Trending & Most Loved Dishes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full">
              Thịnh Hành Hôm Nay
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Món Ăn Được Yêu Thích Nhất 🔥
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Top các món ăn nhận được nhiều lượt đánh giá 5 sao từ thực khách
            </p>
          </div>

          <Link
            href="/kham-pha"
            className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1.5"
          >
            <span>Xem toàn bộ 35+ món ăn</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularFoods.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </div>
      </section>

      {/* 5. User Testimonial & Fun Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-2xl">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">
              Ý KIẾN NGƯỜI DÙNG
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 leading-snug">
              &ldquo;Trước đây mỗi trưa mất 30 phút cãi nhau xem ăn gì. Giờ mở web quay 5 giây là xong!&rdquo;
            </h2>
            <p className="text-slate-400 text-sm mt-3">
              Dành cho sinh viên, dân văn phòng và bất kỳ ai cảm thấy đau đầu vì câu hỏi muôn thuở mỗi ngày.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/goi-y"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-amber-500 text-white font-bold text-sm shadow-lg hover:from-brand-600 hover:to-amber-600 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Trải Nghiệm Ngay Bây Giờ</span>
              </Link>
              <Link
                href="/gioi-thieu"
                className="px-6 py-3.5 rounded-2xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 font-semibold text-sm transition-colors"
              >
                Về Nhóm Phát Triển
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Result Modal if triggered */}
      <ResultModal
        food={selectedFood}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSpinAgain={handleQuickRandom}
      />
    </div>
  );
}
