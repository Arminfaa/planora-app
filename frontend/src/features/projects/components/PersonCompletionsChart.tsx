'use client';

import { Select, Segmented } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { usePersonCompletionsMulti } from '../hooks/usePersonCompletionsMulti';
import { useProjectProgress } from '../hooks/useProjectProgress';
import type {
  NonWorkingReason,
  PersonCompletionDay,
  PersonCompletionsStats,
} from '../types';
import { useLocale } from '@/i18n/LocaleProvider';
import {
  clampApiDateRange,
  defaultApiDateRange,
  formatLocaleDate,
  toApiDateOnly,
  todayApiDate,
} from '@/lib/jalali-dates';
import { getApiErrorMessage } from '@/lib/api';
import { DateRangeInput } from '@/shared/components/ui/DateRangeInput';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { cn } from '@/lib/utils';

const MAX_SELECTED_MEMBERS = 6;

type ChartType = 'bar' | 'line';

const COLORS = {
  working: '#0f766e',
  workingEmpty: '#99f6e4',
  weekend: '#64748b',
  holiday: '#f59e0b',
  leave: '#f43f5e',
} as const;

const SERIES_COLORS = [
  '#0f766e',
  '#2563eb',
  '#c026d3',
  '#ea580c',
  '#0891b2',
  '#4f46e5',
] as const;

type ChartDay = PersonCompletionDay & {
  label: string;
  displayCount: number;
  effectiveReason: NonWorkingReason | null;
};

type MultiChartDay = {
  date: string;
  label: string;
  counts: Record<string, number>;
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

function seriesKey(userId: string): string {
  return `u_${userId}`;
}

function computeTotals(
  days: Array<{
    completedCount: number;
    effectiveReason: NonWorkingReason | null;
  }>,
) {
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

function computeTotalsFromStats(
  stats: PersonCompletionsStats,
  overrides?: { holidayDates: string[]; leaveDates: string[] },
) {
  if (!overrides) {
    return computeTotals(
      stats.days.map((day) => ({
        completedCount: day.completedCount,
        effectiveReason: day.nonWorkingReason,
      })),
    );
  }

  const holidaySet = new Set(overrides.holidayDates);
  const leaveSet = new Set(overrides.leaveDates);
  return computeTotals(
    stats.days.map((day) => {
      let effectiveReason: NonWorkingReason | null = null;
      if (leaveSet.has(day.date)) effectiveReason = 'leave';
      else if (holidaySet.has(day.date)) effectiveReason = 'holiday';
      else if (day.nonWorkingReason === 'weekend') effectiveReason = 'weekend';
      return { completedCount: day.completedCount, effectiveReason };
    }),
  );
}

interface PersonCompletionsChartProps {
  projectId: string;
  projectCreatedAt?: string | null;
}

export function PersonCompletionsChart({
  projectId,
  projectCreatedAt,
}: PersonCompletionsChartProps) {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const members = useProjectMembers(projectId);
  const { stats: progressStats } = useProjectProgress(projectId, true);
  const projectMinDate = toApiDateOnly(projectCreatedAt);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [range, setRange] = useState(() =>
    defaultApiDateRange(29, { minDate: projectCreatedAt }),
  );
  const [holidayDates, setHolidayDates] = useState<string[]>([]);
  const [leaveDates, setLeaveDates] = useState<string[]>([]);
  const [syncedForKey, setSyncedForKey] = useState('');

  useEffect(() => {
    if (!projectMinDate) return;
    setRange((prev) =>
      clampApiDateRange(prev, {
        minDate: projectMinDate,
        maxDate: todayApiDate(),
      }),
    );
  }, [projectMinDate]);

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

  const memberNameById = useMemo(
    () => new Map(memberOptions.map((option) => [option.value, option.label])),
    [memberOptions],
  );

  useEffect(() => {
    if (userIds.length > 0) return;
    if (user?.id && memberOptions.some((option) => option.value === user.id)) {
      setUserIds([user.id]);
      return;
    }
    if (memberOptions.length > 0) {
      setUserIds([memberOptions[0].value]);
    }
  }, [memberOptions, user?.id, userIds.length]);

  const isMulti = userIds.length > 1;
  const primaryUserId = userIds[0] ?? '';

  const { statsByUserId, isLoading, error, isFetching, loadedCount } =
    usePersonCompletionsMulti(
      projectId,
      userIds,
      range.from,
      range.to,
      Boolean(userIds.length && range.from && range.to),
    );

  const primaryStats = primaryUserId
    ? (statsByUserId.get(primaryUserId) ?? null)
    : null;

  // Prefill holiday/leave multi-selects only in single-member mode.
  useEffect(() => {
    if (isMulti || !primaryStats) return;
    const key = `${primaryStats.userId}:${primaryStats.from}:${primaryStats.to}`;
    if (syncedForKey === key) return;

    setHolidayDates(
      primaryStats.days
        .filter((day) => day.nonWorkingReason === 'holiday')
        .map((day) => day.date),
    );
    setLeaveDates(
      primaryStats.days
        .filter((day) => day.nonWorkingReason === 'leave')
        .map((day) => day.date),
    );
    setSyncedForKey(key);
  }, [isMulti, primaryStats, syncedForKey]);

  const dayOptions = useMemo(() => {
    if (!primaryStats) return [];
    return primaryStats.days.map((day) => ({
      value: day.date,
      label: formatLocaleDate(day.date, locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    }));
  }, [locale, primaryStats]);

  const singleChartDays = useMemo(() => {
    if (isMulti || !primaryStats) return [] as ChartDay[];

    const holidaySet = new Set(holidayDates);
    const leaveSet = new Set(leaveDates);
    const peak = Math.max(
      1,
      ...primaryStats.days.map((day) => day.completedCount),
    );

    return primaryStats.days.map((day) => {
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
  }, [holidayDates, isMulti, leaveDates, locale, primaryStats]);

  const multiChartDays = useMemo(() => {
    if (!isMulti || loadedCount === 0) return [] as MultiChartDay[];

    const first = statsByUserId.get(
      userIds.find((id) => statsByUserId.has(id))!,
    );
    if (!first) return [];

    return first.days.map((day, index) => {
      const counts: Record<string, number> = {};
      for (const userId of userIds) {
        const stats = statsByUserId.get(userId);
        counts[seriesKey(userId)] = stats?.days[index]?.completedCount ?? 0;
      }
      return {
        date: day.date,
        label: formatLocaleDate(day.date, locale, {
          month: 'numeric',
          day: 'numeric',
        }),
        counts,
        ...counts,
      };
    });
  }, [isMulti, loadedCount, locale, statsByUserId, userIds]);

  const memberTotals = useMemo(() => {
    return userIds
      .map((userId, index) => {
        const stats = statsByUserId.get(userId);
        if (!stats) return null;
        const totals = isMulti
          ? computeTotalsFromStats(stats)
          : computeTotalsFromStats(stats, { holidayDates, leaveDates });
        return {
          userId,
          name:
            memberNameById.get(userId) ||
            stats.userName ||
            t('projects.personCompletionsUnknownMember'),
          color: SERIES_COLORS[index % SERIES_COLORS.length],
          totals,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }, [
    holidayDates,
    isMulti,
    leaveDates,
    memberNameById,
    statsByUserId,
    t,
    userIds,
  ]);

  const yMax = useMemo(() => {
    if (isMulti) {
      const max = Math.max(
        0,
        ...multiChartDays.flatMap((day) =>
          userIds.map((userId) => day.counts[seriesKey(userId)] ?? 0),
        ),
      );
      return Math.max(max, 1);
    }
    const max = Math.max(
      0,
      ...singleChartDays.map((day) => day.completedCount),
    );
    return Math.max(max, 1);
  }, [isMulti, multiChartDays, singleChartDays, userIds]);

  const handleUserIdsChange = (next: string[]) => {
    const limited = next.slice(0, MAX_SELECTED_MEMBERS);
    setSyncedForKey('');
    setUserIds(limited);
  };

  const hasChartData = isMulti
    ? loadedCount > 0 && multiChartDays.length > 0
    : Boolean(primaryStats);

  const memberSeriesName = (userId: string) =>
    memberNameById.get(userId) ||
    statsByUserId.get(userId)?.userName ||
    t('projects.personCompletionsUnknownMember');

  const renderMultiTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    // Recharts tooltip payload typing is looser than our render needs.
    payload?: ReadonlyArray<{
      dataKey?: unknown;
      name?: unknown;
      value?: unknown;
      color?: string;
      payload?: { date?: string };
    }>;
    label?: unknown;
  }) => {
    if (!active || !payload?.length) return null;
    const date = payload[0]?.payload?.date;
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-lg">
        <p className="font-semibold text-gray-900">
          {date
            ? formatLocaleDate(date, locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : String(label ?? '')}
        </p>
        <ul className="mt-1 space-y-0.5">
          {payload.map((item) => (
            <li
              key={String(item.dataKey)}
              className="flex items-center gap-2 text-gray-700"
            >
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ backgroundColor: String(item.color) }}
              />
              <span>
                {String(item.name)}: {Number(item.value)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderSingleTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: ReadonlyArray<{ payload?: ChartDay }>;
  }) => {
    if (!active || !payload?.[0]?.payload) return null;
    const day = payload[0].payload;
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
          {t('projects.personCompletionsTotal')}: {day.completedCount}
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
  };

  return (
    <section className="rounded-xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900">
            {t('projects.personCompletionsTitle')}
          </h3>
          <p className="mt-0.5 text-sm text-gray-500">
            {t('projects.personCompletionsSubtitle')}
          </p>
        </div>
        <Segmented
          className="shrink-0 self-start"
          value={chartType}
          onChange={(value) => setChartType(value as ChartType)}
          options={[
            {
              label: t('projects.personCompletionsChartBar'),
              value: 'bar',
            },
            {
              label: t('projects.personCompletionsChartLine'),
              value: 'line',
            },
          ]}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {t('projects.personCompletionsMember')}
          </label>
          <Select
            mode="multiple"
            allowClear
            showSearch
            className="w-full"
            value={userIds}
            onChange={handleUserIdsChange}
            options={memberOptions}
            optionFilterProp="label"
            placeholder={t('projects.personCompletionsMemberPlaceholder')}
            maxTagCount="responsive"
            getPopupContainer={() => document.body}
          />
          {userIds.length >= MAX_SELECTED_MEMBERS ? (
            <p className="text-xs text-gray-500">
              {t('projects.personCompletionsMemberLimit', {
                count: String(MAX_SELECTED_MEMBERS),
              })}
            </p>
          ) : null}
        </div>
        <DateRangeInput
          label={t('projects.personCompletionsRange')}
          valueFrom={range.from}
          valueTo={range.to}
          minDate={projectMinDate || null}
          maxDate={todayApiDate()}
          onChange={({ from, to }) => {
            if (from && to) {
              setSyncedForKey('');
              setRange(
                clampApiDateRange(
                  { from, to },
                  {
                    minDate: projectMinDate || null,
                    maxDate: todayApiDate(),
                  },
                ),
              );
            }
          }}
        />
      </div>

      {!isMulti && primaryStats ? (
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

      {userIds.length === 0 ? (
        <div className="mt-6 flex min-h-[220px] items-center justify-center">
          <p className="text-sm text-gray-500">
            {t('projects.personCompletionsPickMember')}
          </p>
        </div>
      ) : isLoading && !hasChartData ? (
        <div className="mt-6 flex min-h-[220px] items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : hasChartData ? (
        <>
          <div
            className={cn(
              'mt-5 grid gap-3',
              memberTotals.length === 1
                ? 'grid-cols-2 sm:grid-cols-4'
                : 'grid-cols-1 sm:grid-cols-2',
            )}
          >
            {memberTotals.length === 1 ? (
              <>
                <SummaryStat
                  label={t('projects.personCompletionsTotal')}
                  value={String(memberTotals[0].totals.completedTotal)}
                />
                <SummaryStat
                  label={t('projects.personCompletionsWorkingDays')}
                  value={String(memberTotals[0].totals.workingDays)}
                />
                <SummaryStat
                  label={t('projects.personCompletionsOnWorkingDays')}
                  value={String(memberTotals[0].totals.completedOnWorkingDays)}
                />
                <SummaryStat
                  label={t('projects.personCompletionsAverage')}
                  value={String(memberTotals[0].totals.averagePerWorkingDay)}
                />
              </>
            ) : (
              memberTotals.map((entry) => (
                <div
                  key={entry.userId}
                  className="rounded-lg bg-gray-50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: entry.color }}
                    />
                    <p className="truncate text-sm font-medium text-gray-900">
                      {entry.name}
                    </p>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div>
                      <p>{t('projects.personCompletionsTotal')}</p>
                      <p className="mt-0.5 text-base font-semibold text-gray-900">
                        {entry.totals.completedTotal}
                      </p>
                    </div>
                    <div>
                      <p>{t('projects.personCompletionsWorkingDays')}</p>
                      <p className="mt-0.5 text-base font-semibold text-gray-900">
                        {entry.totals.workingDays}
                      </p>
                    </div>
                    <div>
                      <p>{t('projects.personCompletionsAverage')}</p>
                      <p className="mt-0.5 text-base font-semibold text-gray-900">
                        {entry.totals.averagePerWorkingDay}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div
            className={cn(
              'mt-5 h-[280px] w-full',
              isFetching ? 'opacity-70' : '',
            )}
          >
            <ResponsiveContainer width="100%" height="100%">
              {isMulti ? (
                chartType === 'line' ? (
                  <LineChart
                    data={multiChartDays}
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
                      cursor={{ stroke: 'rgba(15, 118, 110, 0.25)' }}
                      content={(props) => renderMultiTooltip(props)}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {userIds.map((userId, index) => (
                      <Line
                        key={userId}
                        type="monotone"
                        dataKey={seriesKey(userId)}
                        name={memberSeriesName(userId)}
                        stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                ) : (
                  <BarChart
                    data={multiChartDays}
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
                      content={(props) => renderMultiTooltip(props)}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {userIds.map((userId, index) => (
                      <Bar
                        key={userId}
                        dataKey={seriesKey(userId)}
                        name={memberSeriesName(userId)}
                        fill={SERIES_COLORS[index % SERIES_COLORS.length]}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={18}
                      />
                    ))}
                  </BarChart>
                )
              ) : chartType === 'line' ? (
                <LineChart
                  data={singleChartDays}
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
                    cursor={{ stroke: 'rgba(15, 118, 110, 0.25)' }}
                    content={(props) => renderSingleTooltip(props)}
                  />
                  <Line
                    type="monotone"
                    dataKey="completedCount"
                    name={memberSeriesName(primaryUserId)}
                    stroke={COLORS.working}
                    strokeWidth={2}
                    dot={{ r: 3, fill: COLORS.working }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              ) : (
                <BarChart
                  data={singleChartDays}
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
                    content={(props) => renderSingleTooltip(props)}
                  />
                  <Bar
                    dataKey="displayCount"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  >
                    {singleChartDays.map((day) => (
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
              )}
            </ResponsiveContainer>
          </div>

          {memberTotals.every((entry) => entry.totals.completedTotal === 0) ? (
            <p className="mt-2 text-center text-sm text-gray-500">
              {t('projects.personCompletionsEmpty')}
            </p>
          ) : null}

          {!isMulti && chartType === 'bar' ? (
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
          ) : null}
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
