'use client';

import { cn } from '@/lib/utils';

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
    </svg>
  );
}

interface ColumnFilterButtonProps {
  boardVariant?: 'glass' | 'default';
  isActive?: boolean;
  ariaLabel: string;
  onClick: () => void;
}

export function ColumnFilterButton({
  boardVariant = 'glass',
  isActive = false,
  ariaLabel,
  onClick,
}: ColumnFilterButtonProps) {
  const isGlass = boardVariant === 'glass';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={cn(
        'relative flex aspect-square h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-dashed bg-transparent p-0 shadow-none transition',
        isGlass
          ? cn(
              'border-white/25 text-white/85 hover:border-white/45 hover:text-white',
              isActive && 'border-white/55 bg-white/10 text-white',
            )
          : cn(
              'border-gray-300 text-gray-500 hover:border-primary-400 hover:text-primary-500',
              isActive && 'border-primary-400 bg-primary-50/60 text-primary-600',
            ),
      )}
    >
      <FilterIcon className="h-4 w-4" />
      {isActive ? (
        <span
          className={cn(
            'absolute end-1 top-1 h-1.5 w-1.5 rounded-full',
            isGlass ? 'bg-white' : 'bg-primary-500',
          )}
        />
      ) : null}
    </button>
  );
}
