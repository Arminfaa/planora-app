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

type RangeValue = [Dayjs | null, Dayjs | null] | null;

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
  const committedValue: RangeValue =
    fromValue || toValue ? [fromValue, toValue] : null;

  // Do not pass minDate/maxDate to RangePicker: with dual panels + CSS-hidden
  // second panel, maxDate shifts the visible month back by one (e.g. Tir → Khordad).
  // Selection limits stay enforced via disabledDate only.
  const [panelMonth, setPanelMonth] = useState<Dayjs | null>(null);
  const [activeField, setActiveField] = useState<'start' | 'end'>('start');
  // Keep in-progress picks while open. Re-renders from panelMonth would otherwise
  // push the committed controlled value back and snap start to the old date.
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState<RangeValue>(null);

  const resolveOpenMonth = (
    field: 'start' | 'end' = activeField,
    range: RangeValue = open ? draftValue : committedValue,
  ): Dayjs | null => {
    const start = range?.[0] ?? fromValue;
    const end = range?.[1] ?? toValue;
    if (field === 'end') {
      return end ?? start ?? null;
    }
    return start ?? end ?? null;
  };

  const displayValue: RangeValue =
    open && draftValue ? draftValue : committedValue;

  const emitChange = (dates: RangeValue) => {
    const from = pickerValueToApiDate(dates?.[0] ?? null);
    const to = pickerValueToApiDate(dates?.[1] ?? null);
    onChange?.({ from, to });
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
        value={displayValue}
        onCalendarChange={(dates) => {
          const next: RangeValue = dates
            ? [dates[0] ?? null, dates[1] ?? null]
            : null;
          setDraftValue(next);
        }}
        onChange={(dates) => {
          const next: RangeValue = dates
            ? [dates[0] ?? null, dates[1] ?? null]
            : null;
          setDraftValue(next);
          emitChange(next);
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
          setPanelMonth(resolveOpenMonth(next));
        }}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (nextOpen) {
            setDraftValue(committedValue);
            setPanelMonth(resolveOpenMonth(activeField, committedValue));
          } else {
            setDraftValue(null);
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
