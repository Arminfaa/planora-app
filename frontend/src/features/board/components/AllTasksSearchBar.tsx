'use client';

import { useLocale } from '@/i18n/LocaleProvider';
import { Button } from '@/shared/components/ui/Button';
import { SearchInput } from '@/shared/components/ui/SearchInput';

interface AllTasksSearchBarProps {
  searchQuery: string;
  activeFilterCount: number;
  hasActiveView: boolean;
  disabled?: boolean;
  onSearchChange: (value: string) => void;
  onOpenFilters: () => void;
  onClearView: () => void;
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 5h18M6 12h12M10 19h4"
      />
    </svg>
  );
}

export function AllTasksSearchBar({
  searchQuery,
  activeFilterCount,
  hasActiveView,
  disabled = false,
  onSearchChange,
  onOpenFilters,
  onClearView,
}: AllTasksSearchBarProps) {
  const { t } = useLocale();

  return (
    <div
      className={`rounded-2xl border bg-white p-3 shadow-sm transition ${
        disabled ? 'border-amber-100 bg-amber-50/30' : 'border-gray-200/80'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <SearchInput
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('search.searchTasks')}
            aria-label={t('search.searchTasks')}
            disabled={disabled}
            className="rounded-xl border-gray-200 bg-gray-50/80"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onOpenFilters}
            disabled={disabled}
            className="rounded-xl"
          >
            <FilterIcon className="me-2 h-4 w-4" />
            {t('common.filter')}
            {activeFilterCount > 0 && (
              <span className="ms-2 inline-flex min-w-5 items-center justify-center rounded-full bg-primary-100 px-1.5 py-0.5 text-xs font-semibold text-primary-700">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {hasActiveView && !disabled && (
            <Button
              type="button"
              variant="ghost"
              onClick={onClearView}
              className="rounded-xl text-primary-700 hover:bg-primary-50 hover:text-primary-800"
            >
              {activeFilterCount > 0
                ? t('search.clearAllWithCount', { count: activeFilterCount })
                : t('common.clearSearch')}
            </Button>
          )}
        </div>
      </div>
      {disabled && (
        <p className="mt-2 text-xs text-amber-800/80">
          {t('board.bulkHints.selectTasksFirst')}
        </p>
      )}
    </div>
  );
}
