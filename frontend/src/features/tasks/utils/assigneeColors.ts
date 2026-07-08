import type { CSSProperties } from 'react';
import { getTaskAssignees, type TaskAssignee } from '@/features/tasks/types';

export interface AssigneeColorTheme {
  background: string;
  border: string;
  accent: string;
}

/** Soft palette aligned with the app UI — one stable color per team member. */
export const ASSIGNEE_COLOR_PALETTE: AssigneeColorTheme[] = [
  { background: '#eff6ff', border: '#bfdbfe', accent: '#3b82f6' },
  { background: '#fdf2f8', border: '#fbcfe8', accent: '#ec4899' },
  { background: '#f5f3ff', border: '#ddd6fe', accent: '#8b5cf6' },
  { background: '#ecfdf5', border: '#a7f3d0', accent: '#10b981' },
  { background: '#fffbeb', border: '#fde68a', accent: '#f59e0b' },
  { background: '#ecfeff', border: '#a5f3fc', accent: '#06b6d4' },
  { background: '#eef2ff', border: '#c7d2fe', accent: '#6366f1' },
  { background: '#fff1f2', border: '#fecdd3', accent: '#f43f5e' },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function buildMemberColorMap(
  memberIds: Iterable<string>,
): Map<string, AssigneeColorTheme> {
  const sorted = [...new Set(memberIds)].sort();
  const map = new Map<string, AssigneeColorTheme>();

  sorted.forEach((id, index) => {
    map.set(id, ASSIGNEE_COLOR_PALETTE[index % ASSIGNEE_COLOR_PALETTE.length]);
  });

  return map;
}

export function getAssigneeColor(
  userId: string,
  colorMap?: Map<string, AssigneeColorTheme>,
): AssigneeColorTheme {
  const fromMap = colorMap?.get(userId);
  if (fromMap) return fromMap;

  return ASSIGNEE_COLOR_PALETTE[
    hashString(userId) % ASSIGNEE_COLOR_PALETTE.length
  ];
}

export function getPrimaryAssigneeId(task: {
  assignees?: TaskAssignee[];
}): string | null {
  const assignees = getTaskAssignees(task);
  return assignees[0]?.id ?? null;
}

export function getTaskAssigneeTheme(
  task: { assignees?: TaskAssignee[] },
  colorMap: Map<string, AssigneeColorTheme>,
): AssigneeColorTheme | null {
  const primaryId = getPrimaryAssigneeId(task);
  if (!primaryId) return null;
  return getAssigneeColor(primaryId, colorMap);
}

export interface TaskAssigneeCardPresentation {
  className: string;
  style?: CSSProperties;
}

export function getTaskAssigneeCardPresentation(
  task: { assignees?: TaskAssignee[] },
  colorMap: Map<string, AssigneeColorTheme>,
  options: {
    isCompleted?: boolean;
    isHighlighted?: boolean;
    isDragOverlay?: boolean;
    isDimmed?: boolean;
  } = {},
): TaskAssigneeCardPresentation {
  const theme = getTaskAssigneeTheme(task, colorMap);
  const parts = [
    'w-full rounded-lg border shadow-sm transition cursor-default',
    options.isDragOverlay ? 'rotate-2 shadow-lg ring-2 ring-primary-200' : '',
    options.isDimmed ? 'opacity-35' : '',
    options.isHighlighted ? 'ring-2 ring-primary-100' : '',
  ];

  if (theme) {
    return {
      className: parts.filter(Boolean).join(' '),
      style: {
        backgroundColor: options.isCompleted
          ? 'rgba(240, 253, 244, 0.92)'
          : theme.background,
        borderColor: options.isHighlighted ? undefined : theme.border,
        borderLeftWidth: 4,
        borderLeftColor: theme.accent,
        ...(options.isHighlighted
          ? { borderColor: '#93c5fd', boxShadow: '0 0 0 2px #dbeafe' }
          : {}),
      },
    };
  }

  if (options.isCompleted) {
    parts.push('bg-green-100/70 border-green-200');
  } else {
    parts.push('bg-white border-gray-200');
  }

  if (options.isHighlighted) {
    parts.push('border-primary-400');
  }

  return { className: parts.filter(Boolean).join(' ') };
}
