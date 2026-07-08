import * as XLSX from 'xlsx';
import { normalizeTaskLabels } from '@/features/labels/types';
import {
  formatAssigneeNames,
  getPriorityStyles,
  type TaskChecklistItem,
} from '@/features/tasks/types';
import type { Locale } from '@/i18n/types';
import { createTranslator } from '@/i18n/utils';
import { getMessages } from '@/i18n/messages';
import { getIntlLocale } from '@/i18n/types';
import type { Board, BoardColumn, BoardTask } from '../types';

export type ExportableBoardTask = BoardTask & {
  createdAt?: string;
  updatedAt?: string;
  completeDate?: string | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
};

function formatDateTime(
  value: string | null | undefined,
  locale: Locale,
): string {
  if (!value) return '';

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function getColumnName(task: BoardTask, columns: BoardColumn[]): string {
  return (
    task.column?.name ??
    columns.find((column) => column.id === task.columnId)?.name ??
    ''
  );
}

function formatChecklistItems(items?: TaskChecklistItem[]): string {
  if (!items?.length) return '';

  return items
    .map((item) => `${item.isDone ? '[x]' : '[ ]'} ${item.title}`)
    .join('; ');
}

function formatChecklistProgress(items?: TaskChecklistItem[]): string {
  if (!items?.length) return '';

  const doneCount = items.filter((item) => item.isDone).length;
  return `${doneCount}/${items.length}`;
}

function sanitizeFilename(value: string): string {
  return value.replace(/[<>:"/\\|?*]/g, '').trim() || 'board';
}

const MAX_COLUMN_WIDTH = 60;
const MIN_COLUMN_WIDTH = 8;
const COLUMN_WIDTH_PADDING = 2;

function autoFitColumnWidths(
  rows: Record<string, string | number>[],
): XLSX.ColInfo[] {
  if (rows.length === 0) return [];

  const keys = Object.keys(rows[0]);

  return keys.map((key) => {
    const maxLen = Math.max(
      key.length,
      ...rows.map((row) => String(row[key] ?? '').length),
    );

    return {
      wch: Math.min(
        Math.max(maxLen + COLUMN_WIDTH_PADDING, MIN_COLUMN_WIDTH),
        MAX_COLUMN_WIDTH,
      ),
    };
  });
}

function applyWorksheetEnhancements(
  worksheet: XLSX.WorkSheet,
  rowCount: number,
  columnCount: number,
  locale: Locale,
): void {
  if (rowCount === 0 || columnCount === 0) return;

  const lastRow = rowCount;
  const lastCol = columnCount - 1;

  worksheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: lastRow, c: lastCol },
    }),
  };

  worksheet['!views'] = [
    {
      state: 'frozen',
      ySplit: 1,
      topLeftCell: 'A2',
      activeCell: 'A2',
      rightToLeft: locale === 'fa',
    },
  ];

  if (locale === 'fa') {
    worksheet['!rtl'] = true;
  }

  worksheet['!rows'] = [{ hpt: 22 }];
}

export function exportBoardTasksToExcel(
  tasks: ExportableBoardTask[],
  board: Board,
  columns: BoardColumn[],
  locale: Locale = 'en',
): void {
  const messages = getMessages(locale);
  const t = createTranslator(locale, messages);
  const priorityStyles = getPriorityStyles(t);
  const cols = {
    index: t('export.columns.index'),
    title: t('export.columns.title'),
    description: t('export.columns.description'),
    column: t('export.columns.column'),
    priority: t('export.columns.priority'),
    dueDate: t('export.columns.dueDate'),
    status: t('export.columns.status'),
    createdAt: t('export.columns.createdAt'),
    updatedAt: t('export.columns.updatedAt'),
    completedAt: t('export.columns.completedAt'),
    assignees: t('export.columns.assignees'),
    labels: t('export.columns.labels'),
    checklistProgress: t('export.columns.checklistProgress'),
    checklistItems: t('export.columns.checklistItems'),
    createdBy: t('export.columns.createdBy'),
  };

  const rows = tasks.map((task, index) => {
    const labels = normalizeTaskLabels(task.labels);

    return {
      [cols.index]: index + 1,
      [cols.title]: task.title,
      [cols.description]: task.description ?? '',
      [cols.column]: getColumnName(task, columns),
      [cols.priority]: priorityStyles[task.priority].label,
      [cols.dueDate]: task.dueDate ? formatDateTime(task.dueDate, locale) : '',
      [cols.status]: task.isCompleted
        ? t('export.statusCompleted')
        : t('export.statusNotCompleted'),
      [cols.createdAt]: formatDateTime(task.createdAt, locale),
      [cols.updatedAt]: formatDateTime(task.updatedAt, locale),
      [cols.completedAt]: task.completeDate
        ? formatDateTime(task.completeDate, locale)
        : '',
      [cols.assignees]: formatAssigneeNames(task),
      [cols.labels]: labels.map((label) => label.name).join(', '),
      [cols.checklistProgress]: formatChecklistProgress(task.checklistItems),
      [cols.checklistItems]: formatChecklistItems(task.checklistItems),
      [cols.createdBy]: task.createdBy?.name ?? '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const columnCount = rows.length > 0 ? Object.keys(rows[0]).length : 0;

  worksheet['!cols'] = autoFitColumnWidths(rows);
  applyWorksheetEnhancements(worksheet, rows.length, columnCount, locale);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, t('export.sheetName'));

  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `${sanitizeFilename(board.name)}-tasks-${dateStamp}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
