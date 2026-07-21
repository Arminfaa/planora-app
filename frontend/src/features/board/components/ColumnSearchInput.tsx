'use client';

import { Input } from 'antd';
import type { InputProps } from 'antd';
import { cn } from '@/lib/utils';

const GLASS_CLASS = 'column-search-input--glass';

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
  style,
  styles,
  ...props
}: ColumnSearchInputProps) {
  const isGlass = boardVariant === 'glass';

  return (
    <>
      {isGlass ? (
        <style>{`
          .${GLASS_CLASS}.ant-input-affix-wrapper,
          .${GLASS_CLASS} .ant-input-affix-wrapper {
            border-color: rgba(255, 255, 255, 0.25) !important;
            color: #fff !important;
          }
          .${GLASS_CLASS}.ant-input-affix-wrapper:hover,
          .${GLASS_CLASS} .ant-input-affix-wrapper:hover {
            border-color: rgba(255, 255, 255, 0.45) !important;
          }
          .${GLASS_CLASS}.ant-input-affix-wrapper-focused,
          .${GLASS_CLASS} .ant-input-affix-wrapper-focused,
          .${GLASS_CLASS}.ant-input-affix-wrapper:focus-within,
          .${GLASS_CLASS} .ant-input-affix-wrapper:focus-within {
            border-color: rgba(255, 255, 255, 0.55) !important;
            box-shadow: none !important;
          }
          .${GLASS_CLASS} .ant-input,
          .${GLASS_CLASS}.ant-input {
            color: #fff !important;
            caret-color: #fff !important;
          }
          .${GLASS_CLASS} .ant-input::placeholder,
          .${GLASS_CLASS}.ant-input::placeholder {
            color: rgba(255, 255, 255, 0.55) !important;
          }
          .${GLASS_CLASS} .ant-input-clear-icon {
            color: rgba(255, 255, 255, 0.7) !important;
          }
          .${GLASS_CLASS} .ant-input-clear-icon:hover {
            color: #fff !important;
          }
        `}</style>
      ) : null}
      <Input
        allowClear
        {...props}
        prefix={
          <ColumnSearchIcon
            className={cn(
              'h-4 w-4 shrink-0',
              isGlass ? 'text-white' : 'text-gray-400',
            )}
          />
        }
        className={cn(
          '[&_.ant-input-affix-wrapper]:h-10',
          '[&_.ant-input-affix-wrapper]:min-h-10',
          '[&_.ant-input-affix-wrapper]:rounded-[8px]',
          '[&_.ant-input-affix-wrapper]:border',
          '[&_.ant-input-affix-wrapper]:border-dashed',
          '[&_.ant-input-affix-wrapper]:bg-transparent',
          '[&_.ant-input-affix-wrapper]:shadow-none',
          '[&_.ant-input]:bg-transparent',
          isGlass
            ? GLASS_CLASS
            : [
              '[&_.ant-input-affix-wrapper]:!border-gray-300',
              '[&_.ant-input-affix-wrapper]:!rounded-[8px]',
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
        style={
          isGlass
            ? {
              borderColor: 'rgba(255, 255, 255, 0.25)',
              color: '#fff',
              boxShadow: 'none',
              backgroundColor: 'transparent',
              borderRadius: '8px',
              ...style,
            }
            : style
        }
        styles={
          isGlass
            ? {
              input: {
                color: '#fff',
                caretColor: '#fff',
                backgroundColor: 'transparent',
                borderRadius: '8px',
              },
            }
            : styles
        }
      />
    </>
  );
}
