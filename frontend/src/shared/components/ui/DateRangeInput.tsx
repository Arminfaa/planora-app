'use client';

import { DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import { useRef, useState, type ReactNode } from 'react';
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

function normalizeRange(dates: RangeValue): RangeValue {
  if (!dates) return null;
  const start = dates[0] ?? null;
  const end = dates[1] ?? null;
  if (start && end && start.isAfter(end, 'day')) {
    return [end, start];
  }
  return [start, end];
}

function isCompleteRange(dates: RangeValue): dates is [Dayjs, Dayjs] {
  return Boolean(dates?.[0]?.isValid() && dates?.[1]?.isValid());
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
  const committedValue: RangeValue =
    fromValue || toValue ? [fromValue, toValue] : null;

  // Do not pass minDate/maxDate to RangePicker: with dual panels + CSS-hidden
  // second panel, maxDate shifts the visible month back by one.
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState<RangeValue>(null);
  const [panelMonth, setPanelMonth] = useState<Dayjs | null>(null);
  const draftRef = useRef<RangeValue>(null);
  const pickingRef = useRef(false);

  const resolvePanelMonth = (
    field: 'start' | 'end',
    range: RangeValue,
  ): Dayjs | null => {
    const start = range?.[0] ?? fromValue;
    const end = range?.[1] ?? toValue;
    if (field === 'end') {
      return end ?? start ?? null;
    }
    return start ?? end ?? null;
  };

  const displayValue: RangeValue = open
    ? (draftValue ?? committedValue)
    : committedValue;

  const commitRange = (dates: RangeValue) => {
    const normalized = normalizeRange(dates);
    const from = pickerValueToApiDate(normalized?.[0] ?? null);
    const to = pickerValueToApiDate(normalized?.[1] ?? null);

    if (from && to) {
      onChange?.({ from, to });
      return true;
    }

    if (!from && !to) {
      onChange?.({ from: '', to: '' });
    }

    return false;
  };

  const updateDraft = (dates: RangeValue) => {
    const next = normalizeRange(dates);
    draftRef.current = next;
    setDraftValue(next);
    pickingRef.current = Boolean(next?.[0] && !next?.[1]);
    return next;
  };

  return (
    <div className="space-y-1">
      {label ? (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      ) : null}
      <DatePicker.RangePicker
        key={`range-${locale}-${format}`}
        value={displayValue}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            const initial = committedValue;
            draftRef.current = initial;
            pickingRef.current = false;
            setDraftValue(initial);
            setPanelMonth(resolvePanelMonth('start', initial));
            setOpen(true);
            return;
          }

          // Closing: commit a complete in-progress draft so a late parent
          // update is not lost when draft is cleared.
          commitRange(draftRef.current);
          pickingRef.current = false;
          setOpen(false);
          setDraftValue(null);
          draftRef.current = null;
        }}
        onCalendarChange={(dates) => {
          const next = updateDraft(
            dates ? [dates[0] ?? null, dates[1] ?? null] : null,
          );

          // Commit as soon as both ends exist. Relying only on onChange is
          // flaky with the single-panel CSS + controlled panel month.
          if (isCompleteRange(next)) {
            pickingRef.current = false;
            commitRange(next);
          }
        }}
        onChange={(dates) => {
          const next = updateDraft(
            dates ? [dates[0] ?? null, dates[1] ?? null] : null,
          );
          if (isCompleteRange(next) || !next) {
            pickingRef.current = false;
            commitRange(next);
          }
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
        pickerValue={panelMonth ?? undefined}
        onPickerValueChange={(dates) => {
          // Follow user month navigation only; do not fight day clicks.
          const nextMonth = Array.isArray(dates) ? dates[0] : dates;
          if (nextMonth?.isValid()) {
            setPanelMonth(nextMonth);
          }
        }}
        onFocus={(_event, info) => {
          const field = info?.range === 'end' ? 'end' : 'start';
          // While the user is mid-range (start picked, end not), do not jump
          // the panel month — that was snapping/cancelling the selection.
          if (pickingRef.current) return;
          const current = draftRef.current ?? committedValue;
          setPanelMonth(resolvePanelMonth(field, current));
        }}
        placeholder={
          placeholder ?? [t('search.rangeFrom'), t('search.rangeTo')]
        }
        getPopupContainer={() => document.body}
      />
    </div>
  );
}
