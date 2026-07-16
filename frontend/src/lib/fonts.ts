import { Inter } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const PERSIAN_FONT_STACK = "'Vazirmatn', Tahoma, 'Segoe UI', sans-serif";

export const ENGLISH_FONT_STACK =
  'var(--font-inter), ui-sans-serif, system-ui, sans-serif';

export const VAZIRMATN_PRELOAD_WEIGHTS = ['Regular', 'Medium', 'Bold'] as const;
