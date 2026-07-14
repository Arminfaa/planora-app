'use client';

import { useParams } from 'next/navigation';
import { AllTasksView } from '@/features/board/components/AllTasksView';
import { useProjectContext } from '@/features/projects/context/ProjectContext';

export default function ProjectAllTasksPage() {
  const params = useParams<{ slug: string }>();
  const { project } = useProjectContext();

  return (
    <AllTasksView project={project} projectSlug={params.slug} scope="project" />
  );
}
