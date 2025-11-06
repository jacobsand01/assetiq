// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AssetIQ',
  description:
    'Keep assets out of spreadsheet hell. Lightweight asset tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-50`}>
        {children}

        {/* Global feedback widget (👍 / 👎 + comment modal) */}
        <FeedbackWidget />

        {/* Global analytics (Vercel Analytics) */}
        <Analytics />
      </body>
    </html>
  );
}
