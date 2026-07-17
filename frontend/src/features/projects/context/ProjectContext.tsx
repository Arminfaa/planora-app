'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { projectService } from '../services/project.service';
import type { Project, ProjectRoleDefinition } from '../types';
import { getApiErrorMessage } from '@/lib/api';
import { queryKeys, STALE_TIME } from '@/lib/query-keys';
interface ProjectContextValue {
  project: Project;
  slug: string;
  customRoles: ProjectRoleDefinition[];
  setCustomRoles: (roles: ProjectRoleDefinition[]) => void;
  refreshProject: () => Promise<Project | null>;
  setProject: (project: Project) => void;
  applyProjectUpdate: (project: Project) => {
    slugChanged: boolean;
    previousSlug: string;
    nextSlug: string;
  };
  memberCount: number;
  setMemberCount: (count: number) => void;
  boardCount: number;
  setBoardCount: (count: number) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const [memberCountOverride, setMemberCountOverride] = useState<number | null>(
    null,
  );
  const [boardCountOverride, setBoardCountOverride] = useState<number | null>(
    null,
  );

  const projectQuery = useQuery({
    queryKey: queryKeys.projects.detail(slug),
    queryFn: () => projectService.getBySlug(slug),
    staleTime: STALE_TIME.projectDetail,
  });

  const project = projectQuery.data ?? null;

  const rolesQuery = useQuery({
    queryKey: queryKeys.projects.roles(project?.id ?? ''),
    queryFn: () => projectService.listRoles(project!.id),
    enabled: Boolean(project?.id && project.permissionMode === 'CUSTOM'),
    staleTime: STALE_TIME.roles,
  });

  const customRoles = rolesQuery.data ?? [];

  const setCustomRoles = useCallback(
    (roles: ProjectRoleDefinition[]) => {
      if (!project?.id) return;
      queryClient.setQueryData(queryKeys.projects.roles(project.id), roles);
    },
    [project?.id, queryClient],
  );

  const refreshProject = useCallback(async () => {
    const result = await projectQuery.refetch();
    return result.data ?? null;
  }, [projectQuery]);

  const setProject = useCallback(
    (nextProject: Project) => {
      queryClient.setQueryData(queryKeys.projects.detail(slug), nextProject);
    },
    [queryClient, slug],
  );

  const applyProjectUpdate = useCallback(
    (updatedProject: Project) => {
      const slugChanged = updatedProject.slug !== slug;

      if (slugChanged) {
        queryClient.setQueryData(
          queryKeys.projects.detail(updatedProject.slug),
          updatedProject,
        );
        queryClient.removeQueries({ queryKey: queryKeys.projects.detail(slug) });
      } else {
        queryClient.setQueryData(
          queryKeys.projects.detail(slug),
          updatedProject,
        );
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });

      return {
        slugChanged,
        previousSlug: slug,
        nextSlug: updatedProject.slug,
      };
    },
    [queryClient, slug],
  );

  const memberCount = memberCountOverride ?? project?._count?.members ?? 0;
  const boardCount = boardCountOverride ?? project?._count?.boards ?? 0;

  const value = useMemo(
    () =>
      project
        ? {
            project,
            slug,
            customRoles,
            setCustomRoles,
            refreshProject,
            setProject,
            applyProjectUpdate,
            memberCount,
            setMemberCount: setMemberCountOverride,
            boardCount,
            setBoardCount: setBoardCountOverride,
          }
        : null,
    [
      project,
      slug,
      customRoles,
      setCustomRoles,
      refreshProject,
      setProject,
      applyProjectUpdate,
      memberCount,
      boardCount,
    ],
  );

  if (projectQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6">
        <div className="h-8 w-56 rounded-lg bg-gray-200" />
        <div className="mt-3 h-4 w-80 max-w-full rounded bg-gray-100" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-36 rounded-xl border border-gray-100 bg-white shadow-sm"
            />
          ))}
        </div>
      </div>
    );
  }

  const error = projectQuery.error
    ? getApiErrorMessage(projectQuery.error)
    : '';

  if (error || !value) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || 'Project not found'}
        </div>
      </div>
    );
  }

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}

export function useProjectContext(): ProjectContextValue {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within ProjectProvider');
  }
  return context;
}

export function useOptionalProjectContext(): ProjectContextValue | null {
  return useContext(ProjectContext);
}
