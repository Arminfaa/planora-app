import type { GanttHierarchyRow, GanttTask } from '../types';

export function buildBoardHierarchyRows(
  tasks: GanttTask[],
  collapsedTaskIds: Set<string>,
): GanttHierarchyRow[] {
  const taskIds = new Set(tasks.map((task) => task.id));
  const childrenByParent = new Map<string | null, GanttTask[]>();

  for (const task of tasks) {
    const parentId =
      task.parentTaskId && taskIds.has(task.parentTaskId)
        ? task.parentTaskId
        : null;
    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(task);
    childrenByParent.set(parentId, siblings);
  }

  const rows: GanttHierarchyRow[] = [];

  const walk = (parentId: string | null, depth: number) => {
    const siblings = childrenByParent.get(parentId) ?? [];

    for (const task of siblings) {
      const childTasks = childrenByParent.get(task.id) ?? [];
      const hasChildren = childTasks.length > 0;

      rows.push({ task, depth, hasChildren });

      if (hasChildren && !collapsedTaskIds.has(task.id)) {
        walk(task.id, depth + 1);
      }
    }
  };

  walk(null, 0);
  return rows;
}

export function getEffectiveProgress(task: {
  progress: number;
  isCompleted: boolean;
}): number {
  if (task.isCompleted) return 100;
  return Math.max(0, Math.min(100, task.progress));
}
