'use client';

import { useMemo, useState } from 'react';
import type { Board, BoardColumn, BoardTask } from '../types';
import type { ProjectMember } from '@/features/projects/types';
import type { CreateTaskInput } from '@/features/tasks/types';
import { PRIORITY_OPTIONS, getPriorityStyles } from '@/features/tasks/types';
import { taskService } from '@/features/tasks/services/task.service';
import { useLocale } from '@/i18n/LocaleProvider';
import { Input } from '@/shared/components/ui/Input';
import { TextArea } from '@/shared/components/ui/TextArea';
import { SelectField } from '@/shared/components/ui/SelectField';
import { DateInput } from '@/shared/components/ui/DateInput';
import { Button } from '@/shared/components/ui/Button';
import { getApiErrorMessage } from '@/lib/api';
import { AppModal } from '@/shared/components/ui/AppModal';
import { MemberMultiSelect } from './MemberMultiSelect';

const FORM_ID = 'all-tasks-create-form';

interface AllTasksCreateModalProps {
  boardId?: string;
  boards?: Board[];
  columns: BoardColumn[];
  members: ProjectMember[];
  onClose: () => void;
  onCreated: (task: BoardTask) => Promise<void>;
}

export function AllTasksCreateModal({
  boardId,
  boards,
  columns,
  members,
  onClose,
  onCreated,
}: AllTasksCreateModalProps) {
  const { t } = useLocale();
  const multiBoard = (boards?.length ?? 0) > 0;
  const [selectedBoardId, setSelectedBoardId] = useState(
    () => boardId ?? boards?.[0]?.id ?? '',
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] =
    useState<CreateTaskInput['priority']>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [columnId, setColumnId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const priorityStyles = getPriorityStyles(t);
  const targetBoardId = multiBoard ? selectedBoardId : (boardId ?? '');

  const boardColumns = useMemo(() => {
    if (!multiBoard) return columns;
    return columns.filter((column) => column.boardId === selectedBoardId);
  }, [columns, multiBoard, selectedBoardId]);

  const boardOptions = useMemo(
    () =>
      (boards ?? []).map((board) => ({
        value: board.id,
        label: board.name,
      })),
    [boards],
  );

  const columnOptions = useMemo(
    () => [
      { value: '', label: t('board.unspecifiedColumn') },
      ...boardColumns.map((column) => ({
        value: column.id,
        label: column.name.includes(' · ')
          ? column.name.split(' · ').slice(1).join(' · ') || column.name
          : column.name,
      })),
    ],
    [boardColumns, t],
  );

  const priorityOptions = PRIORITY_OPTIONS.map((option) => ({
    value: option,
    label: priorityStyles[option].label,
  }));

  const handleBoardChange = (value: string) => {
    setSelectedBoardId(value);
    setColumnId('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !targetBoardId) return;

    setError('');
    setIsSubmitting(true);
    try {
      const payload: CreateTaskInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        assigneeIds: assigneeIds.length ? assigneeIds : undefined,
      };

      if (columnId) {
        payload.columnId = columnId;
      }

      const created = await taskService.createOnBoard(targetBoardId, payload);
      await onCreated(created);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppModal
      title={t('board.modals.createTask')}
      subtitle={t('board.leaveColumnEmptyHint')}
      onClose={onClose}
      width={512}
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="rounded-xl"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            isLoading={isSubmitting}
            disabled={!targetBoardId}
            className="rounded-xl"
          >
            {t('board.modals.createTask')}
          </Button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={(event) => void handleSubmit(event)}>
        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Input
            label={t('tasks.title')}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
            required
          />

          {multiBoard && (
            <SelectField
              label={t('board.boardName')}
              value={selectedBoardId}
              onChange={handleBoardChange}
              options={boardOptions}
            />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label={t('tasks.column')}
              value={columnId}
              onChange={setColumnId}
              options={columnOptions}
            />
            <SelectField
              label={t('tasks.priority')}
              value={priority}
              onChange={(value) =>
                setPriority(value as CreateTaskInput['priority'])
              }
              options={priorityOptions}
            />
          </div>

          <DateInput
            label={t('tasks.dueDateOptional')}
            value={dueDate}
            onChange={setDueDate}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('tasks.assigneesOptional')}
            </label>
            <MemberMultiSelect
              members={members}
              value={assigneeIds}
              onChange={setAssigneeIds}
            />
          </div>

          <TextArea
            label={t('tasks.descriptionOptional')}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />
        </div>
      </form>
    </AppModal>
  );
}
