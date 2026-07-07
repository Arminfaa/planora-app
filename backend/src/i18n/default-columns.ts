import { getRequestLocale } from './context';
import type { Locale } from './types';

export interface DefaultKanbanColumnDefinition {
  name: string;
  color: string;
  position: number;
}

const DEFAULT_KANBAN_COLUMNS: Record<
  Locale,
  DefaultKanbanColumnDefinition[]
> = {
  en: [
    { name: 'To Do', color: '#6B7280', position: 0 },
    { name: 'In Progress', color: '#3B82F6', position: 1 },
    { name: 'Done', color: '#10B981', position: 2 },
  ],
  fa: [
    { name: 'انجام نشده', color: '#6B7280', position: 0 },
    { name: 'در حال انجام', color: '#3B82F6', position: 1 },
    { name: 'انجام شده', color: '#10B981', position: 2 },
  ],
};

export function getDefaultKanbanColumnDefinitions(
  locale: Locale = getRequestLocale(),
): DefaultKanbanColumnDefinition[] {
  return DEFAULT_KANBAN_COLUMNS[locale];
}
