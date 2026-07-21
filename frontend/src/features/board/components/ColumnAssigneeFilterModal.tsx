'use client';

import { Button } from 'antd';
import { AppModal } from '@/shared/components/ui/AppModal';
import { SelectField } from '@/shared/components/ui/SelectField';
import { UNASSIGNED_ASSIGNEE } from '@/features/search/types/filter';
import { useLocale } from '@/i18n/LocaleProvider';

export interface ColumnAssigneeOption {
  value: string;
  label: string;
}

interface ColumnAssigneeFilterModalProps {
  open: boolean;
  columnName: string;
  value: string | null;
  options: ColumnAssigneeOption[];
  onChange: (value: string | null) => void;
  onClose: () => void;
}

export function ColumnAssigneeFilterModal({
  open,
  columnName,
  value,
  options,
  onChange,
  onClose,
}: ColumnAssigneeFilterModalProps) {
  const { t } = useLocale();

  const selectOptions = [
    { value: '', label: t('search.anyAssignee') },
    { value: UNASSIGNED_ASSIGNEE, label: t('tasks.unassigned') },
    ...options,
  ];

  return (
    <AppModal
      open={open}
      title={t('board.filterColumnAssignee')}
      subtitle={columnName}
      onClose={onClose}
      width={420}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            type="text"
            disabled={!value}
            onClick={() => onChange(null)}
          >
            {t('search.clearFilters')}
          </Button>
          <Button type="primary" onClick={onClose}>
            {t('common.done')}
          </Button>
        </div>
      }
    >
      <SelectField
        label={t('search.filterByAssignee')}
        value={value ?? ''}
        onChange={(next) => onChange(next === '' ? null : next)}
        options={selectOptions}
        showSearch
        optionFilterProp="label"
        popupMatchSelectWidth
      />
    </AppModal>
  );
}
