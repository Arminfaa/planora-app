'use client';

import { Input } from 'antd';
import type { InputProps } from 'antd';
import { cn } from '@/lib/utils';

function ColumnSearchIcon({ className }: { className?: string }) {
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
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

interface ColumnSearchInputProps extends Omit<InputProps, 'prefix' | 'variant'> {
  boardVariant?: 'glass' | 'default';
}

export function ColumnSearchInput({
  boardVariant = 'glass',
  className,
  ...props
}: ColumnSearchInputProps) {
  const isGlass = boardVariant === 'glass';

  return (
    <Input
      allowClear
      prefix={
        <ColumnSearchIcon
          className={cn(
            'h-4 w-4 shrink-0',
            isGlass ? 'text-white' : 'text-gray-400',
          )}
        />
      }
      className={cn(
        '[&_.ant-input-affix-wrapper]:rounded-[8px]',
        '[&_.ant-input-affix-wrapper]:border',
        '[&_.ant-input-affix-wrapper]:border-dashed',
        '[&_.ant-input-affix-wrapper]:bg-transparent',
        '[&_.ant-input-affix-wrapper]:shadow-none',
        '[&_.ant-input]:bg-transparent',
        isGlass
          ? [
            '[&_.ant-input-affix-wrapper]:!border-white/25',
            '[&_.ant-input-affix-wrapper]:!text-white',
            '[&_.ant-input-affix-wrapper:hover]:!border-white/45',
            '[&_.ant-input-affix-wrapper-focused]:!border-white/55',
            '[&_.ant-input-affix-wrapper-focused]:!shadow-none',
            '[&_.ant-input]:!text-white',
            '[&_.ant-input]:!caret-white',
            '[&_.ant-input]:placeholder:!text-white/55',
            '[&_.ant-input-clear-icon]:!text-white/70',
            '[&_.ant-input-clear-icon:hover]:!text-white',
          ]
          : [
            '[&_.ant-input-affix-wrapper]:!border-gray-300',
            '[&_.ant-input-affix-wrapper]:!text-gray-600',
            '[&_.ant-input-affix-wrapper:hover]:!border-primary-400',
            '[&_.ant-input-affix-wrapper-focused]:!border-primary-400',
            '[&_.ant-input-affix-wrapper-focused]:!shadow-none',
            '[&_.ant-input]:!text-gray-700',
            '[&_.ant-input]:placeholder:!text-gray-400',
            '[&_.ant-input-clear-icon]:!text-gray-400',
            '[&_.ant-input-affix-wrapper:hover_.ant-input-prefix_svg]:!text-primary-500',
          ],
        className,
      )}
      {...props}
    />
  );
}
