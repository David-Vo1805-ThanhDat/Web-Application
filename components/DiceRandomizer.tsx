'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Sparkles, Dices, Shuffle, Check } from 'lucide-react';
import { FoodItem } from '@/types/food';

interface DiceRandomizerProps {
  candidates: FoodItem[];
  onFinish: (selected: FoodItem) => void;
}

export default function DiceRandomizer({ candidates, onFinish }: DiceRandomizerProps) {
  const [isShuffling, setIsShuffling] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [revealedFood, setRevealedFood] = useState<FoodItem | null>(null);

  const rollMysteryCard = () => {
    if (isShuffling || !candidates || candidates.length === 0) return;

    setIsShuffling(true);
    setRevealedFood(null);
    setActiveCardIndex(null);

    // Pick random winning card (0, 1, or 2)
    const targetCard = Math.floor(Math.random() * 3);
    const chosenFood = candidates[Math.floor(Math.random() * candidates.length)];

    let count = 0;
    const interval = setInterval(() => {
      setActiveCardIndex(count % 3);
      count++;
    }, 120);

    setTimeout(() => {
      clearInterval(interval);
      setActiveCardIndex(targetCard);
      setRevealedFood(chosenFood);
      setIsShuffling(false);
      onFinish(chosenFood);
    }, 2400);
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-xl mx-auto py-4">
      {/* 3 Mystery Cards Container */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full mb-8">
        {[0, 1, 2].map((idx) => {
          const isSelected = activeCardIndex === idx;
          const isWinner = isSelected && revealedFood;

          return (
            <div
              key={idx}
              onClick={rollMysteryCard}
              className={`relative aspect-[3/4] rounded-2xl cursor-pointer p-1 transition-all duration-500 transform ${
                isSelected
                  ? 'scale-105 shadow-2xl -translate-y-2'
                  : 'hover:-translate-y-1 hover:shadow-lg'
              }`}
            >
              {/* Card Outer Border */}
              <div
                className={`w-full h-full rounded-2xl flex flex-col items-center justify-center p-3 text-center transition-all ${
                  isWinner
                    ? 'bg-gradient-to-tr from-brand-600 to-amber-500 text-white shadow-brand-500/50'
                    : isSelected
                    ? 'bg-gradient-to-tr from-brand-400 to-amber-400 text-white ring-4 ring-brand-300'
                    : 'bg-gradient-to-b from-white to-orange-50/60 border-2 border-dashed border-orange-200 text-slate-700'
                }`}
              >
                {isWinner && revealedFood ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 animate-in fade-in zoom-in">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow-md">
                      <Image
                        src={revealedFood.image}
                        alt={revealedFood.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="font-bold text-xs sm:text-sm line-clamp-2">
                      {revealedFood.name}
                    </span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-medium">
                      Chân ái 🎉
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 text-brand-600'
                    }`}>
                      <span className="text-2xl sm:text-3xl font-extrabold">?</span>
                    </div>
                    <span className="text-[11px] sm:text-xs font-semibold">
                      Hộp bí ẩn #{idx + 1}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Button */}
      <button
        onClick={rollMysteryCard}
        disabled={isShuffling}
        className={`px-8 py-4 rounded-2xl font-extrabold text-base sm:text-lg text-white shadow-xl transition-all flex items-center gap-3 ${
          isShuffling
            ? 'bg-slate-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-brand-600 via-orange-500 to-amber-500 hover:from-brand-700 hover:to-amber-600 hover:shadow-brand-500/40 hover:scale-105 active:scale-95'
        }`}
      >
        {isShuffling ? (
          <>
            <Shuffle className="w-5 h-5 animate-spin" />
            <span>Đang xáo hộp bí mật...</span>
          </>
        ) : (
          <>
            <Dices className="w-6 h-6 animate-bounce-slow" />
            <span>LẮC XÚC XẮC CHỌN MÓN 🎲</span>
          </>
        )}
      </button>
      <p className="text-xs text-slate-400 font-medium text-center mt-3">
        Nhấn vào nút hoặc chọn 1 trong 3 hộp bí ẩn để mở món ăn hôm nay
      </p>
    </div>
  );
}
