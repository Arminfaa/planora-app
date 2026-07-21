'use client';

import { Select } from 'antd';
import type { SelectProps } from 'antd';
import { cn } from '@/lib/utils';

const GLASS_CLASS = 'column-assignee-filter--glass';

function AssigneeFilterIcon({ className }: { className?: string }) {
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
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

export interface ColumnAssigneeOption {
  value: string;
  label: string;
}

interface ColumnAssigneeFilterProps
  extends Omit<SelectProps, 'options' | 'variant'> {
  boardVariant?: 'glass' | 'default';
  options: ColumnAssigneeOption[];
}

export function ColumnAssigneeFilter({
  boardVariant = 'glass',
  className,
  options,
  placeholder,
  popupMatchSelectWidth = false,
  ...props
}: ColumnAssigneeFilterProps) {
  const isGlass = boardVariant === 'glass';

  return (
    <>
      {isGlass ? (
        <style>{`
          .${GLASS_CLASS}.ant-select .ant-select-selector {
            border-color: rgba(255, 255, 255, 0.25) !important;
            color: #fff !important;
            background: transparent !important;
            box-shadow: none !important;
          }
          .${GLASS_CLASS}.ant-select:hover .ant-select-selector,
          .${GLASS_CLASS}.ant-select.ant-select-open .ant-select-selector {
            border-color: rgba(255, 255, 255, 0.45) !important;
          }
          .${GLASS_CLASS}.ant-select-focused .ant-select-selector,
          .${GLASS_CLASS}.ant-select:focus-within .ant-select-selector {
            border-color: rgba(255, 255, 255, 0.55) !important;
            box-shadow: none !important;
          }
          .${GLASS_CLASS} .ant-select-selection-item,
          .${GLASS_CLASS} .ant-select-selection-placeholder {
            color: rgba(255, 255, 255, 0.92) !important;
          }
          .${GLASS_CLASS} .ant-select-selection-placeholder {
            color: rgba(255, 255, 255, 0.55) !important;
          }
          .${GLASS_CLASS} .ant-select-arrow,
          .${GLASS_CLASS} .ant-select-clear {
            color: rgba(255, 255, 255, 0.7) !important;
          }
          .${GLASS_CLASS} .ant-select-clear:hover {
            color: #fff !important;
          }
        `}</style>
      ) : null}
      <div className="relative w-full">
        <AssigneeFilterIcon
          className={cn(
            'pointer-events-none absolute start-2.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 shrink-0',
            isGlass ? 'text-white/80' : 'text-gray-400',
          )}
        />
        <Select
          allowClear
          showSearch
          optionFilterProp="label"
          placeholder={placeholder}
          options={options}
          popupMatchSelectWidth={popupMatchSelectWidth}
          className={cn(
            'column-assignee-filter w-full',
            '[&_.ant-select-selector]:!rounded-[8px]',
            '[&_.ant-select-selector]:!border',
            '[&_.ant-select-selector]:!border-dashed',
            '[&_.ant-select-selector]:!bg-transparent',
            '[&_.ant-select-selector]:!shadow-none',
            '[&_.ant-select-selector]:!min-h-[32px]',
            '[&_.ant-select-selector]:!ps-8',
            '[&_.ant-select-selection-search-input]:!bg-transparent',
            isGlass
              ? GLASS_CLASS
              : [
                  '[&_.ant-select-selector]:!border-gray-300',
                  '[&_.ant-select-selector]:!text-gray-600',
                  '[&_.ant-select:hover_.ant-select-selector]:!border-primary-400',
                  '[&_.ant-select-focused_.ant-select-selector]:!border-primary-400',
                  '[&_.ant-select-selection-item]:!text-gray-700',
                  '[&_.ant-select-selection-placeholder]:!text-gray-400',
                  '[&_.ant-select-arrow]:!text-gray-400',
                  '[&_.ant-select-clear]:!text-gray-400',
                ],
            className,
          )}
          {...props}
        />
      </div>
    </>
  );
}
