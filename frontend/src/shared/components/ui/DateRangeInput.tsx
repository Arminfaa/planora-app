'use client';

import { DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import type { ReactNode } from 'react';
import { useLocale } from '@/i18n/LocaleProvider';
import {
  apiDateToPickerValue,
  getDateInputFormat,
  pickerValueToApiDate,
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
}

export function DateRangeInput({
  label,
  valueFrom = '',
  valueTo = '',
  onChange,
  disabled,
  className,
  placeholder,
}: DateRangeInputProps) {
  const { locale, t } = useLocale();
  const format = getDateInputFormat(locale);
  const fromValue = apiDateToPickerValue(valueFrom, locale);
  const toValue = apiDateToPickerValue(valueTo, locale);
  const rangeValue: [Dayjs | null, Dayjs | null] | null =
    fromValue || toValue ? [fromValue, toValue] : null;

  return (
    <div className="space-y-1">
      {label ? (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      ) : null}
      <DatePicker.RangePicker
        key={`range-${locale}-${format}`}
        value={rangeValue}
        onChange={(dates) => {
          const from = pickerValueToApiDate(dates?.[0] ?? null);
          const to = pickerValueToApiDate(dates?.[1] ?? null);
          onChange?.({ from, to });
        }}
        format={format}
        className={cn('w-full min-w-0 max-w-full', className)}
        style={{ width: '100%', maxWidth: '100%' }}
        disabled={disabled}
        allowEmpty={[true, true]}
        placeholder={
          placeholder ?? [t('search.rangeFrom'), t('search.rangeTo')]
        }
        getPopupContainer={() => document.body}
      />
    </div>
  );
}
