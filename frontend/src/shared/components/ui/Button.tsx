import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  isLoading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-600 hover:bg-gray-100',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}
