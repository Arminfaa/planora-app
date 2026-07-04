'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AllTasksView } from '@/features/board/components/AllTasksView';
import { projectService } from '@/features/projects/services/project.service';
import type { Project } from '@/features/projects/types';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { getApiErrorMessage } from '@/lib/api';

export default function AllTasksPage() {
  const params = useParams<{ slug: string; boardSlug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await projectService.getBySlug(params.slug);
        setProject(data);
      } catch (err) {
        setProject(null);
        setError(getApiErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProject();
  }, [params.slug]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || 'Project not found'}
        </div>
      </div>
    );
  }

  return (
    <AllTasksView
      project={project}
      projectSlug={params.slug}
      boardSlug={params.boardSlug}
    />
  );
}
