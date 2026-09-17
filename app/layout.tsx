import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'Hôm Nay Bạn Muốn Ăn Gì? 🍜 | Gợi Ý Món Ăn Ngẫu Nhiên Thông Minh',
  description: 'Website gợi ý món ăn ngẫu nhiên theo bữa ăn, ngân sách, khẩu vị và chế độ ăn. Giải quyết câu hỏi "hôm nay ăn gì" chỉ trong vài giây với vòng quay may mắn và kho 35+ món ăn đặc sắc!',
  keywords: ['hôm nay ăn gì', 'gợi ý món ăn', 'vòng quay món ăn', 'ẩm thực việt nam', 'món ngon mỗi ngày'],
  openGraph: {
    title: 'Hôm Nay Bạn Muốn Ăn Gì? 🍜',
    description: 'Chấm dứt việc đau đầu mỗi bữa ăn! Vòng quay may mắn gợi ý món ăn thông minh theo tiêu chí của bạn.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={plusJakartaSans.variable}>
      <body className="flex flex-col min-h-screen bg-[#FCFBFA] text-slate-800 antialiased selection:bg-brand-500 selection:text-white">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
