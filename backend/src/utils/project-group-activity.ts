import type { UpdateTaskInput } from '../validators/task.validator';

export type ActivityChange = {
  field: string;
  label: string;
  from?: string | null;
  to?: string | null;
};

const FIELD_LABELS: Record<string, string> = {
  title: 'title',
  description: 'description',
  priority: 'priority',
  dueDate: 'due date',
  startDate: 'start date',
  assigneeIds: 'assignees',
  columnId: 'column',
  position: 'position',
  isCompleted: 'completion',
};

function formatAssignees(task: {
  assigneeIds: string[];
  assignees?: Array<{ name: string }>;
}): string | null {
  if (task.assignees?.length) {
    return task.assignees.map((assignee) => assignee.name).join(', ');
  }
  if (task.assigneeIds.length > 0) {
    return `${task.assigneeIds.length} member(s)`;
  }
  return 'none';
}

function formatValue(field: string, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (field === 'dueDate' || field === 'startDate') {
    return new Date(value as string | Date).toLocaleDateString();
  }
  if (field === 'assigneeIds' && Array.isArray(value)) {
    return value.length > 0 ? `${value.length} member(s)` : 'none';
  }
  if (field === 'isCompleted') {
    return value ? 'Completed' : 'Incomplete';
  }
  return String(value);
}

export function buildTaskActivityChanges(
  existing: {
    title: string;
    description?: string | null;
    priority: string;
    dueDate?: Date | null;
    startDate?: Date | null;
    assigneeIds: string[];
    assignees?: Array<{ name: string }>;
    columnId: string;
    position: number;
    isCompleted: boolean;
  },
  input: UpdateTaskInput,
  updated: {
    title: string;
    description?: string | null;
    priority: string;
    dueDate?: Date | null;
    startDate?: Date | null;
    assigneeIds: string[];
    assignees?: Array<{ name: string }>;
    columnId: string;
    isCompleted: boolean;
  },
): ActivityChange[] {
  const changes: ActivityChange[] = [];
  const fields: Array<keyof UpdateTaskInput> = [
    'title',
    'description',
    'priority',
    'startDate',
    'dueDate',
    'assigneeIds',
    'columnId',
    'isCompleted',
  ];

  for (const field of fields) {
    if (input[field] === undefined) continue;

    const from =
      field === 'assigneeIds'
        ? formatAssignees(existing)
        : formatValue(field, existing[field as keyof typeof existing]);
    const to =
      field === 'assigneeIds'
        ? formatAssignees(updated)
        : formatValue(field, updated[field as keyof typeof updated]);

    if (from === to) continue;

    changes.push({
      field,
      label: FIELD_LABELS[field] ?? field,
      from,
      to,
    });
  }

  if (
    input.position !== undefined &&
    input.position !== existing.position &&
    input.columnId === undefined
  ) {
    changes.push({
      field: 'position',
      label: FIELD_LABELS.position,
      from: String(existing.position),
      to: String(input.position),
    });
  }

  return changes;
}

export function buildChecklistCreatedChange(title: string): ActivityChange {
  return {
    field: 'checklist',
    label: 'checklist item',
    to: `Added "${title}"`,
  };
}

export function buildChecklistDeletedChange(title: string): ActivityChange {
  return {
    field: 'checklist',
    label: 'checklist item',
    to: `Removed "${title}"`,
  };
}

export function buildChecklistActivityChanges(
  existing: { title: string; isDone: boolean; position: number },
  input: { title?: string; isDone?: boolean; position?: number },
  updated: { title: string; isDone: boolean; position: number },
): ActivityChange[] {
  const changes: ActivityChange[] = [];

  if (input.title !== undefined && input.title !== existing.title) {
    changes.push({
      field: 'checklist',
      label: 'checklist item',
      from: `"${existing.title}"`,
      to: `"${updated.title}"`,
    });
  }

  if (input.isDone !== undefined && input.isDone !== existing.isDone) {
    changes.push({
      field: 'checklist',
      label: 'checklist item',
      to: updated.isDone
        ? `Marked "${updated.title}" as done`
        : `Unchecked "${updated.title}"`,
    });
  }

  if (
    input.position !== undefined &&
    input.position !== existing.position &&
    input.title === undefined &&
    input.isDone === undefined
  ) {
    changes.push({
      field: 'checklist',
      label: 'checklist item',
      to: `Reordered "${updated.title}"`,
    });
  }

  return changes;
}

export function buildLabelAssignedChange(labelName: string): ActivityChange {
  return {
    field: 'label',
    label: 'label',
    to: `Added label "${labelName}"`,
  };
}

export function buildLabelRemovedChange(labelName: string): ActivityChange {
  return {
    field: 'label',
    label: 'label',
    to: `Removed label "${labelName}"`,
  };
}

export function buildAttachmentUploadedChange(
  filename: string,
): ActivityChange {
  return {
    field: 'attachment',
    label: 'attachment',
    to: `Uploaded "${filename}"`,
  };
}

export function buildAttachmentDeletedChange(filename: string): ActivityChange {
  return {
    field: 'attachment',
    label: 'attachment',
    to: `Removed "${filename}"`,
  };
}
