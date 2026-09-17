'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Code2,
  Database,
  TestTube,
  Paintbrush,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Send,
  Utensils,
  Trophy,
  Heart,
  MessageCircle,
} from 'lucide-react';
import Toast, { ToastMessage } from '@/components/Toast';
import { allFoods } from '@/lib/food-utils';

const faqs = [
  {
    q: 'Dữ liệu món ăn trong website có chính xác không?',
    a: 'Dữ liệu 35+ món ăn trong website được nhóm nghiên cứu và tổng hợp từ nhiều nguồn ẩm thực uy tín tại Việt Nam. Thông tin giá ước tính có thể thay đổi theo từng quán và thời điểm. Giai đoạn demo dùng dữ liệu mock tĩnh, phiên bản sau sẽ kết nối API thực tế.',
  },
  {
    q: 'Vòng quay may mắn hoạt động như thế nào?',
    a: 'Vòng quay sử dụng thuật toán ngẫu nhiên có trọng số dựa trên bộ lọc tiêu chí bạn chọn (bữa ăn, ngân sách, khẩu vị, chế độ ăn). Chỉ những món đáp ứng đủ tiêu chí mới xuất hiện trên vòng quay — đảm bảo kết quả luôn phù hợp với mong muốn của bạn.',
  },
  {
    q: 'Tôi có thể lưu món ăn yêu thích ở đâu?',
    a: 'Nhấn biểu tượng ❤️ trên bất kỳ thẻ món ăn nào để lưu vào danh sách yêu thích. Dữ liệu được lưu cục bộ trong trình duyệt (localStorage) — không cần đăng nhập và hoạt động offline. Xem lại danh sách yêu thích tại trang Khám Phá > Tab "Đã Lưu Yêu Thích".',
  },
  {
    q: 'Website có hỗ trợ tìm kiếm theo nguyên liệu không?',
    a: 'Có! Thanh tìm kiếm trên trang Khám Phá cho phép bạn tìm kiếm theo tên món ăn, tên nguyên liệu (ví dụ: "bò", "tôm", "đậu hũ"), khẩu vị hay mô tả món ăn. Kết quả được cập nhật real-time khi bạn gõ chữ.',
  },
  {
    q: 'Kế hoạch phát triển tiếp theo của dự án là gì?',
    a: 'Sau giai đoạn demo 5 trang, nhóm sẽ tiếp tục: (1) Tích hợp backend API thực tế, (2) Thêm tính năng đề xuất cá nhân hóa dựa trên lịch sử chọn món, (3) Tính năng lên thực đơn tuần, (4) Tích hợp bản đồ tìm quán ăn gần vị trí hiện tại, (5) Ứng dụng mobile (React Native).',
  },
];

export default function GioiThieuPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    dishName: '',
    description: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dishName || !formData.description) {
      setToast({ id: Date.now().toString(), type: 'error', message: 'Vui lòng điền đầy đủ tên món ăn và mô tả!' });
      return;
    }
    setIsSubmitting(true);
    // Simulate async submit
    await new Promise((r) => setTimeout(r, 1200));
    setIsSubmitting(false);
    setFormData({ name: '', dishName: '', description: '', email: '' });
    setToast({ id: Date.now().toString(), type: 'success', message: '🎉 Cảm ơn bạn đã đóng góp món ăn! Nhóm sẽ xem xét và thêm vào thực đơn sớm nhất.' });
  };

  const stats = [
    { label: 'Món ăn đặc sắc', value: `${allFoods.length}+`, icon: '🍜', color: 'from-brand-500 to-amber-500' },
    { label: 'Vùng ẩm thực', value: '4', icon: '🗺️', color: 'from-blue-500 to-cyan-500' },
    { label: 'Giây quyết định', value: '5s', icon: '⚡', color: 'from-emerald-500 to-teal-500' },
    { label: 'Hài lòng no nê', value: '100%', icon: '😋', color: 'from-rose-500 to-pink-500' },
  ];

  const teamMembers = [
    {
      name: 'Người A',
      role: 'Frontend Developer & UI/UX Designer',
      emoji: '🎨',
      color: 'from-violet-500 to-purple-600',
      tasks: [
        { icon: Paintbrush, text: 'Thiết kế giao diện (UI/UX)' },
        { icon: Layers, text: 'Responsive Layout cho mọi thiết bị' },
        { icon: Sparkles, text: 'Framer Motion Animations' },
        { icon: Code2, text: 'Xây dựng 5 trang demo Next.js' },
      ],
      quote: '"Giao diện đẹp không chỉ để nhìn — mà để người dùng cảm thấy vui khi dùng mỗi ngày."',
    },
    {
      name: 'Người B',
      role: 'Logic Developer, Data & QA',
      emoji: '⚙️',
      color: 'from-brand-500 to-orange-600',
      tasks: [
        { icon: Database, text: 'Xây dựng foods.json 35+ món ăn' },
        { icon: Code2, text: 'Logic Filter / Search / Random' },
        { icon: TestTube, text: 'Testing & QA các tính năng' },
        { icon: Layers, text: 'Deploy & Git Workflow' },
      ],
      quote: '"Dữ liệu tốt là nền tảng của mọi sản phẩm thông minh — rác vào thì rác ra!"',
    },
  ];

  return (
    <div className="pb-20 space-y-20">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-slate-900 to-slate-800 text-white py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs sm:text-sm font-bold backdrop-blur-sm">
            <Users className="w-4 h-4" />
            <span>Đồ Án Cuối Kỳ — Web Application 2026</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
            Về Dự Án <span className="bg-gradient-to-r from-amber-400 to-brand-400 bg-clip-text text-transparent">Hôm Nay Ăn Gì?</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Ý tưởng xuất phát từ nỗi đau thực tế của sinh viên và dân văn phòng — mỗi ngày mất 15-30 phút chỉ để thống nhất &ldquo;hôm nay ăn gì&rdquo;. Chúng mình xây dựng công cụ giải quyết đúng vấn đề đó!
          </p>
        </div>
      </section>

      {/* Project Stats */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-3 shadow-md`}>
                {stat.icon}
              </div>
              <div className={`text-2xl sm:text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Team Members Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-orange-100 px-3 py-1 rounded-full">
            Nhóm Phát Triển
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Những Người Đứng Sau Dự Án 👥
          </h2>
          <p className="text-sm text-slate-600">
            Mỗi người một vai trò, cùng nhau xây dựng sản phẩm hoàn chỉnh trong thời hạn 3 ngày demo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {teamMembers.map((member, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all"
            >
              {/* Card Header */}
              <div className={`bg-gradient-to-r ${member.color} p-6 text-white`}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl shadow-lg border border-white/30">
                    {member.emoji}
                  </div>
                  <div>
                    <h3 className="text-xl font-black">{member.name}</h3>
                    <p className="text-xs text-white/80 font-medium leading-tight mt-0.5">{member.role}</p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                <ul className="space-y-2">
                  {member.tasks.map((task, j) => {
                    const Icon = task.icon;
                    return (
                      <li key={j} className="flex items-center gap-3 text-sm text-slate-700">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <span className="font-medium">{task.text}</span>
                      </li>
                    );
                  })}
                </ul>

                <blockquote className="border-l-4 border-brand-400 pl-4 py-1 italic text-xs sm:text-sm text-slate-600 bg-orange-50/50 rounded-r-xl">
                  {member.quote}
                </blockquote>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white">
          <h2 className="text-xl sm:text-2xl font-extrabold mb-6 text-center text-amber-300">
            🛠️ Công Nghệ Được Sử Dụng
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { name: 'Next.js 14', desc: 'App Router Framework', icon: '▲', color: 'bg-slate-800' },
              { name: 'React 18', desc: 'UI Component Library', icon: '⚛️', color: 'bg-blue-900/70' },
              { name: 'TypeScript', desc: 'Type Safety', icon: '🔷', color: 'bg-blue-800/70' },
              { name: 'Tailwind CSS', desc: 'Utility-First Styling', icon: '🎨', color: 'bg-cyan-900/70' },
              { name: 'Framer Motion', desc: 'Smooth Animations', icon: '🎬', color: 'bg-pink-900/70' },
              { name: 'Canvas API', desc: 'Lucky Wheel Draw', icon: '🎡', color: 'bg-violet-900/70' },
              { name: 'canvas-confetti', desc: 'Celebration Effects', icon: '🎉', color: 'bg-red-900/60' },
              { name: 'Lucide Icons', desc: 'Beautiful Icon Set', icon: '✨', color: 'bg-amber-900/60' },
            ].map((tech, i) => (
              <div key={i} className={`${tech.color} rounded-2xl p-4 border border-white/10`}>
                <div className="text-2xl mb-2">{tech.icon}</div>
                <div className="font-bold text-sm">{tech.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{tech.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contribute Form */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Đóng Góp Món Ăn Mới 🍽️
          </h2>
          <p className="text-sm text-slate-600">
            Bạn có một món ăn đặc biệt muốn chia sẻ? Điền form bên dưới và nhóm sẽ xem xét bổ sung vào thực đơn!
          </p>
        </div>

        <form
          onSubmit={handleFormSubmit}
          className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Tên của bạn
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Email liên hệ
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Tên Món Ăn <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.dishName}
              onChange={(e) => setFormData({ ...formData, dishName: e.target.value })}
              placeholder="Ví dụ: Cháo lòng Hà Nội, Bánh căn Phan Rang..."
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Mô Tả Ngắn Về Món Ăn <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả hương vị, đặc điểm nổi bật, vùng miền, và tại sao bạn thích món ăn này..."
              required
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 rounded-xl font-bold text-base text-white shadow-md transition-all flex items-center justify-center gap-2 ${
              isSubmitting
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Đang gửi...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Gửi Đề Xuất Món Ăn</span>
              </>
            )}
          </button>
        </form>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Câu Hỏi Thường Gặp ❓
          </h2>
          <p className="text-sm text-slate-600">
            Giải đáp những thắc mắc phổ biến nhất về website và dự án.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-semibold text-slate-800 text-sm sm:text-base">{faq.q}</span>
                {openFaq === i ? (
                  <ChevronUp className="w-4 h-4 text-brand-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 animate-in slide-in-from-top-2">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
