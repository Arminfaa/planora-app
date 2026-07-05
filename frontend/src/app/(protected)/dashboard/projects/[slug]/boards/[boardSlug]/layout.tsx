'use client';

import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { ProjectProvider } from '@/features/projects/context/ProjectContext';

export default function BoardLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ slug: string }>();

  return <ProjectProvider slug={params.slug}>{children}</ProjectProvider>;
}
