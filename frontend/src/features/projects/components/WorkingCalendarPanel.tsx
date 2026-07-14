'use client';

import { Checkbox, Select } from 'antd';
import { useMemo, useState } from 'react';
import { useProjectMembers } from '../hooks/useProjectMembers';
import { useWorkingCalendar } from '../hooks/useWorkingCalendar';
import { useLocale } from '@/i18n/LocaleProvider';
import { formatLocaleDate } from '@/lib/jalali-dates';
import { getApiErrorMessage } from '@/lib/api';
import { DateInput } from '@/shared/components/ui/DateInput';
import { DateRangeInput } from '@/shared/components/ui/DateRangeInput';
import { Button } from '@/shared/components/ui/Button';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';

const WEEKDAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

interface WorkingCalendarPanelProps {
  projectId: string;
  canEdit: boolean;
}

export function WorkingCalendarPanel({
  projectId,
  canEdit,
}: WorkingCalendarPanelProps) {
  const { t, locale } = useLocale();
  const members = useProjectMembers(projectId);
  const {
    calendar,
    isLoading,
    updateWeekdays,
    createHoliday,
    deleteHoliday,
    createLeave,
    deleteLeave,
  } = useWorkingCalendar(projectId, true);

  const [holidayDate, setHolidayDate] = useState('');
  const [holidayTitle, setHolidayTitle] = useState('');
  const [leaveUserId, setLeaveUserId] = useState('');
  const [leaveRange, setLeaveRange] = useState({ from: '', to: '' });
  const [leaveNote, setLeaveNote] = useState('');
  const [actionError, setActionError] = useState('');

  const weekdayLabels = useMemo(
    () =>
      WEEKDAY_KEYS.map((key, index) => ({
        value: index,
        label: t(`projects.weekday.${key}`),
      })),
    [t],
  );

  const memberOptions = useMemo(
    () =>
      members.map((member) => ({
        value: member.id,
        label: member.name,
      })),
    [members],
  );

  const handleToggleWeekday = async (day: number, checked: boolean) => {
    if (!calendar || !canEdit) return;
    setActionError('');
    const next = checked
      ? [...new Set([...calendar.nonWorkingWeekdays, day])].sort(
          (a, b) => a - b,
        )
      : calendar.nonWorkingWeekdays.filter((value) => value !== day);
    try {
      await updateWeekdays.mutateAsync(next);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  const handleAddHoliday = async () => {
    if (!holidayDate) return;
    setActionError('');
    try {
      await createHoliday.mutateAsync({
        date: holidayDate,
        title: holidayTitle.trim() || undefined,
      });
      setHolidayDate('');
      setHolidayTitle('');
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  const handleAddLeave = async () => {
    if (!leaveUserId || !leaveRange.from || !leaveRange.to) return;
    setActionError('');
    try {
      await createLeave.mutateAsync({
        userId: leaveUserId,
        startDate: leaveRange.from,
        endDate: leaveRange.to,
        note: leaveNote.trim() || undefined,
      });
      setLeaveNote('');
      setLeaveRange({ from: '', to: '' });
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  if (isLoading || !calendar) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex min-h-[120px] items-center justify-center">
          <LoadingSpinner />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">
        {t('projects.workingCalendarTitle')}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {t('projects.workingCalendarSubtitle')}
      </p>

      {actionError ? (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      <div className="mt-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            {t('projects.workingCalendarWeekends')}
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            {t('projects.workingCalendarWeekendsHint')}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {weekdayLabels.map((day) => (
              <Checkbox
                key={day.value}
                checked={calendar.nonWorkingWeekdays.includes(day.value)}
                disabled={!canEdit || updateWeekdays.isPending}
                onChange={(event) =>
                  void handleToggleWeekday(day.value, event.target.checked)
                }
              >
                {day.label}
              </Checkbox>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-semibold text-gray-800">
            {t('projects.workingCalendarHolidays')}
          </h3>
          {canEdit ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <DateInput
                label={t('projects.workingCalendarHolidayDate')}
                value={holidayDate}
                onChange={setHolidayDate}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {t('projects.workingCalendarHolidayTitle')}
                </label>
                <input
                  value={holidayTitle}
                  onChange={(event) => setHolidayTitle(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder={t(
                    'projects.workingCalendarHolidayTitlePlaceholder',
                  )}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={() => void handleAddHoliday()}
                  disabled={!holidayDate || createHoliday.isPending}
                  isLoading={createHoliday.isPending}
                >
                  {t('projects.workingCalendarAddHoliday')}
                </Button>
              </div>
            </div>
          ) : null}

          <ul className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-100">
            {calendar.holidays.length === 0 ? (
              <li className="px-3 py-3 text-sm text-gray-500">
                {t('projects.workingCalendarNoHolidays')}
              </li>
            ) : (
              calendar.holidays.map((holiday) => (
                <li
                  key={holiday.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <div>
                    <span className="font-medium text-gray-800">
                      {formatLocaleDate(holiday.date, locale, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    {holiday.title ? (
                      <span className="ms-2 text-gray-500">
                        {holiday.title}
                      </span>
                    ) : null}
                  </div>
                  {canEdit ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                      onClick={() => {
                        setActionError('');
                        void deleteHoliday
                          .mutateAsync(holiday.id)
                          .catch((err) => {
                            setActionError(getApiErrorMessage(err));
                          });
                      }}
                    >
                      {t('common.delete')}
                    </button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-semibold text-gray-800">
            {t('projects.workingCalendarLeaves')}
          </h3>
          {canEdit ? (
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {t('projects.workingCalendarLeaveMember')}
                </label>
                <Select
                  showSearch
                  className="w-full"
                  value={leaveUserId || undefined}
                  onChange={setLeaveUserId}
                  options={memberOptions}
                  optionFilterProp="label"
                  placeholder={t(
                    'projects.workingCalendarLeaveMemberPlaceholder',
                  )}
                  getPopupContainer={() => document.body}
                />
              </div>
              <DateRangeInput
                label={t('projects.workingCalendarLeaveRange')}
                valueFrom={leaveRange.from}
                valueTo={leaveRange.to}
                onChange={setLeaveRange}
              />
              <div className="space-y-1 lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('projects.workingCalendarLeaveNote')}
                </label>
                <input
                  value={leaveNote}
                  onChange={(event) => setLeaveNote(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder={t(
                    'projects.workingCalendarLeaveNotePlaceholder',
                  )}
                />
              </div>
              <div>
                <Button
                  type="button"
                  onClick={() => void handleAddLeave()}
                  disabled={
                    !leaveUserId ||
                    !leaveRange.from ||
                    !leaveRange.to ||
                    createLeave.isPending
                  }
                  isLoading={createLeave.isPending}
                >
                  {t('projects.workingCalendarAddLeave')}
                </Button>
              </div>
            </div>
          ) : null}

          <ul className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-100">
            {calendar.leaves.length === 0 ? (
              <li className="px-3 py-3 text-sm text-gray-500">
                {t('projects.workingCalendarNoLeaves')}
              </li>
            ) : (
              calendar.leaves.map((leave) => (
                <li
                  key={leave.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <div>
                    <span className="font-medium text-gray-800">
                      {leave.user?.name ?? leave.userId}
                    </span>
                    <span className="ms-2 text-gray-500">
                      {formatLocaleDate(leave.startDate, locale, {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {' — '}
                      {formatLocaleDate(leave.endDate, locale, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {leave.note ? (
                      <span className="ms-2 text-gray-400">({leave.note})</span>
                    ) : null}
                  </div>
                  {canEdit ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                      onClick={() => {
                        setActionError('');
                        void deleteLeave.mutateAsync(leave.id).catch((err) => {
                          setActionError(getApiErrorMessage(err));
                        });
                      }}
                    >
                      {t('common.delete')}
                    </button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
