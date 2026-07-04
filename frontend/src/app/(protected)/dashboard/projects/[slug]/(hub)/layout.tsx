'use client';

import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { ProjectProvider } from '@/features/projects/context/ProjectContext';
import { ProjectLayoutShell } from '@/features/projects/components/ProjectLayoutShell';

export default function ProjectHubLayout({
  children,
}: {
  children: ReactNode;
}) {
  const params = useParams<{ slug: string }>();

  return (
    <ProjectProvider slug={params.slug}>
      <ProjectLayoutShell>{children}</ProjectLayoutShell>
    </ProjectProvider>
  );
}
