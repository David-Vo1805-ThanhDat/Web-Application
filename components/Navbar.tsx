'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UtensilsCrossed, Sparkles, Compass, Heart, Info, Menu, X } from 'lucide-react';
import { getFavoritesFromStorage } from '@/lib/food-utils';

export default function Navbar() {
  const pathname = usePathname();
  const [favoriteCount, setFavoriteCount] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const updateFavoriteCount = () => {
    const list = getFavoritesFromStorage();
    setFavoriteCount(list.length);
  };

  useEffect(() => {
    updateFavoriteCount();
    window.addEventListener('favorites-updated', updateFavoriteCount);
    window.addEventListener('storage', updateFavoriteCount);
    return () => {
      window.removeEventListener('favorites-updated', updateFavoriteCount);
      window.removeEventListener('storage', updateFavoriteCount);
    };
  }, []);

  const navLinks = [
    { href: '/', label: 'Trang Chủ', icon: UtensilsCrossed },
    { href: '/goi-y', label: 'Gợi Ý Ngay', icon: Sparkles, badge: 'HOT' },
    { href: '/kham-pha', label: 'Khám Phá', icon: Compass },
    { href: '/gioi-thieu', label: 'Giới Thiệu', icon: Info },
  ];

  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-effect shadow-sm border-b border-orange-100/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <span className="text-xl sm:text-2xl">🍜</span>
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-800 group-hover:text-brand-600 transition-colors flex items-center gap-1.5">
                Hôm Nay Ăn Gì?
                <span className="inline-block w-2 h-2 rounded-full bg-brand-500 animate-ping" />
              </span>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Giải cứu cơn đói chỉ trong vài giây
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'text-brand-600 bg-brand-50/80 shadow-sm'
                      : 'text-slate-600 hover:text-brand-600 hover:bg-orange-50/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
                  {link.label}
                  {link.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-gradient-to-r from-red-500 to-brand-500 rounded-full animate-pulse">
                      {link.badge}
                    </span>
                  )}
                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-brand-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Favorites Button */}
            <Link
              href="/kham-pha?tab=favorites"
              className="relative p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-red-500 hover:border-red-200 hover:bg-red-50/40 transition-all flex items-center gap-1.5 text-sm font-medium"
              title="Món ăn đã lưu"
            >
              <Heart className={`w-4 h-4 ${favoriteCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="hidden lg:inline text-xs">Yêu thích</span>
              {favoriteCount > 0 && (
                <span className="bg-red-500 text-white text-[11px] font-bold px-1.5 py-0.2 rounded-full">
                  {favoriteCount}
                </span>
              )}
            </Link>

            {/* Quick Random CTA Button */}
            <Link
              href="/goi-y"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 shadow-md shadow-brand-500/25 hover:shadow-lg hover:shadow-brand-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              <span>Gợi Ý Ngay</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/kham-pha?tab=favorites"
              className="relative p-2 text-slate-600 hover:text-red-500"
            >
              <Heart className={`w-5 h-5 ${favoriteCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
              {favoriteCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {favoriteCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-orange-100 bg-white/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                  active
                    ? 'text-brand-600 bg-brand-50'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-2">
            <Link
              href="/goi-y"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-brand-500 to-amber-500 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Gợi Ý Món Ăn Ngay 🎲</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
