export interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

export interface ProjectLabel extends TaskLabel {
  projectId: string;
}

export interface CreateLabelInput {
  name: string;
  color?: string;
}

export const LABEL_COLOR_OPTIONS = [
  '#6B7280',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#EC4899',
] as const;

export function normalizeTaskLabels(
  labels?: Array<{ label: TaskLabel }> | TaskLabel[],
): TaskLabel[] {
  if (!labels?.length) return [];

  if ('label' in labels[0]) {
    return (labels as Array<{ label: TaskLabel }>).map((item) => item.label);
  }

  return labels as TaskLabel[];
}
