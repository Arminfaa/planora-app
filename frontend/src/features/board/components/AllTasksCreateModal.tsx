'use client';

import { useMemo, useState } from 'react';
import { Button } from 'antd';
import type { BoardColumn, BoardTask } from '../types';
import type { ProjectMember } from '@/features/projects/types';
import type { CreateTaskInput } from '@/features/tasks/types';
import { PRIORITY_OPTIONS, getPriorityStyles } from '@/features/tasks/types';
import { taskService } from '@/features/tasks/services/task.service';
import { useLocale } from '@/i18n/LocaleProvider';
import { Input } from '@/shared/components/ui/Input';
import { TextArea } from '@/shared/components/ui/TextArea';
import { SelectField } from '@/shared/components/ui/SelectField';
import { DateInput } from '@/shared/components/ui/DateInput';
import { getApiErrorMessage } from '@/lib/api';
import { AppModal } from '@/shared/components/ui/AppModal';
import { MemberMultiSelect } from './MemberMultiSelect';

const FORM_ID = 'all-tasks-create-form';

interface AllTasksCreateModalProps {
  boardId: string;
  columns: BoardColumn[];
  members: ProjectMember[];
  onClose: () => void;
  onCreated: (task: BoardTask) => Promise<void>;
}

export function AllTasksCreateModal({
  boardId,
  columns,
  members,
  onClose,
  onCreated,
}: AllTasksCreateModalProps) {
  const { t } = useLocale();
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

  const columnOptions = useMemo(
    () => [
      { value: '', label: t('board.unspecifiedColumn') },
      ...columns.map((column) => ({ value: column.id, label: column.name })),
    ],
    [columns, t],
  );

  const priorityOptions = PRIORITY_OPTIONS.map((option) => ({
    value: option,
    label: priorityStyles[option].label,
  }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

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

      const created = await taskService.createOnBoard(boardId, payload);
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
      title={t('board.newTask')}
      subtitle={t('board.leaveColumnEmptyHint')}
      onClose={onClose}
      width={512}
      footer={
        <>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="primary"
            htmlType="submit"
            form={FORM_ID}
            loading={isSubmitting}
          >
            {t('board.modals.createTask')}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={(event) => void handleSubmit(event)}>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
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

          <TextArea
            label={t('tasks.descriptionOptional')}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
          />

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
        </div>
      </form>
    </AppModal>
  );
}
