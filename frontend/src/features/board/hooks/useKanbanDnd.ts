'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { BoardColumn, BoardTask } from '../types';
import { taskService } from '@/features/tasks/services/task.service';
import { getApiErrorMessage } from '@/lib/api';

function findColumnByTaskId(
  columns: BoardColumn[],
  taskId: string,
): BoardColumn | undefined {
  return columns.find((col) => col.tasks?.some((t) => t.id === taskId));
}

function findColumnById(
  columns: BoardColumn[],
  columnId: string,
): BoardColumn | undefined {
  return columns.find((col) => col.id === columnId);
}

export function useKanbanDnd(
  initialColumns: BoardColumn[],
  onError: (message: string) => void,
  onRefresh: () => Promise<void>,
) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const taskId = String(event.active.id);
      const column = findColumnByTaskId(columns, taskId);
      const task = column?.tasks?.find((t) => t.id === taskId);
      if (task) setActiveTask(task);
    },
    [columns],
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    setColumns((prev) => {
      const activeColumn = findColumnByTaskId(prev, activeId);
      const overColumn =
        findColumnByTaskId(prev, overId) ?? findColumnById(prev, overId);

      if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) {
        return prev;
      }

      const activeTasks = [...(activeColumn.tasks ?? [])];
      const overTasks = [...(overColumn.tasks ?? [])];
      const activeIndex = activeTasks.findIndex((t) => t.id === activeId);
      if (activeIndex === -1) return prev;

      const [movedTask] = activeTasks.splice(activeIndex, 1);
      const updatedTask = { ...movedTask, columnId: overColumn.id };

      const overIndex = overTasks.findIndex((t) => t.id === overId);
      if (overIndex >= 0) {
        overTasks.splice(overIndex, 0, updatedTask);
      } else {
        overTasks.push(updatedTask);
      }

      return prev.map((col) => {
        if (col.id === activeColumn.id) {
          return { ...col, tasks: activeTasks };
        }
        if (col.id === overColumn.id) {
          return { ...col, tasks: overTasks };
        }
        return col;
      });
    });
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);
      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      const activeColumn = findColumnByTaskId(columns, activeId);
      const overColumn =
        findColumnByTaskId(columns, overId) ?? findColumnById(columns, overId);

      if (!activeColumn || !overColumn) return;

      const previousColumns = columns;
      let columnId = overColumn.id;
      let position = 0;
      let nextColumns = columns;

      if (activeColumn.id === overColumn.id) {
        const tasks = [...(activeColumn.tasks ?? [])];
        const oldIndex = tasks.findIndex((t) => t.id === activeId);
        if (oldIndex === -1) return;

        const overIndex = tasks.findIndex((t) => t.id === overId);
        const newIndex = overIndex === -1 ? tasks.length - 1 : overIndex;
        if (oldIndex === newIndex) return;

        const reordered = arrayMove(tasks, oldIndex, newIndex);
        position = newIndex;
        columnId = activeColumn.id;
        nextColumns = columns.map((col) =>
          col.id === activeColumn.id ? { ...col, tasks: reordered } : col,
        );
        setColumns(nextColumns);
      } else {
        position = overColumn.tasks?.findIndex((t) => t.id === activeId) ?? 0;
        columnId = overColumn.id;
      }

      try {
        await taskService.update(activeId, { columnId, position });
      } catch (err) {
        setColumns(previousColumns);
        onError(getApiErrorMessage(err));
        await onRefresh();
      }
    },
    [columns, onError, onRefresh],
  );

  return {
    columns,
    activeTask,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
