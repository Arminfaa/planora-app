'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface IconActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  tone?: 'default' | 'danger' | 'primary' | 'success';
}

const toneClassName: Record<
  NonNullable<IconActionButtonProps['tone']>,
  string
> = {
  default: 'text-gray-400 hover:bg-gray-100 hover:text-gray-700',
  danger: 'text-gray-400 hover:bg-red-50 hover:text-red-600',
  primary: 'text-gray-400 hover:bg-primary-50 hover:text-primary-700',
  success: 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-600',
};

export function IconActionButton({
  label,
  children,
  tone = 'default',
  className,
  type = 'button',
  ...rest
}: IconActionButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40',
        toneClassName[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
