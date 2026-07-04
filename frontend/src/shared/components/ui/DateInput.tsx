'use client';

import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { cn } from '@/lib/utils';

interface DateInputProps {
  label?: string;
  error?: string;
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function DateInput({
  value = '',
  onChange,
  onBlur,
  label,
  error,
  id,
  name,
  disabled,
  className,
  placeholder,
}: DateInputProps) {
  const inputId = id ?? name;
  const status = error ? 'error' : undefined;
  const parsed = value ? dayjs(value, 'YYYY-MM-DD') : null;
  const pickerValue = parsed?.isValid() ? parsed : null;

  const handleChange = (date: Dayjs | null) => {
    onChange?.(date ? date.format('YYYY-MM-DD') : '');
  };

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <DatePicker
        id={inputId}
        name={name}
        status={status}
        value={pickerValue}
        onChange={handleChange}
        onBlur={onBlur}
        format="YYYY-MM-DD"
        className={cn('w-full', className)}
        disabled={disabled}
        placeholder={placeholder}
        getPopupContainer={() => document.body}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
