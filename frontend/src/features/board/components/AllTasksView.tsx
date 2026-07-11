'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
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
import { AllTasksCreateModal } from './AllTasksCreateModal';
import { ImportTasksModal } from './ImportTasksModal';
import { TaskChecklistPreview } from './TaskChecklistPreview';
import { AssigneeDisplay } from './AssigneeDisplay';
import { EditIcon } from './EditIcon';
import { TaskListActionButton } from './TaskListActionButton';
import { TrashIcon } from './TrashIcon';
import { ViewIcon } from './ViewIcon';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { Button } from '@/shared/components/ui/Button';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { SelectField } from '@/shared/components/ui/SelectField';
import { getApiErrorMessage, isForbiddenError } from '@/lib/api';
import { exportBoardTasksToExcel } from '../utils/exportTasksToExcel';
import { useLocale } from '@/i18n/LocaleProvider';
import { BackChevronIcon } from '@/shared/components/ui/BackChevronIcon';

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
  boardSlug: string;
}

export function AllTasksView({
  project,
  projectSlug,
  boardSlug,
}: AllTasksViewProps) {
  const { t, locale } = useLocale();
  const priorityStylesMap = getPriorityStyles(t);
  const [board, setBoard] = useState<Board | null>(null);
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
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [bulkTargetColumnId, setBulkTargetColumnId] = useState('');
  const [isBulkMoving, setIsBulkMoving] = useState(false);

  const { can } = useProjectPermissions(project);
  const members = useProjectMembers(project.id);
  const { labels: projectLabels } = useProjectLabels(project.id);
  const canCreateTasks = can('task.create');
  const canEditTasks = can('task.edit');
  const canDeleteTasks = can('task.delete');
  const canViewTasks = can('task.view');
  const canMoveTasks = can('task.move');
  const canCreateLabels = can('label.create');
  const memberColorMap = useMemberColorMap(members, tasks);

  const columns = board?.columns ?? [];

  const columnsForFilter = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => task.columnId === column.id),
      })),
    [columns, tasks],
  );

  const loadData = useCallback(async () => {
    if (!canViewTasks) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const boardData = await boardService.getBySlug(projectSlug, boardSlug);
      setBoard(boardData);
      const taskData = await taskService.listByBoard(boardData.id);
      setTasks(taskData);
      setViewTask((prev) =>
        prev ? (taskData.find((task) => task.id === prev.id) ?? prev) : null,
      );
      setEditTask((prev) =>
        prev ? (taskData.find((task) => task.id === prev.id) ?? prev) : null,
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
      setBoard(null);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [boardSlug, canViewTasks, projectSlug]);

  useEffect(() => {
    void loadData();
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

  const columnMoveOptions = useMemo(
    () =>
      columns.map((column) => ({
        value: column.id,
        label: column.name,
      })),
    [columns],
  );

  const toggleTaskSelection = useCallback((taskId: string, selected: boolean) => {
    setSelectedTaskIds((current) => {
      const next = new Set(current);
      if (selected) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  }, []);

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
    setBulkTargetColumnId('');
  }, []);

  const handleBulkMove = useCallback(async () => {
    if (!canMoveTasks || !bulkTargetColumnId || selectedCount === 0 || !board)
      return;

    const taskIds = Array.from(selectedTaskIds);
    setIsBulkMoving(true);
    setActionError('');

    try {
      await taskService.bulkMoveToColumn(board.id, {
        taskIds,
        columnId: bulkTargetColumnId,
      });
      clearSelection();
      await loadData();
    } catch (err) {
      if (!isForbiddenError(err)) {
        setActionError(getApiErrorMessage(err));
      }
    } finally {
      setIsBulkMoving(false);
    }
  }, [
    board,
    bulkTargetColumnId,
    canMoveTasks,
    clearSelection,
    loadData,
    selectedCount,
    selectedTaskIds,
  ]);

  const handleCreateTask = async () => {
    setShowCreateModal(false);
    await loadData();
  };

  const handleTaskSave = async () => {
    await loadData();
    setEditTask(null);
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
    columns.find((column) => column.id === task.columnId)?.name ??
    t('common.emDash');

  const getColumnColor = (task: BoardTask) =>
    task.column?.color ??
    columns.find((column) => column.id === task.columnId)?.color ??
    '#6B7280';

  const handleImportComplete = async () => {
    setShowImportModal(false);
    await loadData();
  };

  const handleExportExcel = () => {
    if (!board || tasks.length === 0) return;
    exportBoardTasksToExcel(tasks, board, columns, locale);
  };

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
      setActionError('');
      updateTaskInList(task.id, (current) => ({
        ...current,
        isCompleted: completed,
        completeDate: completed ? new Date().toISOString() : null,
        progress: completed ? 100 : current.progress,
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
        }));
      } catch (err) {
        updateTaskInList(task.id, (current) => ({
          ...current,
          isCompleted: Boolean(task.isCompleted),
          completeDate: previousCompleteDate,
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

      setActionError('');
      updateTaskInList(taskId, (current) => ({
        ...current,
        checklistItems: current.checklistItems?.map((item) =>
          item.id === itemId ? { ...item, isDone } : item,
        ),
      }));

      try {
        await checklistService.update(taskId, itemId, { isDone });
      } catch (err) {
        if (previousItems) {
          updateTaskInList(taskId, (current) => ({
            ...current,
            checklistItems: previousItems,
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
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !board) {
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href={`/dashboard/projects/${projectSlug}/boards/${boardSlug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        <BackChevronIcon />
        {t('board.backToProject')}
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('board.allTasks')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {board.name} ·{' '}
            {tasks.length === 1
              ? t('board.taskCount', { count: tasks.length })
              : t('board.taskCountPlural', { count: tasks.length })}
            {hasActiveView && (
              <span>
                {' '}
                · {t('board.showingCount', { count: filteredTasks.length })}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleExportExcel}
            disabled={tasks.length === 0}
            aria-label={t('board.exportAriaLabel')}
          >
            <svg
              className="me-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {t('board.exportExcel')}
          </Button>

          {canCreateTasks && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowImportModal(true)}
              aria-label={t('board.importAriaLabel')}
            >
              <svg
                className="me-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
                />
              </svg>
              {t('board.importExcel')}
            </Button>
          )}

          {canCreateTasks && (
            <Button type="button" onClick={() => setShowCreateModal(true)}>
              + {t('board.newTask')}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <SearchInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('search.searchTasks')}
            aria-label={t('search.searchTasks')}
            className="rounded-xl border-gray-200 bg-white shadow-sm"
          />
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowFilterModal(true)}
        >
          {t('common.filter')}
          {countActiveFilters(filters) > 0 && (
            <span className="ms-2 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-700">
              {countActiveFilters(filters)}
            </span>
          )}
        </Button>
      </div>

      {actionError && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {canMoveTasks && filteredTasks.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <Checkbox
              checked={allFilteredSelected}
              indeterminate={someFilteredSelected}
              onChange={(event) =>
                toggleSelectAllFiltered(event.target.checked)
              }
            />
            <span>
              {t('board.bulkSelectAll')}
              {selectedCount > 0 && (
                <span className="ms-1 font-medium text-primary-700">
                  · {t('board.bulkSelectedCount', { count: selectedCount })}
                </span>
              )}
            </span>
          </label>

          {selectedCount > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-[200px]">
                <SelectField
                  label={t('board.bulkMoveToColumn')}
                  value={bulkTargetColumnId}
                  onChange={(value) => setBulkTargetColumnId(String(value))}
                  options={columnMoveOptions}
                  showSearch
                  optionFilterProp="label"
                  placeholder={t('board.bulkMoveToColumn')}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => void handleBulkMove()}
                  disabled={!bulkTargetColumnId || isBulkMoving}
                >
                  {isBulkMoving ? t('board.bulkMoving') : t('board.bulkMove')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={clearSelection}
                  disabled={isBulkMoving}
                >
                  {t('board.bulkClearSelection')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <p className="text-gray-600">
              {tasks.length === 0
                ? t('board.noTasksYet')
                : t('board.noTasksMatch')}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const style = priorityStylesMap[task.priority];
            const labels = normalizeTaskLabels(task.labels);
            const isCompleted = Boolean(task.isCompleted);
            const isSelected = selectedTaskIds.has(task.id);
            const cardPresentation = getTaskAssigneeCardPresentation(
              task,
              memberColorMap,
              { isCompleted },
            );

            return (
              <div
                key={task.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3"
              >
                {canMoveTasks && (
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
                  className={`min-w-0 flex-1 rounded-xl p-3 shadow-sm transition hover:border-primary-200 hover:shadow-md sm:p-4 ${
                    cardPresentation.className
                  } ${isSelected ? 'ring-2 ring-primary-200' : ''}`}
                  style={cardPresentation.style}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:gap-2">
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
                  </div>

                  <div className="mt-2 flex items-start gap-2 sm:mt-3 sm:gap-3">
                    <div
                      className="shrink-0 pt-0.5"
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <Checkbox
                        checked={isCompleted}
                        disabled={!canEditTasks}
                        onChange={(event) =>
                          void handleToggleComplete(task, event.target.checked)
                        }
                        aria-label={t('tasks.markComplete', {
                          title: task.title,
                        })}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
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

                      {task.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                          {task.description}
                        </p>
                      )}

                      <LabelBadges labels={labels} className="mt-2" />
                      <TaskChecklistPreview
                        items={task.checklistItems}
                        interactive={canViewTasks}
                        onToggleItem={
                          canViewTasks
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
          })
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
          boardId={board.id}
          columns={columns}
          members={members}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreateTask}
        />
      )}

      {showImportModal && (
        <ImportTasksModal
          boardId={board.id}
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
          columns={columns}
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
          onRefresh={loadData}
          canToggleChecklist={canViewTasks}
          canEditChecklist={canEditTasks}
        />
      )}

      {editTask && canEditTasks && (
        <TaskModal
          task={editTask}
          columns={columns}
          members={members}
          projectId={project.id}
          onClose={() => setEditTask(null)}
          onRefresh={loadData}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
        />
      )}
    </div>
  );
}
