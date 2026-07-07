'use client';

import { useLocale } from '@/i18n/LocaleProvider';
import { cn } from '@/lib/utils';

interface BackChevronIconProps {
  className?: string;
}

export function BackChevronIcon({ className }: BackChevronIconProps) {
  const { isRtl } = useLocale();

  return (
    <svg
      className={cn('h-4 w-4', isRtl && 'rotate-180', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );
}
