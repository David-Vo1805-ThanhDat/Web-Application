'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Clock, Flame, Star, MapPin } from 'lucide-react';
import { FoodItem } from '@/types/food';
import { formatPrice, getFavoritesFromStorage, toggleFavoriteInStorage } from '@/lib/food-utils';

interface FoodCardProps {
  food: FoodItem;
  onFavoriteToggle?: (isFav: boolean) => void;
}

export default function FoodCard({ food, onFavoriteToggle }: FoodCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imgSrc, setImgSrc] = useState(food.image);

  useEffect(() => {
    const list = getFavoritesFromStorage();
    setIsFavorite(list.includes(food.id));

    const handleUpdate = () => {
      const updatedList = getFavoritesFromStorage();
      setIsFavorite(updatedList.includes(food.id));
    };

    window.addEventListener('favorites-updated', handleUpdate);
    return () => window.removeEventListener('favorites-updated', handleUpdate);
  }, [food.id]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = toggleFavoriteInStorage(food.id);
    setIsFavorite(newStatus);
    if (onFavoriteToggle) {
      onFavoriteToggle(newStatus);
    }
  };

  const getRegionBadgeColor = (region: string) => {
    switch (region) {
      case 'Bắc':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Trung':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Nam':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
      {/* Top Image Container */}
      <Link href={`/mon-an/${food.id}`} className="relative aspect-[4/3] w-full overflow-hidden block bg-slate-100">
        <Image
          src={imgSrc}
          alt={food.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => {
            // Fallback image if unsplash link fails
            setImgSrc('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80');
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Region & Price Tags on Image */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${getRegionBadgeColor(food.region)}`}>
            {food.region}
          </span>
          {food.popular && (
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-500 text-white shadow-sm flex items-center gap-1">
              🔥 Hot
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
            isFavorite
              ? 'bg-red-500 text-white shadow-md scale-110'
              : 'bg-white/80 text-slate-700 hover:text-red-500 hover:bg-white'
          }`}
          title={isFavorite ? 'Bỏ lưu yêu thích' : 'Lưu vào yêu thích'}
          aria-label="Lưu yêu thích"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
        </button>

        {/* Bottom Image Info: Price & Rating */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
          <span className="font-extrabold text-base sm:text-lg drop-shadow-md text-amber-300">
            {formatPrice(food.price)}
          </span>
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-lg text-xs font-semibold">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{food.rating}</span>
            <span className="text-white/60">({food.reviewCount})</span>
          </div>
        </div>
      </Link>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Dish Names */}
          <Link href={`/mon-an/${food.id}`} className="block group-hover:text-brand-600 transition-colors">
            <h3 className="font-bold text-slate-800 text-base sm:text-lg line-clamp-1">
              {food.name}
            </h3>
            <p className="text-xs text-slate-400 italic line-clamp-1 mb-2">
              {food.englishName}
            </p>
          </Link>

          {/* Short Description */}
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {food.description}
          </p>
        </div>

        {/* Bottom Meta & Tags */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{food.cookTimeMinutes} phút</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>{food.calories} kcal</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
              <span>{food.priceRange}</span>
            </div>
          </div>

          {/* Action Link */}
          <Link
            href={`/mon-an/${food.id}`}
            className="w-full text-center py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold text-brand-600 bg-orange-50 hover:bg-brand-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
          >
            <span>Xem Chi Tiết & Nơi Bán</span>
            <span className="text-xs">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
