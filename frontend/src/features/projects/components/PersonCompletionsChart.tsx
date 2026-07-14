'use client';

import { Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { usePersonCompletions } from '../hooks/usePersonCompletions';
import type { PersonCompletionDay } from '../types';
import { useLocale } from '@/i18n/LocaleProvider';
import { defaultApiDateRange, formatLocaleDate } from '@/lib/jalali-dates';
import { getApiErrorMessage } from '@/lib/api';
import { DateRangeInput } from '@/shared/components/ui/DateRangeInput';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { cn } from '@/lib/utils';

function barColor(day: PersonCompletionDay): string {
  if (day.nonWorkingReason === 'holiday') return 'bg-amber-300';
  if (day.nonWorkingReason === 'leave') return 'bg-rose-300';
  if (day.nonWorkingReason === 'weekend') return 'bg-slate-300';
  return 'bg-teal-500';
}

function dayTitle(
  day: PersonCompletionDay,
  locale: 'en' | 'fa',
  labels: {
    weekend: string;
    holiday: string;
    leave: string;
    tasks: string;
  },
): string {
  const dateLabel = formatLocaleDate(day.date, locale, {
    month: 'short',
    day: 'numeric',
  });
  const parts = [`${dateLabel}: ${day.completedCount} ${labels.tasks}`];
  if (day.nonWorkingReason === 'weekend') parts.push(labels.weekend);
  if (day.nonWorkingReason === 'holiday') {
    parts.push(
      day.holidayTitle
        ? `${labels.holiday}: ${day.holidayTitle}`
        : labels.holiday,
    );
  }
  if (day.nonWorkingReason === 'leave') {
    parts.push(
      day.leaveNote ? `${labels.leave}: ${day.leaveNote}` : labels.leave,
    );
  }
  return parts.join(' · ');
}

interface PersonCompletionsChartProps {
  projectId: string;
}

export function PersonCompletionsChart({
  projectId,
}: PersonCompletionsChartProps) {
  const { t, locale } = useLocale();
  const members = useProjectMembers(projectId);
  const [userId, setUserId] = useState('');
  const [range, setRange] = useState(() => defaultApiDateRange(29));

  useEffect(() => {
    if (!userId && members.length > 0) {
      setUserId(members[0].id);
    }
  }, [members, userId]);

  const { stats, isLoading, error } = usePersonCompletions(
    projectId,
    userId && range.from && range.to
      ? { userId, from: range.from, to: range.to }
      : null,
    Boolean(userId && range.from && range.to),
  );

  const maxCount = useMemo(() => {
    if (!stats?.days.length) return 1;
    return Math.max(1, ...stats.days.map((day) => day.completedCount));
  }, [stats]);

  const memberOptions = useMemo(
    () =>
      members.map((member) => ({
        value: member.id,
        label: member.name,
      })),
    [members],
  );

  return (
    <section className="rounded-xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-md">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900">
            {t('projects.personCompletionsTitle')}
          </h3>
          <p className="mt-0.5 text-sm text-gray-500">
            {t('projects.personCompletionsSubtitle')}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {t('projects.personCompletionsMember')}
          </label>
          <Select
            showSearch
            className="w-full"
            value={userId || undefined}
            onChange={setUserId}
            options={memberOptions}
            optionFilterProp="label"
            placeholder={t('projects.personCompletionsMemberPlaceholder')}
            getPopupContainer={() => document.body}
          />
        </div>
        <DateRangeInput
          label={t('projects.personCompletionsRange')}
          valueFrom={range.from}
          valueTo={range.to}
          onChange={({ from, to }) => {
            if (from && to) setRange({ from, to });
          }}
        />
      </div>

      {error ? (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {getApiErrorMessage(error)}
        </div>
      ) : null}

      {isLoading || !stats ? (
        <div className="mt-6 flex min-h-[180px] items-center justify-center">
          {userId ? (
            <LoadingSpinner />
          ) : (
            <p className="text-sm text-gray-500">
              {t('projects.personCompletionsPickMember')}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat
              label={t('projects.personCompletionsTotal')}
              value={String(stats.totals.completedTotal)}
            />
            <SummaryStat
              label={t('projects.personCompletionsWorkingDays')}
              value={String(stats.totals.workingDays)}
            />
            <SummaryStat
              label={t('projects.personCompletionsOnWorkingDays')}
              value={String(stats.totals.completedOnWorkingDays)}
            />
            <SummaryStat
              label={t('projects.personCompletionsAverage')}
              value={String(stats.totals.averagePerWorkingDay)}
            />
          </div>

          <div className="mt-5 overflow-x-auto pb-1">
            <div
              className="flex h-44 items-end gap-1"
              style={{ minWidth: Math.max(stats.days.length * 18, 280) }}
            >
              {stats.days.map((day) => {
                const heightPct =
                  day.completedCount > 0
                    ? Math.max(8, (day.completedCount / maxCount) * 100)
                    : day.isNonWorking
                      ? 6
                      : 3;
                return (
                  <div
                    key={day.date}
                    className="group relative flex min-w-[14px] flex-1 flex-col items-center justify-end"
                    title={dayTitle(day, locale, {
                      weekend: t('projects.personCompletionsLegendWeekend'),
                      holiday: t('projects.personCompletionsLegendHoliday'),
                      leave: t('projects.personCompletionsLegendLeave'),
                      tasks: t('projects.taskPlural'),
                    })}
                  >
                    <span className="mb-1 hidden text-[10px] font-medium text-gray-600 group-hover:block">
                      {day.completedCount || ''}
                    </span>
                    <div
                      className={cn(
                        'w-full rounded-t-sm transition-all',
                        day.completedCount === 0 && day.isNonWorking
                          ? 'opacity-70'
                          : '',
                        day.completedCount === 0 && !day.isNonWorking
                          ? 'bg-gray-200'
                          : barColor(day),
                      )}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div
              className="mt-2 flex gap-1 text-[10px] text-gray-400"
              style={{ minWidth: Math.max(stats.days.length * 18, 280) }}
            >
              {stats.days.map((day, index) => {
                const show =
                  index === 0 ||
                  index === stats.days.length - 1 ||
                  index % Math.ceil(stats.days.length / 6) === 0;
                return (
                  <div
                    key={`${day.date}-label`}
                    className="min-w-[14px] flex-1 truncate text-center"
                  >
                    {show
                      ? formatLocaleDate(day.date, locale, {
                          month: 'numeric',
                          day: 'numeric',
                        })
                      : ''}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600">
            <LegendDot
              className="bg-teal-500"
              label={t('projects.personCompletionsLegendWorking')}
            />
            <LegendDot
              className="bg-slate-300"
              label={t('projects.personCompletionsLegendWeekend')}
            />
            <LegendDot
              className="bg-amber-300"
              label={t('projects.personCompletionsLegendHoliday')}
            />
            <LegendDot
              className="bg-rose-300"
              label={t('projects.personCompletionsLegendLeave')}
            />
          </div>
        </>
      )}
    </section>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('inline-block h-2.5 w-2.5 rounded-sm', className)} />
      {label}
    </span>
  );
}
