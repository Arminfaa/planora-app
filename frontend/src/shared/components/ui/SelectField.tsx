'use client';

import { Select } from 'antd';
import type { SelectProps } from 'antd';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectFieldProps extends Omit<SelectProps, 'options'> {
  label?: ReactNode;
  error?: string;
  options: SelectOption[];
}

export function SelectField({
  className,
  label,
  error,
  id,
  options,
  ...props
}: SelectFieldProps) {
  const inputId = id;
  const status = error ? 'error' : undefined;

  return (
    <div className="space-y-1">
      {label && (
        <div className="block text-sm font-medium text-gray-700">{label}</div>
      )}
      <Select
        id={inputId}
        status={status}
        options={options}
        className={cn('w-full', className)}
        getPopupContainer={() => document.body}
        {...props}
      />
    </div>
  );
}
