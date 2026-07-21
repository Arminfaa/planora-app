'use client';

import { ProjectRouteSkeleton } from '@/features/projects/components/skeletons/ProjectRouteSkeleton';

export default function ProjectHubLoading() {
  return <ProjectRouteSkeleton includeShell={false} />;
}
