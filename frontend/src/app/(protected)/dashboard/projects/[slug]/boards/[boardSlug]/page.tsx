'use client';

import { useParams } from 'next/navigation';
import { KanbanBoard } from '@/features/board/components/KanbanBoard';
import { useBoard } from '@/features/board/hooks/useBoard';
import { useProjectPermissions } from '@/features/permissions/hooks/useProjectPermissions';
import { useProjectContext } from '@/features/projects/context/ProjectContext';
import { useLocale } from '@/i18n/LocaleProvider';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';

export default function BoardPage() {
  const { t } = useLocale();
  const params = useParams<{ slug: string; boardSlug: string }>();
  const { project } = useProjectContext();
  const { board, isLoading, error, refetch, revision } = useBoard(
    params.slug,
    params.boardSlug,
  );

  const { can } = useProjectPermissions(project);

  if (isLoading) return <LoadingSpinner />;

  if (error || !board) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || t('common.boardNotFound')}
      </div>
    );
  }

  return (
    <KanbanBoard
      board={board}
      projectId={project.id}
      projectSlug={params.slug}
      revision={revision}
      onRefresh={refetch}
      canDeleteColumns={can('column.delete')}
      canReorderColumns={can('column.reorder')}
      canManageBackground={can('board.change_background')}
      canCreateColumns={can('column.create')}
      canEditColumns={can('column.edit')}
      canCreateTasks={can('task.create')}
      canEditTasks={can('task.edit')}
      canMoveTasks={can('task.move')}
      canViewTasks={can('task.view')}
    />
  );
}
