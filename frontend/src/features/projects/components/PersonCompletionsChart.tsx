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
import type { PersonCompletionDay } from '../types';
import { useLocale } from '@/i18n/LocaleProvider';
import { defaultApiDateRange, formatLocaleDate } from '@/lib/jalali-dates';
import { getApiErrorMessage } from '@/lib/api';
import { DateRangeInput } from '@/shared/components/ui/DateRangeInput';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { cn } from '@/lib/utils';

const COLORS = {
  working: '#0f766e',
  weekend: '#94a3b8',
  holiday: '#f59e0b',
  leave: '#fb7185',
  empty: '#e5e7eb',
} as const;

function barFill(day: PersonCompletionDay): string {
  if (day.completedCount <= 0) {
    if (day.nonWorkingReason === 'holiday') return COLORS.holiday;
    if (day.nonWorkingReason === 'leave') return COLORS.leave;
    if (day.nonWorkingReason === 'weekend') return COLORS.weekend;
    return COLORS.empty;
  }
  if (day.nonWorkingReason === 'holiday') return COLORS.holiday;
  if (day.nonWorkingReason === 'leave') return COLORS.leave;
  if (day.nonWorkingReason === 'weekend') return COLORS.weekend;
  return COLORS.working;
}

function holidayLabel(day: PersonCompletionDay, locale: 'en' | 'fa'): string {
  if (locale === 'en') {
    return day.holidayTitleEn || day.holidayTitle || '';
  }
  return day.holidayTitleFa || day.holidayTitle || '';
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

  const chartData = useMemo(() => {
    if (!stats) return [];
    const peak = Math.max(1, ...stats.days.map((day) => day.completedCount));
    return stats.days.map((day) => ({
      ...day,
      label: formatLocaleDate(day.date, locale, {
        month: 'numeric',
        day: 'numeric',
      }),
      // Keep non-working / empty days visible on the axis.
      displayCount:
        day.completedCount > 0
          ? day.completedCount
          : day.isNonWorking
            ? Math.max(0.35, peak * 0.12)
            : Math.max(0.12, peak * 0.05),
    }));
  }, [locale, stats]);

  const yMax = useMemo(() => {
    const max = Math.max(0, ...chartData.map((day) => day.completedCount));
    return Math.max(max, 1);
  }, [chartData]);

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

          <div
            className={cn(
              'mt-5 h-[260px] w-full',
              isFetching ? 'opacity-70' : '',
            )}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
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
                    const day = payload[0].payload as PersonCompletionDay & {
                      label: string;
                    };
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
                        {day.nonWorkingReason === 'weekend' ? (
                          <p className="mt-0.5 text-slate-500">
                            {t('projects.personCompletionsLegendWeekend')}
                          </p>
                        ) : null}
                        {day.nonWorkingReason === 'holiday' ? (
                          <p className="mt-0.5 text-amber-700">
                            {t('projects.personCompletionsLegendHoliday')}
                            {holiday ? ` — ${holiday}` : ''}
                          </p>
                        ) : null}
                        {day.nonWorkingReason === 'leave' ? (
                          <p className="mt-0.5 text-rose-600">
                            {t('projects.personCompletionsLegendLeave')}
                            {day.leaveNote ? ` — ${day.leaveNote}` : ''}
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
                  {chartData.map((day) => (
                    <Cell
                      key={day.date}
                      fill={barFill(day)}
                      // Keep non-working zero-days slightly visible
                      fillOpacity={
                        day.completedCount === 0 && day.isNonWorking ? 0.55 : 1
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {stats.totals.completedTotal === 0 ? (
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
              className="bg-slate-400"
              label={t('projects.personCompletionsLegendWeekend')}
            />
            <LegendDot
              className="bg-amber-500"
              label={t('projects.personCompletionsLegendHoliday')}
            />
            <LegendDot
              className="bg-rose-400"
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
