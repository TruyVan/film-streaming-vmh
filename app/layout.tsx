import React from 'react';
import type { Metadata } from 'next';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'PartyStream — Private VoD Platform',
  description:
    'Dành riêng cho PotterHead Vũ Minh Hoà',
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
