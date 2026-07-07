'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { projectService } from '../services/project.service';

interface DeleteProjectInput {
  projectId: string;
  slug: string;
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ projectId }: DeleteProjectInput) =>
      projectService.delete(projectId),
    onSuccess: (_data, { slug, projectId }) => {
      queryClient.removeQueries({ queryKey: queryKeys.projects.detail(slug) });
      queryClient.removeQueries({
        queryKey: queryKeys.projects.members(projectId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.projects.boards(projectId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.projects.roles(projectId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });

  return {
    deleteProject: mutation.mutateAsync,
    isDeleting: mutation.isPending,
  };
}
