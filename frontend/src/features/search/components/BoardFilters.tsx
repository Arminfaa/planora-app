'use client';

import type { BoardColumn } from '@/features/board/types';
import { BoardFilterForm } from './BoardFilterForm';
import type { TaskFilters } from '../types/filter';

interface BoardFiltersProps {
  columns: BoardColumn[];
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
}

/** @deprecated Use BoardFilterModal for board page filtering */
export function BoardFilters({
  columns,
  filters,
  onChange,
}: BoardFiltersProps) {
  return (
    <div className="mb-4 space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-900">Filters</p>
      </div>
      <BoardFilterForm
        columns={columns}
        filters={filters}
        onChange={onChange}
      />
    </div>
  );
}
