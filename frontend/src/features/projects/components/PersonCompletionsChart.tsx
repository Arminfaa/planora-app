'use client';

import { Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { usePersonCompletions } from '../hooks/usePersonCompletions';
import { useProjectProgress } from '../hooks/useProjectProgress';
import type { NonWorkingReason, PersonCompletionDay } from '../types';
import { useLocale } from '@/i18n/LocaleProvider';
import { defaultApiDateRange, formatLocaleDate } from '@/lib/jalali-dates';
import { getApiErrorMessage } from '@/lib/api';
import { DateRangeInput } from '@/shared/components/ui/DateRangeInput';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { cn } from '@/lib/utils';

const COLORS = {
  working: '#0f766e',
  workingEmpty: '#99f6e4',
  weekend: '#64748b',
  holiday: '#f59e0b',
  leave: '#f43f5e',
} as const;

type ChartDay = PersonCompletionDay & {
  label: string;
  displayCount: number;
  effectiveReason: NonWorkingReason | null;
};

function barFill(day: ChartDay): string {
  if (day.effectiveReason === 'holiday') return COLORS.holiday;
  if (day.effectiveReason === 'leave') return COLORS.leave;
  if (day.effectiveReason === 'weekend') return COLORS.weekend;
  if (day.completedCount <= 0) return COLORS.workingEmpty;
  return COLORS.working;
}

function holidayLabel(day: PersonCompletionDay, locale: 'en' | 'fa'): string {
  if (locale === 'en') {
    return day.holidayTitleEn || day.holidayTitle || '';
  }
  return day.holidayTitleFa || day.holidayTitle || '';
}

function computeTotals(days: ChartDay[]) {
  const workingDays = days.filter((day) => !day.effectiveReason);
  const completedTotal = days.reduce((sum, day) => sum + day.completedCount, 0);
  const completedOnWorkingDays = workingDays.reduce(
    (sum, day) => sum + day.completedCount,
    0,
  );
  return {
    completedTotal,
    completedOnWorkingDays,
    workingDays: workingDays.length,
    nonWorkingDays: days.length - workingDays.length,
    averagePerWorkingDay:
      workingDays.length > 0
        ? Math.round((completedOnWorkingDays / workingDays.length) * 10) / 10
        : 0,
  };
}

interface PersonCompletionsChartProps {
  projectId: string;
}

export function PersonCompletionsChart({
  projectId,
}: PersonCompletionsChartProps) {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const members = useProjectMembers(projectId);
  const { stats: progressStats } = useProjectProgress(projectId, true);
  const [userId, setUserId] = useState('');
  const [range, setRange] = useState(() => defaultApiDateRange(29));
  const [holidayDates, setHolidayDates] = useState<string[]>([]);
  const [leaveDates, setLeaveDates] = useState<string[]>([]);
  const [syncedForKey, setSyncedForKey] = useState('');

  const memberOptions = useMemo(() => {
    const byId = new Map<string, string>();
    for (const member of members) {
      byId.set(member.id, member.name);
    }
    for (const entry of progressStats?.teamWorkload ?? []) {
      if (!byId.has(entry.userId)) {
        byId.set(entry.userId, entry.name);
      }
    }
    if (user?.id && !byId.has(user.id)) {
      byId.set(user.id, user.name);
    }
    return [...byId.entries()].map(([value, label]) => ({ value, label }));
  }, [members, progressStats?.teamWorkload, user?.id, user?.name]);

  useEffect(() => {
    if (userId) return;
    if (user?.id && memberOptions.some((option) => option.value === user.id)) {
      setUserId(user.id);
      return;
    }
    if (memberOptions.length > 0) {
      setUserId(memberOptions[0].value);
    }
  }, [memberOptions, user?.id, userId]);

  const { stats, isLoading, error, isFetching } = usePersonCompletions(
    projectId,
    userId && range.from && range.to
      ? { userId, from: range.from, to: range.to }
      : null,
    Boolean(userId && range.from && range.to),
  );

  // Prefill holiday/leave multi-selects from server marks when range/member changes.
  useEffect(() => {
    if (!stats) return;
    const key = `${stats.userId}:${stats.from}:${stats.to}`;
    if (syncedForKey === key) return;

    setHolidayDates(
      stats.days
        .filter((day) => day.nonWorkingReason === 'holiday')
        .map((day) => day.date),
    );
    setLeaveDates(
      stats.days
        .filter((day) => day.nonWorkingReason === 'leave')
        .map((day) => day.date),
    );
    setSyncedForKey(key);
  }, [stats, syncedForKey]);

  const dayOptions = useMemo(() => {
    if (!stats) return [];
    return stats.days.map((day) => ({
      value: day.date,
      label: formatLocaleDate(day.date, locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    }));
  }, [locale, stats]);

  const chartDays = useMemo(() => {
    if (!stats) return [] as ChartDay[];

    const holidaySet = new Set(holidayDates);
    const leaveSet = new Set(leaveDates);
    const peak = Math.max(1, ...stats.days.map((day) => day.completedCount));

    return stats.days.map((day) => {
      let effectiveReason: NonWorkingReason | null = null;
      if (leaveSet.has(day.date)) effectiveReason = 'leave';
      else if (holidaySet.has(day.date)) effectiveReason = 'holiday';
      else if (day.nonWorkingReason === 'weekend') effectiveReason = 'weekend';

      return {
        ...day,
        effectiveReason,
        isNonWorking: effectiveReason !== null,
        nonWorkingReason: effectiveReason,
        label: formatLocaleDate(day.date, locale, {
          month: 'numeric',
          day: 'numeric',
        }),
        displayCount:
          day.completedCount > 0
            ? day.completedCount
            : effectiveReason
              ? Math.max(0.35, peak * 0.12)
              : Math.max(0.15, peak * 0.06),
      };
    });
  }, [holidayDates, leaveDates, locale, stats]);

  const totals = useMemo(() => computeTotals(chartDays), [chartDays]);

  const yMax = useMemo(() => {
    const max = Math.max(0, ...chartDays.map((day) => day.completedCount));
    return Math.max(max, 1);
  }, [chartDays]);

  return (
    <section className="rounded-xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-md">
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-gray-900">
          {t('projects.personCompletionsTitle')}
        </h3>
        <p className="mt-0.5 text-sm text-gray-500">
          {t('projects.personCompletionsSubtitle')}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
            if (from && to) {
              setSyncedForKey('');
              setRange({ from, to });
            }
          }}
        />
      </div>

      {stats ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('projects.personCompletionsHolidaySelect')}
            </label>
            <Select
              mode="multiple"
              allowClear
              className="w-full"
              value={holidayDates}
              onChange={(values) => {
                const next = values as string[];
                setHolidayDates(next);
                setLeaveDates((prev) =>
                  prev.filter((date) => !next.includes(date)),
                );
              }}
              options={dayOptions}
              optionFilterProp="label"
              placeholder={t(
                'projects.personCompletionsHolidaySelectPlaceholder',
              )}
              maxTagCount="responsive"
              getPopupContainer={() => document.body}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('projects.personCompletionsLeaveSelect')}
            </label>
            <Select
              mode="multiple"
              allowClear
              className="w-full"
              value={leaveDates}
              onChange={(values) => {
                const next = values as string[];
                setLeaveDates(next);
                setHolidayDates((prev) =>
                  prev.filter((date) => !next.includes(date)),
                );
              }}
              options={dayOptions}
              optionFilterProp="label"
              placeholder={t(
                'projects.personCompletionsLeaveSelectPlaceholder',
              )}
              maxTagCount="responsive"
              getPopupContainer={() => document.body}
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {getApiErrorMessage(error)}
        </div>
      ) : null}

      {!userId ? (
        <div className="mt-6 flex min-h-[220px] items-center justify-center">
          <p className="text-sm text-gray-500">
            {t('projects.personCompletionsPickMember')}
          </p>
        </div>
      ) : isLoading && !stats ? (
        <div className="mt-6 flex min-h-[220px] items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : stats ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat
              label={t('projects.personCompletionsTotal')}
              value={String(totals.completedTotal)}
            />
            <SummaryStat
              label={t('projects.personCompletionsWorkingDays')}
              value={String(totals.workingDays)}
            />
            <SummaryStat
              label={t('projects.personCompletionsOnWorkingDays')}
              value={String(totals.completedOnWorkingDays)}
            />
            <SummaryStat
              label={t('projects.personCompletionsAverage')}
              value={String(totals.averagePerWorkingDay)}
            />
          </div>

          <div
            className={cn(
              'mt-5 h-[260px] w-full',
              isFetching ? 'opacity-70' : '',
            )}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartDays}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  allowDecimals={false}
                  domain={[0, yMax]}
                  width={28}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(15, 118, 110, 0.06)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const day = payload[0].payload as ChartDay;
                    const holiday = holidayLabel(day, locale);
                    return (
                      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
                        <p className="font-semibold text-gray-900">
                          {formatLocaleDate(day.date, locale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="mt-1 text-gray-700">
                          {t('projects.personCompletionsTotal')}:{' '}
                          {day.completedCount}
                        </p>
                        {!day.effectiveReason && day.completedCount === 0 ? (
                          <p className="mt-0.5 text-teal-700">
                            {t('projects.personCompletionsLegendWorkingEmpty')}
                          </p>
                        ) : null}
                        {day.effectiveReason === 'weekend' ? (
                          <p className="mt-0.5 text-slate-600">
                            {t('projects.personCompletionsLegendWeekend')}
                          </p>
                        ) : null}
                        {day.effectiveReason === 'holiday' ? (
                          <p className="mt-0.5 text-amber-700">
                            {t('projects.personCompletionsLegendHoliday')}
                            {holiday ? ` — ${holiday}` : ''}
                          </p>
                        ) : null}
                        {day.effectiveReason === 'leave' ? (
                          <p className="mt-0.5 text-rose-600">
                            {t('projects.personCompletionsLegendLeave')}
                          </p>
                        ) : null}
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="displayCount"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                >
                  {chartDays.map((day) => (
                    <Cell
                      key={day.date}
                      fill={barFill(day)}
                      fillOpacity={
                        day.completedCount === 0 && day.effectiveReason
                          ? 0.65
                          : 1
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {totals.completedTotal === 0 ? (
            <p className="mt-2 text-center text-sm text-gray-500">
              {t('projects.personCompletionsEmpty')}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600">
            <LegendDot
              className="bg-teal-700"
              label={t('projects.personCompletionsLegendWorking')}
            />
            <LegendDot
              className="bg-teal-200"
              label={t('projects.personCompletionsLegendWorkingEmpty')}
            />
            <LegendDot
              className="bg-slate-500"
              label={t('projects.personCompletionsLegendWeekend')}
            />
            <LegendDot
              className="bg-amber-500"
              label={t('projects.personCompletionsLegendHoliday')}
            />
            <LegendDot
              className="bg-rose-500"
              label={t('projects.personCompletionsLegendLeave')}
            />
          </div>
        </>
      ) : null}
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
