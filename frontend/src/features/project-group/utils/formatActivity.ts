import type { ProjectGroupMessage } from '../types';

export interface ActivityDetailRow {
  prefix?: string;
  badge?: string;
  text?: string;
}

export function formatActivityMessage(message: ProjectGroupMessage): {
  title: string;
  details: string[];
  detailRows: ActivityDetailRow[];
} {
  const authorName = message.author?.name ?? 'Someone';
  const data = (message.activityData ?? {}) as Record<string, unknown>;

  const toDetailRows = (details: string[]): ActivityDetailRow[] =>
    details.map((text) => ({ text }));

  switch (message.activityType) {
    case 'task.created': {
      const details = data.boardName
        ? [`Board: ${String(data.boardName)}`]
        : [];
      return {
        title: `${authorName} created task "${String(data.taskTitle ?? 'Untitled')}"`,
        details,
        detailRows: toDetailRows(details),
      };
    }
    case 'task.updated': {
      const changes = Array.isArray(data.changes)
        ? (data.changes as Array<{
            label: string;
            from?: string | null;
            to?: string | null;
          }>)
        : [];
      const details = changes.map((change) => {
        if (change.from != null && change.to != null) {
          return `${change.label}: ${change.from} → ${change.to}`;
        }
        if (change.to != null) {
          return `${change.label}: ${change.to}`;
        }
        return change.label;
      });
      const detailRows = changes.map((change) => {
        if (change.to != null) {
          return { prefix: `${change.label}:`, badge: String(change.to) };
        }
        return { text: change.label };
      });
      return {
        title: `${authorName} updated task "${String(data.taskTitle ?? 'Untitled')}"`,
        details,
        detailRows,
      };
    }
    case 'task.moved': {
      const details = [
        data.fromColumn && data.toColumn
          ? `${String(data.fromColumn)} → ${String(data.toColumn)}`
          : 'Task position changed',
      ];
      const detailRows: ActivityDetailRow[] =
        data.toColumn != null
          ? [{ prefix: 'Column changed to:', badge: String(data.toColumn) }]
          : [{ text: 'Task position changed' }];
      return {
        title: `${authorName} moved task "${String(data.taskTitle ?? 'Untitled')}"`,
        details,
        detailRows,
      };
    }
    case 'task.deleted':
      return {
        title: `${authorName} deleted task "${String(data.taskTitle ?? 'Untitled')}"`,
        details: [],
        detailRows: [],
      };
    case 'board.created':
      return {
        title: `${authorName} created board "${String(data.boardName ?? 'Untitled')}"`,
        details: [],
        detailRows: [],
      };
    case 'board.updated': {
      const details = Array.isArray(data.changes)
        ? (data.changes as string[])
        : [];
      return {
        title: `${authorName} updated board "${String(data.boardName ?? 'Untitled')}"`,
        details,
        detailRows: toDetailRows(details),
      };
    }
    case 'board.deleted':
      return {
        title: `${authorName} deleted board "${String(data.boardName ?? 'Untitled')}"`,
        details: [],
        detailRows: [],
      };
    case 'column.created': {
      const details = data.boardName
        ? [`Board: ${String(data.boardName)}`]
        : [];
      return {
        title: `${authorName} created column "${String(data.columnName ?? 'Untitled')}"`,
        details,
        detailRows: toDetailRows(details),
      };
    }
    case 'column.updated': {
      const details = Array.isArray(data.changes)
        ? (data.changes as string[])
        : [];
      return {
        title: `${authorName} updated column "${String(data.columnName ?? 'Untitled')}"`,
        details,
        detailRows: toDetailRows(details),
      };
    }
    case 'column.deleted':
      return {
        title: `${authorName} deleted column "${String(data.columnName ?? 'Untitled')}"`,
        details: [],
        detailRows: [],
      };
    case 'member.joined':
      return {
        title: `${String(data.memberName ?? 'A member')} joined the project`,
        details: [],
        detailRows: [],
      };
    case 'member.removed':
      return {
        title: `${authorName} removed ${String(data.memberName ?? 'a member')} from the project`,
        details: [],
        detailRows: [],
      };
    case 'member.role_changed': {
      const roleName = String(data.roleName ?? 'Updated');
      return {
        title: `${authorName} changed ${String(data.memberName ?? 'a member')}'s role`,
        details: [`New role: ${roleName}`],
        detailRows: [{ prefix: 'New role:', badge: roleName }],
      };
    }
    default:
      return {
        title: `${authorName} performed an action`,
        details: [],
        detailRows: [],
      };
  }
}
