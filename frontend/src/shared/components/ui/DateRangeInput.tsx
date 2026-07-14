'use client';

import { DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import { useState, type ReactNode } from 'react';
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

  // Do not pass minDate/maxDate to RangePicker: with dual panels + CSS-hidden
  // second panel, maxDate shifts the visible month back by one (e.g. Tir → Khordad).
  // Selection limits stay enforced via disabledDate only.
  const [panelMonth, setPanelMonth] = useState<Dayjs | null>(null);
  const [activeField, setActiveField] = useState<'start' | 'end'>('start');

  const resolveOpenMonth = (): Dayjs | null => {
    if (activeField === 'end') {
      return toValue ?? fromValue ?? null;
    }
    return fromValue ?? toValue ?? null;
  };

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
        defaultPickerValue={resolveOpenMonth() ?? undefined}
        pickerValue={panelMonth ?? undefined}
        onPickerValueChange={(dates) => {
          setPanelMonth(dates?.[0] ?? null);
        }}
        onFocus={(_event, info) => {
          const next = info?.range === 'end' ? 'end' : 'start';
          setActiveField(next);
          const month =
            next === 'end'
              ? (toValue ?? fromValue ?? null)
              : (fromValue ?? toValue ?? null);
          setPanelMonth(month);
        }}
        onOpenChange={(open) => {
          if (open) {
            setPanelMonth(resolveOpenMonth());
          }
        }}
        placeholder={
          placeholder ?? [t('search.rangeFrom'), t('search.rangeTo')]
        }
        getPopupContainer={() => document.body}
      />
    </div>
  );
}
