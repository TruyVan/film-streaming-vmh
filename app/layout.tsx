import React from 'react';
import type { Metadata } from 'next';
import '../src/index.css';

/**
 * CẤU HÌNH CHỐNG GOOGLE INDEXING (ANTI-SEO LỚP 1):
 * Ngăn chặn triệt để Googlebot và mọi Web Crawler lập chỉ mục trang nội bộ.
 */
export const metadata: Metadata = {
  title: 'PartyStream — Private VoD Platform',
  description:
    'Nền tảng phát video trực tuyến nội bộ dành riêng cho các hoạt động sự kiện, teambuilding, gala dinner và karaoke.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    nosnippet: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-[#0f0f0f] text-zinc-100 antialiased selection:bg-rose-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
