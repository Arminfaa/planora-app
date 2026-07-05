import * as XLSX from 'xlsx';
import { normalizeTaskLabels } from '@/features/labels/types';
import {
  formatAssigneeNames,
  priorityStyles,
  type TaskChecklistItem,
} from '@/features/tasks/types';
import type { Board, BoardColumn, BoardTask } from '../types';

export type ExportableBoardTask = BoardTask & {
  createdAt?: string;
  updatedAt?: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '';

  return new Intl.DateTimeFormat('en-US', {
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
    },
  ];

  worksheet['!rows'] = [{ hpt: 22 }];
}

export function exportBoardTasksToExcel(
  tasks: ExportableBoardTask[],
  board: Board,
  columns: BoardColumn[],
): void {
  const rows = tasks.map((task, index) => {
    const labels = normalizeTaskLabels(task.labels);

    return {
      '#': index + 1,
      Title: task.title,
      Description: task.description ?? '',
      Column: getColumnName(task, columns),
      Priority: priorityStyles[task.priority].label,
      'Due Date': task.dueDate ? formatDateTime(task.dueDate) : '',
      Status: task.isCompleted ? 'Completed' : 'Not Completed',
      'Created At': formatDateTime(task.createdAt),
      'Updated At': formatDateTime(task.updatedAt),
      'Completed At':
        task.isCompleted && task.updatedAt
          ? formatDateTime(task.updatedAt)
          : '',
      Assignees: formatAssigneeNames(task),
      Labels: labels.map((label) => label.name).join(', '),
      'Checklist Progress': formatChecklistProgress(task.checklistItems),
      'Checklist Items': formatChecklistItems(task.checklistItems),
      'Created By': task.createdBy?.name ?? '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const columnCount = rows.length > 0 ? Object.keys(rows[0]).length : 0;

  worksheet['!cols'] = autoFitColumnWidths(rows);
  applyWorksheetEnhancements(worksheet, rows.length, columnCount);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');

  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `${sanitizeFilename(board.name)}-tasks-${dateStamp}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
