import React from 'react';
import Link from 'next/link';
import { UtensilsCrossed, Heart, Github, Coffee, ShieldCheck, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-14 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand & Slogan */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-amber-500 flex items-center justify-center text-white text-xl shadow-lg">
                🍜
              </div>
              <span className="font-extrabold text-xl text-white tracking-tight">
                Hôm Nay Ăn Gì?
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Trang web gợi ý món ăn ngẫu nhiên theo bữa ăn, ngân sách, khẩu vị và chế độ ăn. Chấm dứt chuỗi ngày đau đầu vì câu hỏi &ldquo;Trưa nay ăn gì?&rdquo; chỉ trong 5 giây!
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 rounded-lg w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Đồ án môn học Web Application (Demo 2026)</span>
            </div>
          </div>

          {/* Col 2: Fast Navigation */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Khám Phá Nhanh
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-brand-400 transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link href="/goi-y" className="hover:text-brand-400 transition-colors flex items-center gap-2">
                  <span>Vòng quay món ăn</span>
                  <span className="px-1.5 py-0.2 text-[10px] bg-red-600 text-white rounded-full">HOT</span>
                </Link>
              </li>
              <li>
                <Link href="/kham-pha" className="hover:text-brand-400 transition-colors">
                  Thực đơn 35+ món ngon
                </Link>
              </li>
              <li>
                <Link href="/kham-pha?tab=favorites" className="hover:text-brand-400 transition-colors">
                  Món đã lưu yêu thích
                </Link>
              </li>
              <li>
                <Link href="/gioi-thieu" className="hover:text-brand-400 transition-colors">
                  Về nhóm phát triển & Góp ý
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Team Members (Theo README) */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Thành Viên Nhóm
            </h4>
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <div className="font-semibold text-white flex items-center justify-between">
                  <span>Người A</span>
                  <span className="text-[11px] text-amber-400 bg-amber-950/70 px-2 py-0.5 rounded">Frontend</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  UI/UX Design, Framer Motion, Responsive Layouts
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60">
                <div className="font-semibold text-white flex items-center justify-between">
                  <span>Người B</span>
                  <span className="text-[11px] text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded">Logic & Data</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Data Schema, Filter / Search / Randomizer Logic
                </p>
              </div>
            </div>
          </div>

          {/* Col 4: Food Philosophy */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">
              Phương Châm Ẩm Thực
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              &ldquo;Ăn ngon không chỉ để no, mà còn để nuôi dưỡng niềm vui và tinh thần làm việc mỗi ngày.&rdquo;
            </p>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Dữ liệu món ăn Việt Nam & quốc tế phong phú</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Gợi ý địa điểm & quán ăn thực tế có đánh giá</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>Công thức & checklist nguyên liệu đi chợ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Hôm Nay Ăn Gì? Nhóm Đồ Án Cuối Kỳ. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Phát triển với <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> và <Coffee className="w-3.5 h-3.5 text-amber-500" />
            </span>
            <span>•</span>
            <span>Next.js + Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
