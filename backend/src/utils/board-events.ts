import { boardRepository } from '../repositories/board.repository';
import { columnRepository } from '../repositories/column.repository';
import { taskRepository } from '../repositories/task.repository';
import { emitBoardEvent } from '../socket';
import type { BoardEventType } from '../socket/types';

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
    title: task.title,
    description: task.description ?? null,
    columnId: String(task.columnId),
    position: Number(task.position),
    priority: task.priority,
    dueDate: task.dueDate
      ? new Date(task.dueDate as string | Date).toISOString()
      : null,
    assignee: task.assignee ?? null,
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
}
