type GanttTaskRecord = {
  id: string;
  slug: string;
  title: string;
  priority: string;
  startDate: Date | null;
  dueDate: Date | null;
  progress: number;
  isCompleted: boolean;
  parentTaskId: string | null;
  boardId: string;
  columnId: string;
  childCount?: number;
  assignees?: Array<{ id: string; name: string; avatar: string | null }>;
  column?: { id: string; name: string; color: string | null } | null;
  board?: { id: string; name: string; slug: string } | null;
};

export function serializeGanttTask(task: GanttTaskRecord) {
  return {
    id: task.id,
    slug: task.slug,
    title: task.title,
    priority: task.priority,
    startDate: task.startDate?.toISOString() ?? null,
    dueDate: task.dueDate?.toISOString() ?? null,
    progress: task.isCompleted
      ? 100
      : Math.max(0, Math.min(100, task.progress)),
    isCompleted: task.isCompleted,
    parentTaskId: task.parentTaskId,
    childCount: task.childCount ?? 0,
    boardId: task.boardId,
    boardName: task.board?.name ?? 'Board',
    boardSlug: task.board?.slug ?? '',
    columnId: task.columnId,
    columnName: task.column?.name ?? 'Column',
    columnColor: task.column?.color ?? null,
    assignees: task.assignees ?? [],
  };
}
