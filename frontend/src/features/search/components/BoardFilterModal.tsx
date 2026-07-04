'use client';

import { Button } from 'antd';
import type { BoardColumn } from '@/features/board/types';
import type { TaskFilters } from '../types/filter';
import { countActiveFilters } from '../utils/taskFilters';
import { BoardFilterForm } from './BoardFilterForm';
import { AppModal } from '@/shared/components/ui/AppModal';

interface BoardFilterModalProps {
  columns: BoardColumn[];
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  onClose: () => void;
}

export function BoardFilterModal({
  columns,
  filters,
  onChange,
  onClose,
}: BoardFilterModalProps) {
  const activeCount = countActiveFilters(filters);

  return (
    <AppModal
      title="Filter tasks"
      subtitle={
        activeCount > 0
          ? `${activeCount} active filter${activeCount !== 1 ? 's' : ''}`
          : undefined
      }
      onClose={onClose}
      width={512}
      footer={
        <Button type="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <BoardFilterForm
        columns={columns}
        filters={filters}
        onChange={onChange}
        variant="modal"
      />
    </AppModal>
  );
}
