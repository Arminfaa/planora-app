import type { ProjectGroupMessage } from '../types';

export function formatActivityMessage(message: ProjectGroupMessage): {
  title: string;
  details: string[];
} {
  const authorName = message.author?.name ?? 'Someone';
  const data = (message.activityData ?? {}) as Record<string, unknown>;

  switch (message.activityType) {
    case 'task.created':
      return {
        title: `${authorName} created task "${String(data.taskTitle ?? 'Untitled')}"`,
        details: data.boardName ? [`Board: ${String(data.boardName)}`] : [],
      };
    case 'task.updated': {
      const changes = Array.isArray(data.changes)
        ? (data.changes as Array<{
            label: string;
            from?: string | null;
            to?: string | null;
          }>)
        : [];
      return {
        title: `${authorName} updated task "${String(data.taskTitle ?? 'Untitled')}"`,
        details: changes.map((change) => {
          if (change.from != null && change.to != null) {
            return `${change.label}: ${change.from} → ${change.to}`;
          }
          if (change.to != null) {
            return `${change.label}: ${change.to}`;
          }
          return change.label;
        }),
      };
    }
    case 'task.moved':
      return {
        title: `${authorName} moved task "${String(data.taskTitle ?? 'Untitled')}"`,
        details: [
          data.fromColumn && data.toColumn
            ? `${String(data.fromColumn)} → ${String(data.toColumn)}`
            : 'Task position changed',
        ],
      };
    case 'task.deleted':
      return {
        title: `${authorName} deleted task "${String(data.taskTitle ?? 'Untitled')}"`,
        details: [],
      };
    case 'board.created':
      return {
        title: `${authorName} created board "${String(data.boardName ?? 'Untitled')}"`,
        details: [],
      };
    case 'board.updated':
      return {
        title: `${authorName} updated board "${String(data.boardName ?? 'Untitled')}"`,
        details: Array.isArray(data.changes) ? (data.changes as string[]) : [],
      };
    case 'board.deleted':
      return {
        title: `${authorName} deleted board "${String(data.boardName ?? 'Untitled')}"`,
        details: [],
      };
    case 'column.created':
      return {
        title: `${authorName} created column "${String(data.columnName ?? 'Untitled')}"`,
        details: data.boardName ? [`Board: ${String(data.boardName)}`] : [],
      };
    case 'column.updated':
      return {
        title: `${authorName} updated column "${String(data.columnName ?? 'Untitled')}"`,
        details: Array.isArray(data.changes) ? (data.changes as string[]) : [],
      };
    case 'column.deleted':
      return {
        title: `${authorName} deleted column "${String(data.columnName ?? 'Untitled')}"`,
        details: [],
      };
    case 'member.joined':
      return {
        title: `${String(data.memberName ?? 'A member')} joined the project`,
        details: [],
      };
    case 'member.removed':
      return {
        title: `${authorName} removed ${String(data.memberName ?? 'a member')} from the project`,
        details: [],
      };
    case 'member.role_changed':
      return {
        title: `${authorName} changed ${String(data.memberName ?? 'a member')}'s role`,
        details: [`New role: ${String(data.roleName ?? 'Updated')}`],
      };
    default:
      return {
        title: `${authorName} performed an action`,
        details: [],
      };
  }
}
