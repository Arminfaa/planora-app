import type { BoardTask } from '../types';
import { getTaskAssignees } from '@/features/tasks/types';
import type { Locale } from '@/i18n/types';
import type { Translator } from '@/i18n/utils';
import { formatLocaleDate } from '@/lib/jalali-dates';

function formatReportDate(
  value: string | Date | null | undefined,
  locale: Locale,
): string {
  if (!value) return '';
  return formatLocaleDate(value, locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function toDayKey(value: string): number | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildHeaderDateLabel(
  tasks: BoardTask[],
  locale: Locale,
  fallback: string,
): string {
  const dates = tasks
    .map((task) => task.completeDate)
    .filter((value): value is string => Boolean(value))
    .map((value) => ({ value, key: toDayKey(value) }))
    .filter(
      (entry): entry is { value: string; key: number } => entry.key !== null,
    )
    .sort((a, b) => a.key - b.key);

  if (dates.length === 0) {
    return formatReportDate(new Date(), locale) || fallback;
  }

  const first = dates[0];
  const last = dates[dates.length - 1];
  if (first.key === last.key) {
    return formatReportDate(first.value, locale);
  }

  return `${formatReportDate(first.value, locale)} — ${formatReportDate(last.value, locale)}`;
}

function joinNames(names: string[], locale: Locale): string {
  return names.join(locale === 'fa' ? '، ' : ', ');
}

function buildHeaderPeopleLabel(
  tasks: BoardTask[],
  locale: Locale,
  fallback: string,
): string {
  const names = new Set<string>();
  for (const task of tasks) {
    for (const assignee of getTaskAssignees(task)) {
      if (assignee.name.trim()) {
        names.add(assignee.name.trim());
      }
    }
  }

  if (names.size === 0) return fallback;
  return joinNames([...names], locale);
}

function formatChecklistLines(task: BoardTask, t: Translator): string[] {
  const items = task.checklistItems ?? [];
  if (items.length === 0) {
    return [`${t('board.workReport.checklist')}: ${t('common.emDash')}`];
  }

  const lines = [`${t('board.workReport.checklist')}:`];
  for (const item of items) {
    const mark = item.isDone ? '✓' : '○';
    lines.push(`${mark} ${item.title}`);
  }
  return lines;
}

function formatTaskBlock(
  task: BoardTask,
  locale: Locale,
  t: Translator,
): string {
  const description = task.description?.trim() || t('common.emDash');
  const completedOn = task.completeDate
    ? formatReportDate(task.completeDate, locale)
    : t('common.emDash');
  const assignees = getTaskAssignees(task)
    .map((assignee) => assignee.name.trim())
    .filter(Boolean);
  const byPeople =
    assignees.length > 0 ? joinNames(assignees, locale) : t('common.emDash');

  return [
    task.title.trim() || t('common.emDash'),
    description,
    '',
    ...formatChecklistLines(task, t),
    '',
    `${t('board.workReport.completedOn')}: ${completedOn}`,
    `${t('board.workReport.by')}: ${byPeople}`,
  ].join('\n');
}

export function buildWorkReportText(
  tasks: BoardTask[],
  locale: Locale,
  t: Translator,
): string {
  if (tasks.length === 0) return '';

  const headerDate = buildHeaderDateLabel(tasks, locale, t('common.emDash'));
  const headerPeople = buildHeaderPeopleLabel(
    tasks,
    locale,
    t('common.emDash'),
  );
  const header = t('board.workReport.header', {
    date: headerDate,
    people: headerPeople,
  });

  const blocks = tasks.map((task) => formatTaskBlock(task, locale, t));
  return [header, '', blocks.join('\n\n────────────────\n\n')].join('\n');
}
