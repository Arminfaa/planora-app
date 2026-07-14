'use client';

import { DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import { useLocale } from '@/i18n/LocaleProvider';
import {
  apiDateToPickerValue,
  getDateInputFormat,
  pickerValueToApiDate,
  toApiDateOnly,
} from '@/lib/jalali-dates';
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
  minDate?: string | null;
  maxDate?: string | null;
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
  minDate,
  maxDate,
}: DateInputProps) {
  const { locale } = useLocale();
  const inputId = id ?? name;
  const status = error ? 'error' : undefined;
  const format = getDateInputFormat(locale);
  const pickerValue = apiDateToPickerValue(value, locale);
  const minPicker = apiDateToPickerValue(toApiDateOnly(minDate), locale);
  const maxPicker = apiDateToPickerValue(toApiDateOnly(maxDate), locale);

  const handleChange = (date: Dayjs | null) => {
    onChange?.(pickerValueToApiDate(date));
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
        key={`date-${locale}-${format}-${toApiDateOnly(minDate)}-${toApiDateOnly(maxDate)}`}
        id={inputId}
        name={name}
        status={status}
        value={pickerValue}
        onChange={handleChange}
        onBlur={onBlur}
        format={format}
        className={cn('w-full', className)}
        disabled={disabled}
        placeholder={placeholder}
        minDate={minPicker ?? undefined}
        maxDate={maxPicker ?? undefined}
        disabledDate={(current) => {
          if (!current?.isValid()) return false;
          const api = pickerValueToApiDate(current);
          if (!api) return false;
          const min = toApiDateOnly(minDate);
          const max = toApiDateOnly(maxDate);
          if (min && api < min) return true;
          if (max && api > max) return true;
          return false;
        }}
        getPopupContainer={() => document.body}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
