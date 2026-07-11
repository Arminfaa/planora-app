'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TaskListActionButtonProps {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function TaskListActionButton({
  label,
  onClick,
  children,
  className,
}: TaskListActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700',
        className,
      )}
    >
      {children}
    </button>
  );
}
