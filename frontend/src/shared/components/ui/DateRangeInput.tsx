'use client';

import { DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import type { ReactNode } from 'react';
import { useLocale } from '@/i18n/LocaleProvider';
import {
  apiDateToPickerValue,
  getDateInputFormat,
  pickerValueToApiDate,
  toApiDateOnly,
} from '@/lib/jalali-dates';
import { cn } from '@/lib/utils';

interface DateRangeInputProps {
  label?: ReactNode;
  valueFrom?: string | null;
  valueTo?: string | null;
  onChange?: (next: { from: string; to: string }) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: [string, string];
  /** Inclusive minimum selectable day (YYYY-MM-DD or ISO). */
  minDate?: string | null;
  /** Inclusive maximum selectable day (YYYY-MM-DD or ISO). */
  maxDate?: string | null;
}

export function DateRangeInput({
  label,
  valueFrom = '',
  valueTo = '',
  onChange,
  disabled,
  className,
  placeholder,
  minDate,
  maxDate,
}: DateRangeInputProps) {
  const { locale, t } = useLocale();
  const format = getDateInputFormat(locale);
  const fromValue = apiDateToPickerValue(valueFrom, locale);
  const toValue = apiDateToPickerValue(valueTo, locale);
  const rangeValue: [Dayjs | null, Dayjs | null] | null =
    fromValue || toValue ? [fromValue, toValue] : null;

  const minPicker = apiDateToPickerValue(toApiDateOnly(minDate), locale);
  const maxPicker = apiDateToPickerValue(toApiDateOnly(maxDate), locale);

  return (
    <div className="space-y-1">
      {label ? (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      ) : null}
      <DatePicker.RangePicker
        key={`range-${locale}-${format}-${toApiDateOnly(minDate)}-${toApiDateOnly(maxDate)}`}
        value={rangeValue}
        onChange={(dates) => {
          const from = pickerValueToApiDate(dates?.[0] ?? null);
          const to = pickerValueToApiDate(dates?.[1] ?? null);
          onChange?.({ from, to });
        }}
        format={format}
        className={cn('w-full min-w-0 max-w-full', className)}
        classNames={{ popup: { root: 'app-range-picker-dropdown' } }}
        style={{ width: '100%', maxWidth: '100%' }}
        disabled={disabled}
        allowEmpty={[true, true]}
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
        placeholder={
          placeholder ?? [t('search.rangeFrom'), t('search.rangeTo')]
        }
        getPopupContainer={() => document.body}
      />
    </div>
  );
}
