'use client';

import { useParams } from 'next/navigation';
import { AllTasksView } from '@/features/board/components/AllTasksView';
import { useProjectContext } from '@/features/projects/context/ProjectContext';

export default function AllTasksPage() {
  const params = useParams<{ slug: string; boardSlug: string }>();
  const { project } = useProjectContext();

  return (
    <AllTasksView
      project={project}
      projectSlug={params.slug}
      boardSlug={params.boardSlug}
    />
  );
}
