'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
import type { BoardSocketEvent } from '../types/socket';
import { applyRealtimeEvent } from '../utils/applyRealtimeEvent';
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

function cloneColumns(columns: BoardColumn[]): BoardColumn[] {
  return columns.map((col) => ({
    ...col,
    tasks: [...(col.tasks ?? [])],
  }));
}

/** Apply drop when handleDragOver did not update state (quick drop). */
function applyDrop(
  columns: BoardColumn[],
  activeId: string,
  overId: string,
): BoardColumn[] | null {
  const activeColumn = findColumnByTaskId(columns, activeId);
  const overColumn =
    findColumnByTaskId(columns, overId) ?? findColumnById(columns, overId);

  if (!activeColumn || !overColumn) return null;

  if (activeColumn.id === overColumn.id) {
    const tasks = [...(activeColumn.tasks ?? [])];
    const oldIndex = tasks.findIndex((t) => t.id === activeId);
    if (oldIndex === -1) return null;

    const overIndex = tasks.findIndex((t) => t.id === overId);
    const newIndex = overIndex === -1 ? tasks.length - 1 : overIndex;
    if (oldIndex === newIndex) return null;

    const reordered = arrayMove(tasks, oldIndex, newIndex);
    return columns.map((col) =>
      col.id === activeColumn.id ? { ...col, tasks: reordered } : col,
    );
  }

  const activeTasks = [...(activeColumn.tasks ?? [])];
  const overTasks = [...(overColumn.tasks ?? [])];
  const activeIndex = activeTasks.findIndex((t) => t.id === activeId);
  if (activeIndex === -1) return null;

  const [movedTask] = activeTasks.splice(activeIndex, 1);
  const updatedTask = { ...movedTask, columnId: overColumn.id };

  const overIndex = overTasks.findIndex((t) => t.id === overId);
  if (overIndex >= 0) {
    overTasks.splice(overIndex, 0, updatedTask);
  } else {
    overTasks.push(updatedTask);
  }

  return columns.map((col) => {
    if (col.id === activeColumn.id) {
      return { ...col, tasks: activeTasks };
    }
    if (col.id === overColumn.id) {
      return { ...col, tasks: overTasks };
    }
    return col;
  });
}

export function useKanbanDnd(
  initialColumns: BoardColumn[],
  revision: number,
  onError: (message: string) => void,
  onRefresh: () => Promise<void>,
) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);
  const [dndRevision, setDndRevision] = useState(0);

  const columnsRef = useRef(columns);
  const dragStartSnapshot = useRef<BoardColumn[] | null>(null);
  const isDraggingRef = useRef(false);
  const pendingRemoteRef = useRef(false);

  const updateColumns = useCallback(
    (updater: BoardColumn[] | ((prev: BoardColumn[]) => BoardColumn[])) => {
      setColumns((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        columnsRef.current = next;
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  useEffect(() => {
    if (isDraggingRef.current) return;

    if (pendingRemoteRef.current) {
      pendingRemoteRef.current = false;
      return;
    }

    setColumns(initialColumns);
    columnsRef.current = initialColumns;
    setDndRevision((value) => value + 1);
  }, [initialColumns, revision]);

  const applyRemoteUpdate = useCallback(
    (event: BoardSocketEvent) => {
      if (isDraggingRef.current) return;

      pendingRemoteRef.current = true;
      updateColumns((prev) => applyRealtimeEvent(prev, event));
      setDndRevision((value) => value + 1);
    },
    [updateColumns],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    isDraggingRef.current = true;
    dragStartSnapshot.current = cloneColumns(columnsRef.current);

    const taskId = String(event.active.id);
    const column = findColumnByTaskId(columnsRef.current, taskId);
    const task = column?.tasks?.find((t) => t.id === taskId);
    if (task) setActiveTask(task);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      if (activeId === overId) return;

      updateColumns((prev) => {
        const activeColumn = findColumnByTaskId(prev, activeId);
        const overColumn =
          findColumnByTaskId(prev, overId) ?? findColumnById(prev, overId);

        if (!activeColumn || !overColumn) return prev;

        if (activeColumn.id === overColumn.id) {
          const tasks = [...(activeColumn.tasks ?? [])];
          const oldIndex = tasks.findIndex((t) => t.id === activeId);
          const newIndex = tasks.findIndex((t) => t.id === overId);

          if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
            return prev;
          }

          const reordered = arrayMove(tasks, oldIndex, newIndex);

          return prev.map((col) =>
            col.id === activeColumn.id ? { ...col, tasks: reordered } : col,
          );
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
    },
    [updateColumns],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      isDraggingRef.current = false;
      setActiveTask(null);

      const activeId = String(active.id);
      const snapshot = dragStartSnapshot.current;

      if (!over) {
        if (snapshot) {
          updateColumns(snapshot);
          setDndRevision((value) => value + 1);
        }
        dragStartSnapshot.current = null;
        return;
      }

      const overId = String(over.id);
      const baseline = snapshot ?? columnsRef.current;
      let finalColumns = columnsRef.current;

      const startCol = findColumnByTaskId(baseline, activeId);
      let endCol = findColumnByTaskId(finalColumns, activeId);

      if (!startCol) {
        dragStartSnapshot.current = null;
        return;
      }

      const startIndex =
        startCol.tasks?.findIndex((t) => t.id === activeId) ?? -1;

      let endIndex = endCol?.tasks?.findIndex((t) => t.id === activeId) ?? -1;
      const unchanged = startCol.id === endCol?.id && startIndex === endIndex;

      if (unchanged) {
        const applied = applyDrop(finalColumns, activeId, overId);
        if (!applied) {
          dragStartSnapshot.current = null;
          return;
        }
        finalColumns = applied;
        updateColumns(finalColumns);
        endCol = findColumnByTaskId(finalColumns, activeId);
        endIndex = endCol?.tasks?.findIndex((t) => t.id === activeId) ?? -1;
      }

      if (!endCol || startIndex === -1 || endIndex === -1) {
        if (snapshot) {
          updateColumns(snapshot);
          setDndRevision((value) => value + 1);
        }
        dragStartSnapshot.current = null;
        return;
      }

      if (startCol.id === endCol.id && startIndex === endIndex) {
        dragStartSnapshot.current = null;
        return;
      }

      const columnId = endCol.id;
      const position = endIndex;
      const previousColumns = snapshot ?? columnsRef.current;
      dragStartSnapshot.current = null;

      try {
        await taskService.update(activeId, { columnId, position });
        setDndRevision((value) => value + 1);
      } catch (err) {
        updateColumns(previousColumns);
        setDndRevision((value) => value + 1);
        onError(getApiErrorMessage(err));
        await onRefresh();
      }
    },
    [onError, onRefresh, updateColumns],
  );

  const handleDragCancel = useCallback(() => {
    isDraggingRef.current = false;
    setActiveTask(null);

    if (dragStartSnapshot.current) {
      updateColumns(dragStartSnapshot.current);
      setDndRevision((value) => value + 1);
    }

    dragStartSnapshot.current = null;
  }, [updateColumns]);

  return {
    columns,
    activeTask,
    dndRevision,
    sensors,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    applyRemoteUpdate,
  };
}
