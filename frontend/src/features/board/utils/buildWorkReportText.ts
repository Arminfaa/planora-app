import type { BoardTask } from '../types';
import { getTaskAssignees } from '@/features/tasks/types';
import type { Locale } from '@/i18n/types';
import type { Translator } from '@/i18n/utils';
import { formatLocaleDate } from '@/lib/jalali-dates';

const TASK_SEPARATOR = '························';
const SECTION_RULE = '────────────────────────';

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

function joinNames(names: string[], locale: Locale): string {
  return names.join(locale === 'fa' ? '، ' : ', ');
}

function buildHeaderDateLabel(tasks: BoardTask[], locale: Locale): string {
  const dates = tasks
    .map((task) => task.completeDate)
    .filter((value): value is string => Boolean(value))
    .map((value) => ({ value, key: toDayKey(value) }))
    .filter(
      (entry): entry is { value: string; key: number } => entry.key !== null,
    )
    .sort((a, b) => a.key - b.key);

  if (dates.length === 0) {
    return formatReportDate(new Date(), locale);
  }

  const first = dates[0];
  const last = dates[dates.length - 1];
  if (first.key === last.key) {
    return formatReportDate(first.value, locale);
  }

  return `${formatReportDate(first.value, locale)} — ${formatReportDate(last.value, locale)}`;
}

function collectPeople(tasks: BoardTask[]): string[] {
  const names = new Set<string>();
  for (const task of tasks) {
    for (const assignee of getTaskAssignees(task)) {
      if (assignee.name.trim()) {
        names.add(assignee.name.trim());
      }
    }
  }
  return [...names];
}

function appendChecklistLines(
  lines: string[],
  task: BoardTask,
  t: Translator,
): void {
  const items = task.checklistItems ?? [];
  if (items.length === 0) return;

  const doneCount = items.filter((item) => item.isDone).length;
  lines.push(
    t('board.workReport.checklistProgress', {
      done: doneCount,
      total: items.length,
    }),
  );
  for (const item of items) {
    const mark = item.isDone ? '✓' : '•';
    lines.push(`${mark} ${item.title.trim()}`);
  }
}

function formatTaskBlock(
  task: BoardTask,
  index: number,
  locale: Locale,
  t: Translator,
): string {
  const title = task.title.trim() || t('board.workReport.untitled');
  const assignees = getTaskAssignees(task)
    .map((assignee) => assignee.name.trim())
    .filter(Boolean);

  const lines: string[] = [`${index + 1}) ${title}`];
  appendChecklistLines(lines, task, t);

  if (task.completeDate) {
    lines.push(
      `${t('board.workReport.completedOn')}: ${formatReportDate(task.completeDate, locale)}`,
    );
  }
  if (assignees.length > 0) {
    lines.push(`${t('board.workReport.by')}: ${joinNames(assignees, locale)}`);
  }

  return lines.join('\n');
}

export function buildWorkReportText(
  tasks: BoardTask[],
  locale: Locale,
  t: Translator,
): string {
  if (tasks.length === 0) return '';

  const dateLabel = buildHeaderDateLabel(tasks, locale);
  const people = collectPeople(tasks);
  const peopleLabel =
    people.length > 0
      ? joinNames(people, locale)
      : t('board.workReport.teamFallback');

  const header = [
    t('board.workReport.banner'),
    SECTION_RULE,
    t('board.workReport.periodLine', { date: dateLabel }),
    t('board.workReport.teamLine', { people: peopleLabel }),
    t('board.workReport.countLine', { count: tasks.length }),
    SECTION_RULE,
  ].join('\n');

  const body = tasks
    .map((task, index) => formatTaskBlock(task, index, locale, t))
    .join(`\n${TASK_SEPARATOR}\n`);

  const footer = [SECTION_RULE, t('board.workReport.footer')].join('\n');

  return [header, body, footer].join('\n');
}
