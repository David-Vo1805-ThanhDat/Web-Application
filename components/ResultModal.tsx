'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { X, Sparkles, Heart, ArrowRight, RotateCcw, Clock, Flame, MapPin } from 'lucide-react';
import { FoodItem } from '@/types/food';
import { formatPrice, getFavoritesFromStorage, toggleFavoriteInStorage } from '@/lib/food-utils';

interface ResultModalProps {
  food: FoodItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSpinAgain: () => void;
}

export default function ResultModal({ food, isOpen, onClose, onSpinAgain }: ResultModalProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (isOpen && food) {
      // Trigger festive confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#f59e0b', '#ef4444', '#10b981', '#6366f1'],
      });

      const list = getFavoritesFromStorage();
      setIsFavorite(list.includes(food.id));
    }
  }, [isOpen, food]);

  if (!isOpen || !food) return null;

  const handleFavoriteToggle = () => {
    const updated = toggleFavoriteInStorage(food.id);
    setIsFavorite(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-orange-100 animate-in zoom-in-95 duration-300">
        {/* Top Header Banner */}
        <div className="relative h-48 sm:h-56 w-full bg-slate-900">
          <Image
            src={food.image}
            alt={food.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Confetti Celebration Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/90 backdrop-blur-md text-white text-xs font-bold shadow-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Món Ăn Dành Riêng Cho Bạn!</span>
          </div>

          {/* Food Title Overlay */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <span className="text-xs text-amber-400 font-semibold tracking-wide uppercase">
              {food.region} • {food.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold drop-shadow">
              {food.name}
            </h2>
            <p className="text-xs text-slate-300 italic">
              {food.englishName}
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 bg-orange-50/60 p-3 rounded-2xl border border-orange-100 text-center">
            <div className="flex flex-col items-center justify-center">
              <span className="text-[11px] text-slate-400 font-medium">Giá ước tính</span>
              <span className="font-extrabold text-sm sm:text-base text-brand-600">
                {formatPrice(food.price)}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center border-x border-orange-200/60">
              <span className="text-[11px] text-slate-400 font-medium">Thời gian</span>
              <span className="font-bold text-sm sm:text-base text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {food.cookTimeMinutes} phút
              </span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-[11px] text-slate-400 font-medium">Lượng calo</span>
              <span className="font-bold text-sm sm:text-base text-orange-600 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                {food.calories} kcal
              </span>
            </div>
          </div>

          {/* Description & Taste */}
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
            {food.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {food.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 space-y-2.5">
            <Link
              href={`/mon-an/${food.id}`}
              onClick={onClose}
              className="w-full py-3.5 px-4 rounded-xl text-white font-bold bg-gradient-to-r from-brand-600 to-amber-500 hover:from-brand-700 hover:to-amber-600 shadow-md shadow-brand-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>Chốt Món Này! Xem Chi Tiết & Nơi Bán</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleFavoriteToggle}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-all ${
                  isFavorite
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{isFavorite ? 'Đã Lưu Món' : 'Lưu Yêu Thích'}</span>
              </button>

              <button
                onClick={onSpinAgain}
                className="py-2.5 px-3 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Đổi Món Khác</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
