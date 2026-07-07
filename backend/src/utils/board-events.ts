import { boardRepository } from '../repositories/board.repository';
import { columnRepository } from '../repositories/column.repository';
import { taskRepository } from '../repositories/task.repository';
import { serializeAttachmentUrl } from '../services/storage/storage.service';
import { emitBoardEvent, emitProjectEvent } from '../socket';
import type { BoardEventType, ProjectEventType } from '../socket/types';
import { dispatchBoardTaskNotifications } from '../services/notification-dispatch.service';

async function resolveBoardIdFromColumn(
  columnId: string,
): Promise<string | null> {
  return columnRepository.getBoardId(columnId);
}

async function resolveBoardIdFromTask(taskId: string): Promise<string | null> {
  const columnId = await taskRepository.getColumnId(taskId);
  if (!columnId) return null;
  return columnRepository.getBoardId(columnId);
}

function serializeTask(task: Record<string, unknown>) {
  return {
    id: String(task.id),
    slug: String(task.slug ?? ''),
    title: task.title,
    description: task.description ?? null,
    columnId: String(task.columnId),
    position: Number(task.position),
    priority: task.priority,
    dueDate: task.dueDate
      ? new Date(task.dueDate as string | Date).toISOString()
      : null,
    startDate: task.startDate
      ? new Date(task.startDate as string | Date).toISOString()
      : null,
    isCompleted: Boolean(task.isCompleted),
    assignees: task.assignees ?? [],
    checklistItems: Array.isArray(task.checklistItems)
      ? task.checklistItems.map((item) => ({
          id: String((item as { id: string }).id),
          title: (item as { title: string }).title,
          isDone: Boolean((item as { isDone: boolean }).isDone),
          position: Number((item as { position: number }).position),
        }))
      : [],
  };
}

function serializeColumns(columns: Array<Record<string, unknown>>) {
  return columns.map((column) => ({
    id: String(column.id),
    name: column.name,
    boardId: String(column.boardId),
    position: Number(column.position),
    color: (column.color as string | null) ?? null,
    tasks: Array.isArray(column.tasks)
      ? column.tasks.map((task) =>
          serializeTask(task as Record<string, unknown>),
        )
      : [],
  }));
}

function serializeColumn(column: Record<string, unknown>) {
  return {
    id: String(column.id),
    name: column.name,
    boardId: String(column.boardId),
    position: Number(column.position),
    color: (column.color as string | null) ?? null,
    tasks: [],
  };
}

function serializeBoardSummary(board: Record<string, unknown>) {
  const createdAt = board.createdAt;
  const updatedAt = board.updatedAt;

  return {
    id: String(board.id),
    name: board.name,
    slug: String(board.slug ?? ''),
    projectId: String(board.projectId),
    position: Number(board.position),
    backgroundUrl: board.backgroundUrl
      ? serializeAttachmentUrl(String(board.backgroundUrl))
      : null,
    createdAt:
      createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
    updatedAt:
      updatedAt instanceof Date ? updatedAt.toISOString() : String(updatedAt),
    _count: (board._count as { columns: number } | undefined) ?? { columns: 3 },
  };
}

export async function notifyBoardTaskEvent(
  userId: string,
  type: BoardEventType,
  options: {
    columnId?: string;
    taskId?: string;
    payload: unknown;
  },
): Promise<void> {
  const boardId =
    (options.columnId
      ? await resolveBoardIdFromColumn(options.columnId)
      : null) ??
    (options.taskId ? await resolveBoardIdFromTask(options.taskId) : null);

  if (!boardId) return;

  let payload = options.payload;
  const dispatchPayload = payload;

  if (type === 'task:moved') {
    const board = await boardRepository.findById(boardId);
    if (board?.columns) {
      payload = {
        columns: serializeColumns(
          board.columns as unknown as Array<Record<string, unknown>>,
        ),
      };
    }
  } else if (payload && typeof payload === 'object' && 'task' in payload) {
    const record = payload as { task: Record<string, unknown> };
    payload = { task: serializeTask(record.task) };
  }

  emitBoardEvent({
    boardId,
    type,
    userId,
    payload,
  });

  void dispatchBoardTaskNotifications(userId, type, {
    boardId,
    payload: dispatchPayload,
    taskId: options.taskId,
  }).catch(() => undefined);
}

type ColumnEventType =
  'column:created' | 'column:updated' | 'column:deleted' | 'columns:reordered';

export async function notifyBoardColumnEvent(
  userId: string,
  type: ColumnEventType,
  options: {
    boardId?: string;
    columnId?: string;
    payload: unknown;
  },
): Promise<void> {
  const boardId =
    options.boardId ??
    (options.columnId
      ? await columnRepository.getBoardId(options.columnId)
      : null);

  if (!boardId) return;

  let payload = options.payload;

  if (type === 'column:deleted') {
    const record = payload as { columnId?: string };
    payload = { columnId: String(record.columnId ?? options.columnId) };
  } else if (type === 'columns:reordered') {
    const board = await boardRepository.findById(boardId);
    if (board?.columns) {
      payload = {
        columns: (
          board.columns as unknown as Array<Record<string, unknown>>
        ).map((column) => serializeColumn(column)),
      };
    }
  } else if (payload && typeof payload === 'object' && 'column' in payload) {
    const record = payload as { column: Record<string, unknown> };
    payload = { column: serializeColumn(record.column) };
  }

  emitBoardEvent({
    boardId,
    type,
    userId,
    payload,
  });
}

export function notifyBoardMetaEvent(
  userId: string,
  boardId: string,
  board: Record<string, unknown>,
  type: 'board:updated' | 'board:deleted' = 'board:updated',
): void {
  const payload =
    type === 'board:deleted'
      ? { boardId: String(board.id ?? boardId) }
      : { board: serializeBoardSummary(board) };

  emitBoardEvent({
    boardId,
    type,
    userId,
    payload,
  });
}

export function notifyProjectBoardEvent(
  userId: string,
  type: ProjectEventType,
  options: {
    projectId: string;
    boardId?: string;
    payload: unknown;
  },
): void {
  let payload = options.payload;

  if (type === 'board:deleted') {
    payload = { boardId: String(options.boardId) };
  } else if (payload && typeof payload === 'object' && 'board' in payload) {
    const record = payload as { board: Record<string, unknown> };
    payload = { board: serializeBoardSummary(record.board) };
  }

  emitProjectEvent({
    projectId: options.projectId,
    type,
    userId,
    payload,
  });
}
