type GanttTaskRecord = {
  id: string;
  slug: string;
  title: string;
  priority: string;
  startDate: Date | null;
  dueDate: Date | null;
  isCompleted: boolean;
  boardId: string;
  columnId: string;
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
    isCompleted: task.isCompleted,
    boardId: task.boardId,
    boardName: task.board?.name ?? 'Board',
    boardSlug: task.board?.slug ?? '',
    columnId: task.columnId,
    columnName: task.column?.name ?? 'Column',
    columnColor: task.column?.color ?? null,
    assignees: task.assignees ?? [],
  };
}
