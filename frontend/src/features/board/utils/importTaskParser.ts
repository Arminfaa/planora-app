import dayjs from 'dayjs';
import jalaliday from 'jalaliday/dayjs';
import type { ProjectMember } from '@/features/projects/types';
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
  'priority',
  'dueDate',
  'startDate',
  'status',
  'assignees',
  'labels',
  'checklistItems',
];

/** Maps task fields to Excel column index (0-based). */
export type ColumnMapping = Partial<Record<ImportFieldKey, number>>;

export type StatusValueMapping = Record<string, 'completed' | 'not_completed'>;

/** Maps Excel assignee tokens to project member IDs. */
export type AssigneeValueMapping = Record<string, string>;

export const IGNORE_ASSIGNEE_VALUE = '__ignore__';

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

export const IGNORE_COLUMN_VALUE = -1;

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
  columnIndex: number,
): string[] {
  if (columnIndex < 0) return [];

  const values = new Set<string>();
  for (const row of rows) {
    values.add(row[columnIndex]?.trim() ?? '');
  }

  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

export function getUniqueAssigneeTokens(
  rows: string[][],
  columnIndex: number,
): string[] {
  if (columnIndex < 0) return [];

  const values = new Set<string>();

  for (const row of rows) {
    const raw = row[columnIndex]?.trim() ?? '';
    if (!raw) {
      values.add('');
      continue;
    }

    raw.split(/[,;،]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((token) => values.add(token));
  }

  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

export function buildDefaultAssigneeValueMapping(
  uniqueValues: string[],
  members: ProjectMember[],
): AssigneeValueMapping {
  const mapping: AssigneeValueMapping = {};

  for (const value of uniqueValues) {
    if (!value.trim()) {
      mapping[value] = IGNORE_ASSIGNEE_VALUE;
      continue;
    }

    const matched = findMemberByToken(value, members);
    mapping[value] = matched?.id ?? IGNORE_ASSIGNEE_VALUE;
  }

  if (!uniqueValues.includes('')) {
    mapping[''] = IGNORE_ASSIGNEE_VALUE;
  }

  return mapping;
}

export function getAssigneeValueMappingOptions(
  members: ProjectMember[],
  t: Translator,
): Array<{ value: string; label: string }> {
  return [
    { value: IGNORE_ASSIGNEE_VALUE, label: t('import.assigneeIgnore') },
    ...members.map((member) => ({
      value: member.id,
      label: member.email ? `${member.name} (${member.email})` : member.name,
    })),
  ];
}

function findMemberByToken(
  token: string,
  members: ProjectMember[],
): ProjectMember | undefined {
  const normalized = token.trim().toLowerCase();
  if (!normalized) return undefined;

  const exact = members.find(
    (member) =>
      member.name.trim().toLowerCase() === normalized ||
      member.email.trim().toLowerCase() === normalized,
  );
  if (exact) return exact;

  return members.find((member) => {
    const name = member.name.trim().toLowerCase();
    if (name.includes(normalized) || normalized.includes(name)) {
      return true;
    }

    return name
      .split(/\s+/)
      .some((part) => part === normalized || part.includes(normalized));
  });
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

export function getStatusValueMappingOptions(
  t: Translator,
): Array<{ value: string; label: string }> {
  return [
    { value: 'completed', label: t('export.statusCompleted') },
    { value: 'not_completed', label: t('export.statusNotCompleted') },
  ];
}

function getCellValue(row: string[], columnIndex: number | undefined): string {
  if (columnIndex == null || columnIndex < 0) return '';
  return row[columnIndex]?.trim() ?? '';
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

  const slashMatch = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (slashMatch) {
    const year = Number(slashMatch[1]);

    if (year >= 1200 && year < 1700) {
      const jalali = dayjs(trimmed, JALALI_DISPLAY_DATE_FORMAT, true).calendar(
        'jalali',
      );
      if (jalali.isValid()) {
        return {
          date: jalali.calendar('gregory').format(GREGORIAN_API_DATE_FORMAT),
        };
      }
    }

    const gregorian = dayjs(trimmed, 'YYYY/MM/DD', true).calendar('gregory');
    if (gregorian.isValid()) {
      return { date: gregorian.format(GREGORIAN_API_DATE_FORMAT) };
    }

    const gregorianDash = dayjs(trimmed, 'YYYY-MM-DD', true).calendar('gregory');
    if (gregorianDash.isValid()) {
      return { date: gregorianDash.format(GREGORIAN_API_DATE_FORMAT) };
    }
  }

  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const year = Number(dmyMatch[3]);
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const normalized = `${year}/${month}/${day}`;

    if (year >= 1200 && year < 1700) {
      const jalali = dayjs(normalized, JALALI_DISPLAY_DATE_FORMAT, true).calendar(
        'jalali',
      );
      if (jalali.isValid()) {
        return {
          date: jalali.calendar('gregory').format(GREGORIAN_API_DATE_FORMAT),
        };
      }
    }

    const gregorian = dayjs(
      `${year}-${month}-${day}`,
      GREGORIAN_API_DATE_FORMAT,
      true,
    );
    if (gregorian.isValid()) {
      return { date: gregorian.format(GREGORIAN_API_DATE_FORMAT) };
    }
  }

  const jalali = dayjs(trimmed, JALALI_DISPLAY_DATE_FORMAT, true).calendar(
    'jalali',
  );
  if (jalali.isValid()) {
    return {
      date: jalali.calendar('gregory').format(GREGORIAN_API_DATE_FORMAT),
    };
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
  assigneeValueMapping: AssigneeValueMapping,
  t: Translator,
): {
  assigneeIds?: string[];
  assigneeNames?: string[];
  warnings: string[];
} {
  const trimmed = value.trim();
  if (!trimmed) return { warnings: [] };

  const tokens = trimmed
    .split(/[,;،]/)
    .map((part) => part.trim())
    .filter(Boolean);

  const assigneeIds: string[] = [];
  const assigneeNames: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();

  for (const token of tokens) {
    const mappedMemberId =
      assigneeValueMapping[token] ??
      assigneeValueMapping[''] ??
      IGNORE_ASSIGNEE_VALUE;

    if (mappedMemberId === IGNORE_ASSIGNEE_VALUE) {
      continue;
    }

    const member = members.find((item) => item.id === mappedMemberId);
    if (!member) {
      warnings.push(t('import.assigneeNotFound', { name: token }));
      continue;
    }

    if (!seenIds.has(member.id)) {
      seenIds.add(member.id);
      assigneeIds.push(member.id);
      assigneeNames.push(member.name);
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

export function buildImportPreview({
  rows,
  columnMapping,
  statusValueMapping,
  assigneeValueMapping,
  members,
  priorityLabels,
  t,
}: {
  rows: string[][];
  columnMapping: ColumnMapping;
  statusValueMapping: StatusValueMapping;
  assigneeValueMapping: AssigneeValueMapping;
  members: ProjectMember[];
  priorityLabels: Record<TaskPriority, string>;
  t: Translator;
}): ImportPreviewResult {
  const previewRows: ParsedImportRow[] = rows.map((row, index) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const title = getCellValue(row, columnMapping.title);
    if (!title) {
      errors.push(t('import.missingTitle'));
    }

    const descriptionRaw = getCellValue(row, columnMapping.description);
    const description = descriptionRaw || undefined;

    let priority: TaskPriority | undefined;
    if (columnMapping.priority != null) {
      const rawPriority = getCellValue(row, columnMapping.priority);
      const parsedPriority = parsePriority(rawPriority, priorityLabels, t);
      priority = parsedPriority.priority;
      if (parsedPriority.warning) warnings.push(parsedPriority.warning);
    }

    let dueDate: string | undefined;
    if (columnMapping.dueDate != null) {
      const rawDueDate = getCellValue(row, columnMapping.dueDate);
      const parsedDueDate = parseImportDate(rawDueDate, t);
      dueDate = parsedDueDate.date;
      if (parsedDueDate.warning) warnings.push(parsedDueDate.warning);
    }

    let startDate: string | undefined;
    if (columnMapping.startDate != null) {
      const rawStartDate = getCellValue(row, columnMapping.startDate);
      const parsedStartDate = parseImportDate(rawStartDate, t);
      startDate = parsedStartDate.date;
      if (parsedStartDate.warning) warnings.push(parsedStartDate.warning);
    }

    let isCompleted: boolean | undefined;
    if (columnMapping.status != null) {
      const rawStatus = getCellValue(row, columnMapping.status);
      const mappedStatus =
        statusValueMapping[rawStatus] ?? statusValueMapping[''] ?? 'not_completed';
      isCompleted = mappedStatus === 'completed';
    }

    let assigneeIds: string[] | undefined;
    let assigneeNames: string[] | undefined;
    if (columnMapping.assignees != null) {
      const rawAssignees = getCellValue(row, columnMapping.assignees);
      const parsedAssignees = parseAssignees(
        rawAssignees,
        members,
        assigneeValueMapping,
        t,
      );
      assigneeIds = parsedAssignees.assigneeIds;
      assigneeNames = parsedAssignees.assigneeNames;
      warnings.push(...parsedAssignees.warnings);
    }

    let labelNames: string[] | undefined;
    if (columnMapping.labels != null) {
      const rawLabels = getCellValue(row, columnMapping.labels);
      const parsedLabels = parseLabels(rawLabels);
      labelNames = parsedLabels.length ? parsedLabels : undefined;
    }

    let checklistItems: ParsedChecklistItem[] | undefined;
    if (columnMapping.checklistItems != null) {
      const rawChecklist = getCellValue(row, columnMapping.checklistItems);
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

  return input;
}
