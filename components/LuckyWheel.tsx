'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { FoodItem } from '@/types/food';

interface LuckyWheelProps {
  candidates: FoodItem[];
  onFinish: (selected: FoodItem) => void;
}

const WHEEL_COLORS = [
  '#FF6B35', // Orange
  '#F7C59F', // Light Peach
  '#EFEFD0', // Soft Vanilla
  '#00A896', // Emerald Teal
  '#028090', // Ocean Blue
  '#F45B69', // Coral Pink
  '#E07A5F', // Terra Cotta
  '#3D405B', // Slate Navy
  '#81B29A', // Sage Green
  '#F2CC8F', // Golden Sand
  '#E63946', // Chili Red
  '#457B9D', // Cool Blue
];

export default function LuckyWheel({ candidates, onFinish }: LuckyWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [items, setItems] = useState<FoodItem[]>([]);

  // We select up to 8-10 candidates for the wheel to keep slices readable
  useEffect(() => {
    if (!candidates || candidates.length === 0) return;
    // Pick up to 8 items (or cycle if less than 6)
    let selected: FoodItem[] = [];
    if (candidates.length <= 8) {
      selected = [...candidates];
      // If fewer than 4, duplicate to make a nice wheel
      while (selected.length < 6 && selected.length > 0) {
        selected = [...selected, ...candidates].slice(0, 8);
      }
    } else {
      // Pick random 8 items from candidates
      const shuffled = [...candidates].sort(() => 0.5 - Math.random());
      selected = shuffled.slice(0, 8);
    }
    setItems(selected);
  }, [candidates]);

  // Draw wheel on canvas
  const drawWheel = (rotationAngle: number = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 16;
    const numSlices = items.length;
    if (numSlices === 0) return;

    const sliceAngle = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, width, height);

    // Save context for rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);

    // Draw slices
    for (let i = 0; i < numSlices; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      // Fill color
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();

      // Border line
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 4;
      ctx.font = 'bold 13px system-ui, sans-serif';

      const text = items[i].name;
      // Truncate if too long
      const displayText = text.length > 15 ? text.substring(0, 14) + '...' : text;
      ctx.fillText(displayText, radius - 24, 0);
      ctx.restore();
    }

    // Outer ring border
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ea580c';
    ctx.stroke();

    ctx.restore();

    // Center Hub Button
    ctx.beginPath();
    ctx.arc(centerX, centerY, 34, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ea580c';
    ctx.stroke();

    // Center Hub Text or Icon
    ctx.fillStyle = '#ea580c';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('QUAY', centerX, centerY);
  };

  useEffect(() => {
    drawWheel(0);
  }, [items]);

  const spinWheel = () => {
    if (isSpinning || items.length === 0) return;

    setIsSpinning(true);

    // Random target index
    const targetIndex = Math.floor(Math.random() * items.length);
    const winningItem = items[targetIndex];

    const sliceAngle = (2 * Math.PI) / items.length;
    // Top pointer is at angle 3*PI/2 (270 degrees in canvas coords, or -PI/2)
    // When wheel rotates by totalRotation, slice i is at (i * sliceAngle + sliceAngle/2 + totalRotation) % 2PI
    // Pointer is at 3*PI/2 (top: x = centerX, y = centerY - radius)
    // We want: (targetIndex * sliceAngle + sliceAngle/2 + totalRotation) % 2PI = 3*PI/2
    // totalRotation = 3*PI/2 - (targetIndex * sliceAngle + sliceAngle/2) + extra full spins

    const baseSpins = 6 * 2 * Math.PI; // 6 full rotations
    // Random offset inside slice to make it natural
    const sliceOffset = (Math.random() * 0.6 + 0.2) * sliceAngle;
    const targetAngle =
      baseSpins + (3 * Math.PI) / 2 - (targetIndex * sliceAngle + sliceOffset);

    const startTime = performance.now();
    const duration = 4000; // 4 seconds animation

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: 1 - pow(1 - progress, 3)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = targetAngle * easeOut;

      drawWheel(currentRotation);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        onFinish(winningItem);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Pointer at the top */}
      <div className="relative flex flex-col items-center">
        {/* Top Triangle Needle Pointer */}
        <div className="z-20 -mb-4 drop-shadow-md">
          <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-red-600 animate-bounce-slow" />
        </div>

        {/* Wheel Canvas */}
        <div className="relative rounded-full p-2 bg-gradient-to-tr from-amber-400 via-brand-500 to-red-500 shadow-2xl shadow-brand-500/30">
          <canvas
            ref={canvasRef}
            width={380}
            height={380}
            className="rounded-full bg-white max-w-[320px] max-h-[320px] sm:max-w-[380px] sm:max-h-[380px] cursor-pointer"
            onClick={spinWheel}
          />
        </div>
      </div>

      {/* Action CTA Button */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          onClick={spinWheel}
          disabled={isSpinning || items.length === 0}
          className={`px-8 py-4 rounded-2xl font-extrabold text-base sm:text-lg text-white shadow-xl transition-all flex items-center gap-3 ${
            isSpinning
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-brand-600 via-orange-500 to-amber-500 hover:from-brand-700 hover:to-amber-600 hover:shadow-brand-500/40 hover:scale-105 active:scale-95'
          }`}
        >
          {isSpinning ? (
            <>
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>Đang quay món cho bạn...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6 animate-pulse" />
              <span>BẤM ĐỂ QUAY NGAY 🎯</span>
            </>
          )}
        </button>
        <p className="text-xs text-slate-400 font-medium text-center">
          Vòng quay gồm {items.length} món phù hợp với tiêu chí bạn đã chọn
        </p>
      </div>
    </div>
  );
}
