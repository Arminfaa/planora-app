'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusListTask } from '../hooks/useFocusListTask';
import dynamic from 'next/dynamic';
import { Checkbox } from 'antd';
import type { Board, BoardTask } from '../types';
import type { Project } from '@/features/projects/types';
import { useProjectMembers } from '@/features/projects/hooks/useProjectMembers';
import { useProjectLabels } from '@/features/labels/hooks/useProjectLabels';
import { useProjectPermissions } from '@/features/permissions/hooks/useProjectPermissions';
import { taskService } from '@/features/tasks/services/task.service';
import { checklistService } from '@/features/tasks/services/checklist.service';
import { boardService } from '../services/board.service';
import { BoardFilterModal } from '@/features/search/components/BoardFilterModal';
import { defaultTaskFilters, type TaskFilters } from '@/features/search/types';
import {
  countActiveFilters,
  isTaskFiltersActive,
  taskIsVisible,
} from '@/features/search/utils/taskFilters';
import { getPriorityStyles } from '@/features/tasks/types';
import { LabelBadges } from '@/features/labels/components/LabelBadges';
import { normalizeTaskLabels } from '@/features/labels/types';
import { formatDueDate, isDueDateOverdue } from '@/features/tasks/utils/dates';
import { useMemberColorMap } from '@/features/tasks/hooks/useMemberColorMap';
import { getTaskAssigneeCardPresentation } from '@/features/tasks/utils/assigneeColors';
import {
  computeChecklistProgress,
  getTaskProgressDisplay,
} from '@/features/tasks/utils/checklistProgress';
import { AllTasksCreateModal } from './AllTasksCreateModal';
import { ImportTasksModal } from './ImportTasksModal';
import { TaskChecklistPreview } from './TaskChecklistPreview';
import { AssigneeDisplay } from './AssigneeDisplay';
import { EditIcon } from './EditIcon';
import { TaskListActionButton } from './TaskListActionButton';
import { TrashIcon } from './TrashIcon';
import { ViewIcon } from './ViewIcon';
import { AllTasksSkeleton } from '@/features/board/components/AllTasksSkeleton';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { Button } from '@/shared/components/ui/Button';
import { getApiErrorMessage, isForbiddenError } from '@/lib/api';
import { exportBoardTasksToExcel } from '../utils/exportTasksToExcel';
import { buildWorkReportText } from '../utils/buildWorkReportText';
import type {
  BulkOperationMode,
  BulkTaskAction,
} from '@/features/tasks/types/bulkActions';
import { useLocale } from '@/i18n/LocaleProvider';
import {
  AllTasksBulkToolbar,
  createEmptyBulkFormState,
  type BulkFormState,
} from './AllTasksBulkToolbar';
import { AllTasksPageHeader } from './AllTasksPageHeader';
import { AllTasksSearchBar } from './AllTasksSearchBar';
import { WorkReportModal } from './WorkReportModal';
import { VirtualizedWindowList } from '@/shared/components/VirtualizedWindowList';

const TaskModal = dynamic(
  () => import('./TaskModal').then((mod) => ({ default: mod.TaskModal })),
  { loading: () => <LoadingSpinner /> },
);

const TaskViewModal = dynamic(
  () =>
    import('./TaskViewModal').then((mod) => ({ default: mod.TaskViewModal })),
  { loading: () => <LoadingSpinner /> },
);

interface AllTasksViewProps {
  project: Project;
  projectSlug: string;
  boardSlug?: string;
  scope?: 'board' | 'project';
}

function getTaskBoardId(task: BoardTask): string | undefined {
  return task.boardId ?? task.board?.id;
}

export function AllTasksView({
  project,
  projectSlug,
  boardSlug,
  scope,
}: AllTasksViewProps) {
  const { t, locale } = useLocale();
  const priorityStylesMap = getPriorityStyles(t);
  const viewScope: 'board' | 'project' =
    scope ?? (boardSlug ? 'board' : 'project');
  const isProjectScope = viewScope === 'project';
  const [board, setBoard] = useState<Board | null>(null);
  const [projectBoards, setProjectBoards] = useState<Board[]>([]);
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TaskFilters>(defaultTaskFilters);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [viewTask, setViewTask] = useState<BoardTask | null>(null);
  const [editTask, setEditTask] = useState<BoardTask | null>(null);
  const [selectionMode, setSelectionMode] = useState<BulkOperationMode | null>(
    null,
  );
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [bulkForm, setBulkForm] = useState<BulkFormState>(
    createEmptyBulkFormState,
  );
  const [isBulkApplying, setIsBulkApplying] = useState(false);
  const [workReportText, setWorkReportText] = useState<string | null>(null);

  const { can } = useProjectPermissions(project);
  const members = useProjectMembers(project.id);
  const { labels: projectLabels } = useProjectLabels(project.id);
  const canCreateTasks = can('task.create');
  const canEditTasks = can('task.edit');
  const canDeleteTasks = can('task.delete');
  const canViewTasks = can('task.view');
  const canMoveTasks = can('task.move');
  const canCreateLabels = can('label.create');
  const canAssignLabels = can('label.assign');
  const memberColorMap = useMemberColorMap(members, tasks);
  const { requestFocusTask, highlightedTaskId } = useFocusListTask();

  const rawColumns = useMemo(() => {
    if (isProjectScope) {
      return projectBoards.flatMap((entry) => entry.columns ?? []);
    }
    return board?.columns ?? [];
  }, [board?.columns, isProjectScope, projectBoards]);

  const columns = useMemo(() => {
    if (!isProjectScope) return rawColumns;
    const boardNameById = new Map(
      projectBoards.map((entry) => [entry.id, entry.name]),
    );
    return rawColumns.map((column) => ({
      ...column,
      name: `${boardNameById.get(column.boardId) ?? t('common.emDash')} · ${column.name}`,
    }));
  }, [isProjectScope, projectBoards, rawColumns, t]);

  const columnsForFilter = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => task.columnId === column.id),
      })),
    [columns, tasks],
  );

  const loadData = useCallback(
    async (options?: { silent?: boolean }): Promise<BoardTask[]> => {
      if (!canViewTasks) {
        setTasks([]);
        setIsLoading(false);
        return [];
      }

      if (!options?.silent) {
        setIsLoading(true);
      }
      setError('');
      try {
        if (isProjectScope) {
          const result = await taskService.listByProject(project.id);
          setBoard(null);
          setProjectBoards(result.boards);
          setTasks(result.tasks);
          setViewTask((prev) =>
            prev
              ? (result.tasks.find((task) => task.id === prev.id) ?? prev)
              : null,
          );
          setEditTask((prev) =>
            prev
              ? (result.tasks.find((task) => task.id === prev.id) ?? prev)
              : null,
          );
          return result.tasks;
        }

        if (!boardSlug) {
          throw new Error(t('common.boardNotFound'));
        }

        const boardData = await boardService.getBySlug(projectSlug, boardSlug);
        setBoard(boardData);
        setProjectBoards([]);
        const taskData = await taskService.listByBoard(boardData.id);
        setTasks(taskData);
        setViewTask((prev) =>
          prev ? (taskData.find((task) => task.id === prev.id) ?? prev) : null,
        );
        setEditTask((prev) =>
          prev ? (taskData.find((task) => task.id === prev.id) ?? prev) : null,
        );
        return taskData;
      } catch (err) {
        setError(getApiErrorMessage(err));
        setBoard(null);
        setProjectBoards([]);
        setTasks([]);
        return [];
      } finally {
        if (!options?.silent) {
          setIsLoading(false);
        }
      }
    },
    [boardSlug, canViewTasks, isProjectScope, project.id, projectSlug, t],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const filteredTasks = useMemo(
    () => tasks.filter((task) => taskIsVisible(task, searchQuery, filters)),
    [filters, searchQuery, tasks],
  );

  const hasActiveView =
    searchQuery.trim().length > 0 || isTaskFiltersActive(filters);

  const selectedCount = selectedTaskIds.size;
  const filteredTaskIds = useMemo(
    () => filteredTasks.map((task) => task.id),
    [filteredTasks],
  );
  const allFilteredSelected =
    filteredTaskIds.length > 0 &&
    filteredTaskIds.every((id) => selectedTaskIds.has(id));
  const someFilteredSelected =
    filteredTaskIds.some((id) => selectedTaskIds.has(id)) &&
    !allFilteredSelected;

  const toggleTaskSelection = useCallback(
    (taskId: string, selected: boolean) => {
      setSelectedTaskIds((current) => {
        const next = new Set(current);
        if (selected) {
          next.add(taskId);
        } else {
          next.delete(taskId);
        }
        return next;
      });
    },
    [],
  );

  const toggleSelectAllFiltered = useCallback(
    (selected: boolean) => {
      setSelectedTaskIds((current) => {
        const next = new Set(current);
        if (selected) {
          filteredTaskIds.forEach((id) => next.add(id));
        } else {
          filteredTaskIds.forEach((id) => next.delete(id));
        }
        return next;
      });
    },
    [filteredTaskIds],
  );

  const clearSelection = useCallback(() => {
    setSelectedTaskIds(new Set());
    setBulkForm(createEmptyBulkFormState());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(null);
    clearSelection();
  }, [clearSelection]);

  const enterSelectionMode = useCallback(
    (mode: BulkOperationMode) => {
      setSelectionMode(mode);
      clearSelection();
      setActionError('');
    },
    [clearSelection],
  );

  const handleBulkAction = useCallback(
    async (action: BulkTaskAction) => {
      if (selectedCount === 0) return;

      const selectedTasks = tasks.filter((task) =>
        selectedTaskIds.has(task.id),
      );
      if (selectedTasks.length === 0) return;

      setIsBulkApplying(true);
      setActionError('');

      try {
        if (!isProjectScope) {
          if (!board) return;
          await taskService.bulkAction(board.id, {
            taskIds: selectedTasks.map((task) => task.id),
            action,
          });
        } else if (action.type === 'move') {
          const targetColumn = rawColumns.find(
            (column) => column.id === action.columnId,
          );
          if (!targetColumn) {
            throw new Error(t('common.somethingWentWrong'));
          }
          const boardTaskIds = selectedTasks
            .filter((task) => getTaskBoardId(task) === targetColumn.boardId)
            .map((task) => task.id);
          if (boardTaskIds.length === 0) {
            throw new Error(t('board.bulkMoveWrongBoard'));
          }
          await taskService.bulkAction(targetColumn.boardId, {
            taskIds: boardTaskIds,
            action,
          });
        } else {
          const byBoard = new Map<string, string[]>();
          for (const task of selectedTasks) {
            const taskBoardId = getTaskBoardId(task);
            if (!taskBoardId) continue;
            const current = byBoard.get(taskBoardId) ?? [];
            current.push(task.id);
            byBoard.set(taskBoardId, current);
          }
          for (const [taskBoardId, taskIds] of byBoard) {
            await taskService.bulkAction(taskBoardId, { taskIds, action });
          }
        }

        exitSelectionMode();
        await loadData();
      } catch (err) {
        if (!isForbiddenError(err)) {
          setActionError(getApiErrorMessage(err));
        }
      } finally {
        setIsBulkApplying(false);
      }
    },
    [
      board,
      exitSelectionMode,
      isProjectScope,
      loadData,
      rawColumns,
      selectedCount,
      selectedTaskIds,
      t,
      tasks,
    ],
  );

  const revealAndFocusTask = useCallback(
    (taskId: string, nextTasks: BoardTask[]) => {
      const task = nextTasks.find((entry) => entry.id === taskId);
      if (task && !taskIsVisible(task, searchQuery, filters)) {
        setSearchQuery('');
        setFilters(defaultTaskFilters);
      }
      requestFocusTask(taskId);
    },
    [filters, requestFocusTask, searchQuery],
  );

  const handleCreateTask = async (task: BoardTask) => {
    const nextTasks = await loadData({ silent: true });
    setShowCreateModal(false);
    revealAndFocusTask(task.id, nextTasks);
  };

  const handleTaskSave = async () => {
    const taskId = editTask?.id;
    const nextTasks = await loadData({ silent: true });
    setEditTask(null);
    if (taskId) {
      revealAndFocusTask(taskId, nextTasks);
    }
  };

  const handleTaskDelete = async () => {
    await loadData();
    setEditTask(null);
    setViewTask(null);
  };

  const handleDeleteTask = async (task: BoardTask) => {
    if (!canDeleteTasks) return;
    if (!confirm(t('board.deleteTaskNamedConfirm', { title: task.title })))
      return;

    setActionError('');
    try {
      await taskService.delete(task.id);
      if (editTask?.id === task.id) {
        setEditTask(null);
      }
      if (viewTask?.id === task.id) {
        setViewTask(null);
      }
      await loadData();
    } catch (err) {
      if (!isForbiddenError(err)) {
        setActionError(getApiErrorMessage(err));
      }
    }
  };

  const getColumnName = (task: BoardTask) =>
    task.column?.name ??
    rawColumns.find((column) => column.id === task.columnId)?.name ??
    t('common.emDash');

  const getColumnColor = (task: BoardTask) =>
    task.column?.color ??
    rawColumns.find((column) => column.id === task.columnId)?.color ??
    '#6B7280';

  const handleImportComplete = async () => {
    setShowImportModal(false);
    await loadData();
  };

  const handleExportSelected = () => {
    if (selectionMode !== 'export' || selectedCount === 0) return;
    const selectedTasks = tasks.filter((task) => selectedTaskIds.has(task.id));
    if (selectedTasks.length === 0) return;
    const exportBoard =
      board ??
      ({
        id: project.id,
        name: project.name,
        slug: projectSlug,
        projectId: project.id,
        position: 0,
        createdAt: '',
        updatedAt: '',
      } satisfies Board);
    exportBoardTasksToExcel(selectedTasks, exportBoard, rawColumns, locale);
    exitSelectionMode();
  };

  const handleExportTextSelected = () => {
    if (selectionMode !== 'exportText' || selectedCount === 0) return;
    const selectedTasks = tasks.filter((task) => selectedTaskIds.has(task.id));
    if (selectedTasks.length === 0) return;
    const text = buildWorkReportText(selectedTasks, locale, t, {
      completeDate: filters.completeDate,
      completeDateFrom: filters.completeDateFrom,
      completeDateTo: filters.completeDateTo,
    });
    setWorkReportText(text);
    exitSelectionMode();
  };

  const handleBulkFormChange = useCallback((patch: Partial<BulkFormState>) => {
    setBulkForm((current) => ({ ...current, ...patch }));
  }, []);

  const updateTaskInList = useCallback(
    (taskId: string, updater: (task: BoardTask) => BoardTask) => {
      setTasks((current) =>
        current.map((task) => (task.id === taskId ? updater(task) : task)),
      );
      setViewTask((current) =>
        current?.id === taskId ? updater(current) : current,
      );
      setEditTask((current) =>
        current?.id === taskId ? updater(current) : current,
      );
    },
    [],
  );

  const handleToggleComplete = useCallback(
    async (task: BoardTask, completed: boolean) => {
      if (!canEditTasks) return;
      if (Boolean(task.isCompleted) === completed) return;

      const previousCompleteDate = task.completeDate ?? null;
      const previousChecklist = task.checklistItems;
      const previousSuppressed = Boolean(task.autoCompleteSuppressed);
      setActionError('');
      const previousProgress = task.progress ?? 0;
      const hasChecklist = (task.checklistItems?.length ?? 0) > 0;
      const uncheckedProgress = hasChecklist
        ? computeChecklistProgress(task.checklistItems ?? [])
        : previousProgress;

      updateTaskInList(task.id, (current) => ({
        ...current,
        isCompleted: completed,
        completeDate: completed ? new Date().toISOString() : null,
        progress: completed ? 100 : uncheckedProgress,
        autoCompleteSuppressed: completed ? false : hasChecklist,
        checklistItems: completed
          ? current.checklistItems?.map((item) => ({
              ...item,
              isDone: true,
              completedAt: item.completedAt ?? new Date().toISOString(),
            }))
          : current.checklistItems,
      }));

      try {
        const updated = await taskService.update(task.id, {
          isCompleted: completed,
        });
        updateTaskInList(task.id, (current) => ({
          ...current,
          isCompleted: Boolean(updated.isCompleted),
          completeDate: updated.completeDate ?? null,
          progress: updated.progress ?? current.progress,
          autoCompleteSuppressed: Boolean(updated.autoCompleteSuppressed),
          checklistItems: updated.checklistItems ?? current.checklistItems,
        }));
      } catch (err) {
        updateTaskInList(task.id, (current) => ({
          ...current,
          isCompleted: Boolean(task.isCompleted),
          completeDate: previousCompleteDate,
          progress: previousProgress,
          autoCompleteSuppressed: previousSuppressed,
          checklistItems: previousChecklist,
        }));
        if (!isForbiddenError(err)) {
          setActionError(getApiErrorMessage(err));
        }
      }
    },
    [canEditTasks, updateTaskInList],
  );

  const handleChecklistItemToggle = useCallback(
    async (taskId: string, itemId: string, isDone: boolean) => {
      if (!canViewTasks) return;

      const task = tasks.find((entry) => entry.id === taskId);
      const previousItems = task?.checklistItems;
      const previousCompleted = Boolean(task?.isCompleted);
      const previousProgress = task?.progress ?? 0;
      const previousCompleteDate = task?.completeDate ?? null;
      const previousSuppressed = Boolean(task?.autoCompleteSuppressed);

      setActionError('');
      updateTaskInList(taskId, (current) => {
        const nextItems =
          current.checklistItems?.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  isDone,
                  completedAt: isDone ? new Date().toISOString() : null,
                }
              : item,
          ) ?? [];
        const nextProgress = computeChecklistProgress(nextItems);
        const shouldAutoComplete =
          nextItems.length > 0 &&
          nextProgress === 100 &&
          !current.isCompleted &&
          !current.autoCompleteSuppressed;

        return {
          ...current,
          checklistItems: nextItems,
          progress:
            current.isCompleted || shouldAutoComplete ? 100 : nextProgress,
          isCompleted: current.isCompleted || shouldAutoComplete,
          completeDate:
            current.isCompleted || shouldAutoComplete
              ? (current.completeDate ?? new Date().toISOString())
              : current.completeDate,
          autoCompleteSuppressed:
            nextProgress < 100 ? false : current.autoCompleteSuppressed,
        };
      });

      try {
        await checklistService.update(taskId, itemId, { isDone });
      } catch (err) {
        if (previousItems) {
          updateTaskInList(taskId, () => ({
            ...task!,
            checklistItems: previousItems,
            progress: previousProgress,
            isCompleted: previousCompleted,
            completeDate: previousCompleteDate,
            autoCompleteSuppressed: previousSuppressed,
          }));
        }
        if (!isForbiddenError(err)) {
          setActionError(getApiErrorMessage(err));
        }
        throw err;
      }
    },
    [canViewTasks, tasks, updateTaskInList],
  );

  if (isLoading) {
    return <AllTasksSkeleton scope={isProjectScope ? 'project' : 'board'} />;
  }

  if (error || (!isProjectScope && !board)) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || t('common.boardNotFound')}
        </div>
      </div>
    );
  }

  if (!canViewTasks) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t('board.noViewPermission')}
        </div>
      </div>
    );
  }

  const activeFilterCount = countActiveFilters(filters);
  const clearActiveView = () => {
    setSearchQuery('');
    setFilters(defaultTaskFilters);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <AllTasksPageHeader
        projectSlug={projectSlug}
        scope={viewScope}
        boardSlug={boardSlug}
        boardName={board?.name}
        projectName={project.name}
        totalTasks={tasks.length}
        visibleTasks={filteredTasks.length}
        hasActiveView={hasActiveView}
        selectionMode={selectionMode}
        canCreateTasks={canCreateTasks}
        canMoveTasks={canMoveTasks}
        canEditTasks={canEditTasks}
        canAssignLabels={canAssignLabels}
        canDeleteTasks={canDeleteTasks}
        onCreate={() => setShowCreateModal(true)}
        onImport={() => setShowImportModal(true)}
        onSelectOperation={enterSelectionMode}
      />

      <div className="mt-6">
        <AllTasksSearchBar
          searchQuery={searchQuery}
          activeFilterCount={activeFilterCount}
          hasActiveView={hasActiveView}
          disabled={selectionMode !== null}
          onSearchChange={setSearchQuery}
          onOpenFilters={() => setShowFilterModal(true)}
          onClearView={clearActiveView}
        />
      </div>

      {actionError && (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {selectionMode && (
        <AllTasksBulkToolbar
          mode={selectionMode}
          columns={columns}
          members={members}
          projectLabels={projectLabels}
          selectedCount={selectedCount}
          allFilteredSelected={allFilteredSelected}
          someFilteredSelected={someFilteredSelected}
          isApplying={isBulkApplying}
          canMoveTasks={canMoveTasks}
          canEditTasks={canEditTasks}
          canAssignLabels={canAssignLabels}
          canDeleteTasks={canDeleteTasks}
          onToggleSelectAll={toggleSelectAllFiltered}
          onExit={exitSelectionMode}
          onApplyAction={handleBulkAction}
          onExport={handleExportSelected}
          onExportText={handleExportTextSelected}
          form={bulkForm}
          onFormChange={handleBulkFormChange}
        />
      )}

      <div className="mt-6">
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gradient-to-b from-gray-50 to-white px-6 py-16 text-center">
            <p className="text-base font-medium text-gray-800">
              {tasks.length === 0
                ? t('board.noTasksYet')
                : t('board.noTasksMatch')}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
              {tasks.length === 0
                ? t('board.noTasksYetHint')
                : t('board.noTasksMatchHint')}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {tasks.length === 0 && canCreateTasks ? (
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="rounded-xl"
                >
                  {t('board.newTask')}
                </Button>
              ) : null}
              {tasks.length > 0 && hasActiveView ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={clearActiveView}
                  className="rounded-xl"
                >
                  {t('board.clearSearchAndFilters')}
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <VirtualizedWindowList
            items={filteredTasks}
            estimateSize={180}
            threshold={40}
            gap={12}
            getItemKey={(task) => task.id}
            className="space-y-3"
            renderItem={(task) => {
            const style = priorityStylesMap[task.priority];
            const labels = normalizeTaskLabels(task.labels);
            const isCompleted = Boolean(task.isCompleted);
            const isSelected = selectedTaskIds.has(task.id);
            const isHighlighted = highlightedTaskId === task.id;
            const showSelection = selectionMode !== null;
            const progressPercent = getTaskProgressDisplay(task);
            const cardPresentation = getTaskAssigneeCardPresentation(
              task,
              memberColorMap,
              { isCompleted, isHighlighted },
            );

            return (
              <div
                data-task-id={task.id}
                className="flex scroll-mt-24 flex-col gap-2 sm:flex-row sm:items-start sm:gap-3"
              >
                {showSelection && (
                  <div
                    className="flex shrink-0 items-center sm:pt-4"
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={(event) =>
                        toggleTaskSelection(task.id, event.target.checked)
                      }
                      aria-label={t('board.bulkSelectTask', {
                        title: task.title,
                      })}
                    />
                  </div>
                )}

                <div
                  role={showSelection ? 'button' : undefined}
                  tabIndex={showSelection ? 0 : undefined}
                  aria-pressed={showSelection ? isSelected : undefined}
                  onClick={
                    showSelection
                      ? () => toggleTaskSelection(task.id, !isSelected)
                      : undefined
                  }
                  onKeyDown={
                    showSelection
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            toggleTaskSelection(task.id, !isSelected);
                          }
                        }
                      : undefined
                  }
                  className={`min-w-0 flex-1 rounded-xl p-3 shadow-sm transition duration-300 hover:border-primary-200 hover:shadow-md sm:p-4 ${
                    cardPresentation.className
                  } ${showSelection ? 'cursor-pointer' : ''} ${
                    isSelected && !isHighlighted
                      ? 'ring-2 ring-primary-200'
                      : ''
                  } ${
                    isHighlighted
                      ? 'ring-2 ring-primary-400 ring-offset-2 animate-[pulse_1.2s_ease-in-out_1]'
                      : ''
                  }`}
                  style={cardPresentation.style}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:gap-2">
                      {isProjectScope && task.board?.name ? (
                        <span className="inline-flex max-w-full items-center truncate rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {task.board.name}
                        </span>
                      ) : null}
                      <span
                        className="inline-flex max-w-full items-center truncate rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: getColumnColor(task) }}
                      >
                        {getColumnName(task)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}
                      >
                        {style.label}
                      </span>
                      {isCompleted && (
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          {t('export.statusCompleted')}
                        </span>
                      )}
                    </div>

                    {!showSelection && (
                      <div className="flex shrink-0 items-center gap-0.5">
                        <TaskListActionButton
                          label={t('common.view')}
                          onClick={() => setViewTask(task)}
                        >
                          <ViewIcon className="h-4 w-4" />
                        </TaskListActionButton>
                        {canEditTasks && (
                          <TaskListActionButton
                            label={t('common.edit')}
                            onClick={() => setEditTask(task)}
                          >
                            <EditIcon className="h-4 w-4" />
                          </TaskListActionButton>
                        )}
                        {canDeleteTasks && (
                          <TaskListActionButton
                            label={t('common.delete')}
                            onClick={() => void handleDeleteTask(task)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </TaskListActionButton>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex items-start gap-2 sm:mt-3 sm:gap-3">
                    {!showSelection && (
                      <div
                        className="shrink-0 pt-0.5"
                        onClick={(event) => event.stopPropagation()}
                        onPointerDown={(event) => event.stopPropagation()}
                      >
                        <Checkbox
                          checked={isCompleted}
                          disabled={!canEditTasks}
                          onChange={(event) =>
                            void handleToggleComplete(
                              task,
                              event.target.checked,
                            )
                          }
                          aria-label={t('tasks.markComplete', {
                            title: task.title,
                          })}
                        />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      {showSelection ? (
                        <p
                          className={`block w-full text-start text-sm font-semibold sm:text-base ${
                            isCompleted
                              ? 'text-gray-500 line-through'
                              : 'text-gray-900'
                          }`}
                        >
                          {task.title}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setViewTask(task)}
                          className={`block w-full text-start text-sm font-semibold hover:text-primary-700 sm:text-base ${
                            isCompleted
                              ? 'text-gray-500 line-through'
                              : 'text-gray-900'
                          }`}
                        >
                          {task.title}
                        </button>
                      )}

                      {task.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                          {task.description}
                        </p>
                      )}

                      <LabelBadges labels={labels} className="mt-2" />
                      <TaskChecklistPreview
                        items={task.checklistItems}
                        totalCount={task._count?.checklistItems}
                        interactive={!showSelection && canViewTasks}
                        onToggleItem={
                          !showSelection && canViewTasks
                            ? (itemId, isDone) =>
                                handleChecklistItemToggle(
                                  task.id,
                                  itemId,
                                  isDone,
                                )
                            : undefined
                        }
                      />

                      <div className="mt-3 flex flex-col gap-1 text-xs text-gray-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                        <AssigneeDisplay
                          task={task}
                          memberColorMap={memberColorMap}
                        />
                        <span>
                          {t('tasks.progress')}: {progressPercent}%
                        </span>
                        {task.dueDate && (
                          <span
                            className={
                              isDueDateOverdue(task.dueDate)
                                ? 'font-medium text-red-600'
                                : undefined
                            }
                          >
                            {t('tasks.duePrefix', {
                              date: formatDueDate(task.dueDate, locale),
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
            }}
          />
        )}
      </div>

      {showFilterModal && (
        <BoardFilterModal
          columns={columnsForFilter}
          filters={filters}
          onChange={setFilters}
          onClose={() => setShowFilterModal(false)}
        />
      )}

      {showCreateModal && (
        <AllTasksCreateModal
          boardId={board?.id}
          boards={isProjectScope ? projectBoards : undefined}
          columns={rawColumns}
          members={members}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreateTask}
        />
      )}

      {showImportModal && (
        <ImportTasksModal
          boardId={board?.id}
          boards={isProjectScope ? projectBoards : undefined}
          projectId={project.id}
          members={members}
          projectLabels={projectLabels}
          canCreateLabels={canCreateLabels}
          canEditTasks={canEditTasks}
          onClose={() => setShowImportModal(false)}
          onImported={handleImportComplete}
        />
      )}

      {viewTask && (
        <TaskViewModal
          task={viewTask}
          columns={rawColumns.filter(
            (column) =>
              !getTaskBoardId(viewTask) ||
              column.boardId === getTaskBoardId(viewTask),
          )}
          members={members}
          onClose={() => setViewTask(null)}
          onEdit={
            canEditTasks
              ? () => {
                  setEditTask(viewTask);
                  setViewTask(null);
                }
              : undefined
          }
          onRefresh={async () => {
            await loadData({ silent: true });
          }}
          canToggleChecklist={canViewTasks}
          canEditChecklist={canEditTasks}
        />
      )}

      {editTask && canEditTasks && (
        <TaskModal
          task={editTask}
          columns={rawColumns.filter(
            (column) =>
              !getTaskBoardId(editTask) ||
              column.boardId === getTaskBoardId(editTask),
          )}
          members={members}
          projectId={project.id}
          onClose={() => setEditTask(null)}
          onRefresh={async () => {
            await loadData({ silent: true });
          }}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
        />
      )}

      {workReportText !== null && (
        <WorkReportModal
          text={workReportText}
          onClose={() => setWorkReportText(null)}
        />
      )}
    </div>
  );
}
