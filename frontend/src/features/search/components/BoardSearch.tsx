'use client';

import { SearchInput } from '@/shared/components/ui/SearchInput';

interface BoardSearchProps {
  value: string;
  onChange: (value: string) => void;
  matchCount: number;
  totalCount: number;
  hasActiveView?: boolean;
}

export function BoardSearch({
  value,
  onChange,
  matchCount,
  totalCount,
  hasActiveView = false,
}: BoardSearchProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-[220px] flex-1 sm:max-w-xs">
        <SearchInput
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search tasks on this board..."
          aria-label="Search tasks on board"
          className="rounded-lg border-gray-300 bg-white shadow-sm"
        />
      </div>

      {hasActiveView && (
        <p className="text-sm text-gray-500">
          {matchCount} of {totalCount} tasks
        </p>
      )}
    </div>
  );
}
