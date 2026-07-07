'use client';

import { Button } from 'antd';
import type { BoardColumn } from '@/features/board/types';
import type { TaskFilters } from '../types/filter';
import { countActiveFilters } from '../utils/taskFilters';
import { BoardFilterForm } from './BoardFilterForm';
import { useLocale } from '@/i18n/LocaleProvider';
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
  const { t } = useLocale();
  const activeCount = countActiveFilters(filters);

  return (
    <AppModal
      title={t('board.filterTasks')}
      subtitle={
        activeCount > 0
          ? activeCount === 1
            ? t('board.activeFilters', { count: activeCount })
            : t('board.activeFiltersPlural', { count: activeCount })
          : undefined
      }
      onClose={onClose}
      width={512}
      footer={
        <Button type="primary" onClick={onClose}>
          {t('common.done')}
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
