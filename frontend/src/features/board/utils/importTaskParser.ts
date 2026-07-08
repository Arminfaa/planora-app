import dayjs from 'dayjs';
import jalaliday from 'jalaliday/dayjs';
import type { BoardColumn } from '../types';
import type { ProjectMember } from '@/features/projects/types';
import type { ProjectLabel } from '@/features/labels/types';
import type { CreateTaskInput, TaskPriority } from '@/features/tasks/types';
import { PRIORITY_OPTIONS } from '@/features/tasks/types';
import type { Translator } from '@/i18n/utils';
import {
  GREGORIAN_API_DATE_FORMAT,
  JALALI_DISPLAY_DATE_FORMAT,
} from '@/lib/jalali-dates';

dayjs.extend(jalaliday);

export type ImportFieldKey =
  | 'title'
  | 'description'
  | 'column'
  | 'priority'
  | 'dueDate'
  | 'startDate'
  | 'status'
  | 'assignees'
  | 'labels'
  | 'checklistItems';

export const IMPORT_FIELD_KEYS: ImportFieldKey[] = [
  'title',
  'description',
  'column',
  'priority',
  'dueDate',
  'startDate',
  'status',
  'assignees',
  'labels',
  'checklistItems',
];

export type ColumnMapping = Partial<Record<ImportFieldKey, string>>;

export type ColumnValueMapping = Record<string, string>;
export type StatusValueMapping = Record<string, 'completed' | 'not_completed'>;

export interface ImportFieldDefinition {
  key: ImportFieldKey;
  label: string;
  required: boolean;
  hint?: string;
}

export interface ParsedChecklistItem {
  title: string;
  isDone: boolean;
}

export interface ParsedImportRow {
  rowIndex: number;
  title: string;
  description?: string;
  columnId?: string;
  columnName?: string;
  priority?: TaskPriority;
  dueDate?: string;
  startDate?: string;
  isCompleted?: boolean;
  assigneeIds?: string[];
  assigneeNames?: string[];
  labelNames?: string[];
  checklistItems?: ParsedChecklistItem[];
  errors: string[];
  warnings: string[];
}

export interface ImportPreviewResult {
  rows: ParsedImportRow[];
  validCount: number;
  errorCount: number;
  warningCount: number;
}

const IGNORE_COLUMN_VALUE = '__ignore__';
const UNSPECIFIED_COLUMN_VALUE = '__unspecified__';

const COMPLETED_STATUS_HINTS = new Set([
  'completed',
  'complete',
  'done',
  'yes',
  'true',
  '1',
  'تکمیل شده',
  'انجام شده',
  'انجام شد',
  'تمام شده',
  'بله',
]);

const NOT_COMPLETED_STATUS_HINTS = new Set([
  'not completed',
  'not done',
  'incomplete',
  'no',
  'false',
  '0',
  'تکمیل نشده',
  'انجام نشده',
  'نشده',
  'خیر',
]);

export function getImportFieldDefinitions(
  t: Translator,
): ImportFieldDefinition[] {
  return [
    {
      key: 'title',
      label: t('export.columns.title'),
      required: true,
    },
    {
      key: 'description',
      label: t('export.columns.description'),
      required: false,
    },
    {
      key: 'column',
      label: t('export.columns.column'),
      required: false,
      hint: t('import.columnFieldHint'),
    },
    {
      key: 'priority',
      label: t('export.columns.priority'),
      required: false,
    },
    {
      key: 'dueDate',
      label: t('export.columns.dueDate'),
      required: false,
    },
    {
      key: 'startDate',
      label: t('tasks.startDate'),
      required: false,
    },
    {
      key: 'status',
      label: t('export.columns.status'),
      required: false,
      hint: t('import.statusFieldHint'),
    },
    {
      key: 'assignees',
      label: t('export.columns.assignees'),
      required: false,
    },
    {
      key: 'labels',
      label: t('export.columns.labels'),
      required: false,
    },
    {
      key: 'checklistItems',
      label: t('export.columns.checklistItems'),
      required: false,
    },
  ];
}

export function getUniqueColumnValues(
  rows: string[][],
  headers: string[],
  excelColumn: string,
): string[] {
  const columnIndex = headers.indexOf(excelColumn);
  if (columnIndex < 0) return [];

  const values = new Set<string>();
  for (const row of rows) {
    values.add(row[columnIndex]?.trim() ?? '');
  }

  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

export function buildDefaultColumnValueMapping(
  uniqueValues: string[],
  columns: BoardColumn[],
): ColumnValueMapping {
  const mapping: ColumnValueMapping = {};

  for (const value of uniqueValues) {
    if (!value) {
      mapping[value] = UNSPECIFIED_COLUMN_VALUE;
      continue;
    }

    const matched = columns.find(
      (column) => column.name.trim().toLowerCase() === value.toLowerCase(),
    );

    mapping[value] = matched?.id ?? UNSPECIFIED_COLUMN_VALUE;
  }

  if (!uniqueValues.includes('')) {
    mapping[''] = UNSPECIFIED_COLUMN_VALUE;
  }

  return mapping;
}

export function buildDefaultStatusValueMapping(
  uniqueValues: string[],
): StatusValueMapping {
  const mapping: StatusValueMapping = {};

  for (const value of uniqueValues) {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      mapping[value] = 'not_completed';
      continue;
    }

    if (COMPLETED_STATUS_HINTS.has(normalized)) {
      mapping[value] = 'completed';
      continue;
    }

    if (NOT_COMPLETED_STATUS_HINTS.has(normalized)) {
      mapping[value] = 'not_completed';
      continue;
    }

    mapping[value] = 'not_completed';
  }

  if (!uniqueValues.includes('')) {
    mapping[''] = 'not_completed';
  }

  return mapping;
}

export function getColumnValueMappingOptions(
  columns: BoardColumn[],
  t: Translator,
): Array<{ value: string; label: string }> {
  return [
    { value: UNSPECIFIED_COLUMN_VALUE, label: t('board.unspecifiedColumn') },
    ...columns.map((column) => ({
      value: column.id,
      label: column.name,
    })),
  ];
}

export function getStatusValueMappingOptions(
  t: Translator,
): Array<{ value: string; label: string }> {
  return [
    { value: 'completed', label: t('export.statusCompleted') },
    { value: 'not_completed', label: t('export.statusNotCompleted') },
  ];
}

function getCellValue(
  row: string[],
  headers: string[],
  excelColumn: string | undefined,
): string {
  if (!excelColumn) return '';
  const index = headers.indexOf(excelColumn);
  if (index < 0) return '';
  return row[index]?.trim() ?? '';
}

function parseImportDate(
  value: string,
  t: Translator,
): { date?: string; warning?: string } {
  const trimmed = value.trim();
  if (!trimmed) return {};

  const iso = dayjs(trimmed, GREGORIAN_API_DATE_FORMAT, true);
  if (iso.isValid()) {
    return { date: iso.format(GREGORIAN_API_DATE_FORMAT) };
  }

  const jalali = dayjs(trimmed, JALALI_DISPLAY_DATE_FORMAT, true).calendar(
    'jalali',
  );
  if (jalali.isValid()) {
    return {
      date: jalali.calendar('gregory').format(GREGORIAN_API_DATE_FORMAT),
    };
  }

  const slashGregorian = dayjs(trimmed, 'YYYY/MM/DD', true);
  if (slashGregorian.isValid()) {
    return { date: slashGregorian.format(GREGORIAN_API_DATE_FORMAT) };
  }

  const flex = dayjs(trimmed);
  if (flex.isValid()) {
    return { date: flex.format(GREGORIAN_API_DATE_FORMAT) };
  }

  return { warning: t('import.invalidDate', { value: trimmed }) };
}

function parsePriority(
  value: string,
  priorityLabels: Record<TaskPriority, string>,
  t: Translator,
): { priority?: TaskPriority; warning?: string } {
  const trimmed = value.trim();
  if (!trimmed) return {};

  const upper = trimmed.toUpperCase();
  if (PRIORITY_OPTIONS.includes(upper as TaskPriority)) {
    return { priority: upper as TaskPriority };
  }

  for (const option of PRIORITY_OPTIONS) {
    if (priorityLabels[option].toLowerCase() === trimmed.toLowerCase()) {
      return { priority: option };
    }
  }

  return { warning: t('import.invalidPriority', { value: trimmed }) };
}

function parseAssignees(
  value: string,
  members: ProjectMember[],
  t: Translator,
): {
  assigneeIds?: string[];
  assigneeNames?: string[];
  warnings: string[];
} {
  const trimmed = value.trim();
  if (!trimmed) return { warnings: [] };

  const names = trimmed
    .split(/[,;،]/)
    .map((part) => part.trim())
    .filter(Boolean);

  const assigneeIds: string[] = [];
  const assigneeNames: string[] = [];
  const warnings: string[] = [];

  for (const name of names) {
    const member = members.find(
      (item) =>
        item.name.trim().toLowerCase() === name.toLowerCase() ||
        item.email.trim().toLowerCase() === name.toLowerCase(),
    );

    if (member) {
      assigneeIds.push(member.id);
      assigneeNames.push(member.name);
    } else {
      warnings.push(t('import.assigneeNotFound', { name }));
    }
  }

  return {
    assigneeIds: assigneeIds.length ? assigneeIds : undefined,
    assigneeNames: assigneeNames.length ? assigneeNames : undefined,
    warnings,
  };
}

function parseLabels(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  return trimmed
    .split(/[,;،]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseChecklistItems(value: string): ParsedChecklistItem[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  return trimmed
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const doneMatch = part.match(/^\[x\]\s*(.+)$/i);
      if (doneMatch) {
        return { title: doneMatch[1].trim(), isDone: true };
      }

      const todoMatch = part.match(/^\[\s*\]\s*(.+)$/);
      if (todoMatch) {
        return { title: todoMatch[1].trim(), isDone: false };
      }

      return { title: part, isDone: false };
    })
    .filter((item) => item.title.length > 0);
}

function resolveColumnFromValue(
  rawValue: string,
  columns: BoardColumn[],
  columnValueMapping: ColumnValueMapping,
): { columnId?: string; columnName?: string; warning?: string } {
  const mapped = columnValueMapping[rawValue] ?? UNSPECIFIED_COLUMN_VALUE;

  if (mapped === UNSPECIFIED_COLUMN_VALUE) {
    return {};
  }

  const column = columns.find((item) => item.id === mapped);
  if (!column) return {};

  return { columnId: column.id, columnName: column.name };
}

export function buildImportPreview({
  rows,
  headers,
  columnMapping,
  columnValueMapping,
  statusValueMapping,
  columns,
  members,
  priorityLabels,
  t,
}: {
  rows: string[][];
  headers: string[];
  columnMapping: ColumnMapping;
  columnValueMapping: ColumnValueMapping;
  statusValueMapping: StatusValueMapping;
  columns: BoardColumn[];
  members: ProjectMember[];
  priorityLabels: Record<TaskPriority, string>;
  t: Translator;
}): ImportPreviewResult {
  const previewRows: ParsedImportRow[] = rows.map((row, index) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const title = getCellValue(row, headers, columnMapping.title);
    if (!title) {
      errors.push(t('import.missingTitle'));
    }

    const descriptionRaw = getCellValue(row, headers, columnMapping.description);
    const description = descriptionRaw || undefined;

    let columnId: string | undefined;
    let columnName: string | undefined;

    if (columnMapping.column) {
      const rawColumnValue = getCellValue(row, headers, columnMapping.column);
      const resolved = resolveColumnFromValue(
        rawColumnValue,
        columns,
        columnValueMapping,
      );
      columnId = resolved.columnId;
      columnName = resolved.columnName;
      if (resolved.warning) warnings.push(resolved.warning);
    }

    let priority: TaskPriority | undefined;
    if (columnMapping.priority) {
      const rawPriority = getCellValue(row, headers, columnMapping.priority);
      const parsedPriority = parsePriority(rawPriority, priorityLabels, t);
      priority = parsedPriority.priority;
      if (parsedPriority.warning) warnings.push(parsedPriority.warning);
    }

    let dueDate: string | undefined;
    if (columnMapping.dueDate) {
      const rawDueDate = getCellValue(row, headers, columnMapping.dueDate);
      const parsedDueDate = parseImportDate(rawDueDate, t);
      dueDate = parsedDueDate.date;
      if (parsedDueDate.warning) warnings.push(parsedDueDate.warning);
    }

    let startDate: string | undefined;
    if (columnMapping.startDate) {
      const rawStartDate = getCellValue(row, headers, columnMapping.startDate);
      const parsedStartDate = parseImportDate(rawStartDate, t);
      startDate = parsedStartDate.date;
      if (parsedStartDate.warning) warnings.push(parsedStartDate.warning);
    }

    let isCompleted: boolean | undefined;
    if (columnMapping.status) {
      const rawStatus = getCellValue(row, headers, columnMapping.status);
      const mappedStatus =
        statusValueMapping[rawStatus] ?? statusValueMapping[''] ?? 'not_completed';
      isCompleted = mappedStatus === 'completed';
    }

    let assigneeIds: string[] | undefined;
    let assigneeNames: string[] | undefined;
    if (columnMapping.assignees) {
      const rawAssignees = getCellValue(row, headers, columnMapping.assignees);
      const parsedAssignees = parseAssignees(rawAssignees, members, t);
      assigneeIds = parsedAssignees.assigneeIds;
      assigneeNames = parsedAssignees.assigneeNames;
      warnings.push(...parsedAssignees.warnings);
    }

    let labelNames: string[] | undefined;
    if (columnMapping.labels) {
      const rawLabels = getCellValue(row, headers, columnMapping.labels);
      const parsedLabels = parseLabels(rawLabels);
      labelNames = parsedLabels.length ? parsedLabels : undefined;
    }

    let checklistItems: ParsedChecklistItem[] | undefined;
    if (columnMapping.checklistItems) {
      const rawChecklist = getCellValue(
        row,
        headers,
        columnMapping.checklistItems,
      );
      const parsedChecklist = parseChecklistItems(rawChecklist);
      checklistItems = parsedChecklist.length ? parsedChecklist : undefined;
    }

    if (
      startDate &&
      dueDate &&
      dayjs(startDate).isAfter(dayjs(dueDate), 'day')
    ) {
      warnings.push(t('import.startAfterDue'));
    }

    return {
      rowIndex: index + 1,
      title,
      description,
      columnId,
      columnName,
      priority,
      dueDate,
      startDate,
      isCompleted,
      assigneeIds,
      assigneeNames,
      labelNames,
      checklistItems,
      errors,
      warnings,
    };
  });

  const validCount = previewRows.filter((row) => row.errors.length === 0).length;
  const errorCount = previewRows.length - validCount;
  const warningCount = previewRows.reduce(
    (count, row) => count + row.warnings.length,
    0,
  );

  return { rows: previewRows, validCount, errorCount, warningCount };
}

export function toCreateTaskInput(row: ParsedImportRow): CreateTaskInput {
  const input: CreateTaskInput = {
    title: row.title.trim(),
  };

  if (row.description) input.description = row.description;
  if (row.priority) input.priority = row.priority;
  if (row.dueDate) input.dueDate = row.dueDate;
  if (row.startDate) input.startDate = row.startDate;
  if (row.assigneeIds?.length) input.assigneeIds = row.assigneeIds;
  if (row.columnId) input.columnId = row.columnId;

  return input;
}

export { IGNORE_COLUMN_VALUE, UNSPECIFIED_COLUMN_VALUE };
