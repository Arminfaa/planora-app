'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { projectService } from '../services/project.service';
import type { Project, ProjectRoleDefinition } from '../types';
import { getApiErrorMessage } from '@/lib/api';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';

interface ProjectContextValue {
  project: Project;
  slug: string;
  customRoles: ProjectRoleDefinition[];
  setCustomRoles: (roles: ProjectRoleDefinition[]) => void;
  refreshProject: () => Promise<Project | null>;
  setProject: (project: Project) => void;
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
  const [project, setProject] = useState<Project | null>(null);
  const [customRoles, setCustomRoles] = useState<ProjectRoleDefinition[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);
  const [boardCount, setBoardCount] = useState(0);

  const refreshProject = useCallback(async () => {
    try {
      const data = await projectService.getBySlug(slug);
      setProject(data);
      setBoardCount(data._count?.boards ?? 0);
      setMemberCount(data._count?.members ?? 0);
      return data;
    } catch (err) {
      setError(getApiErrorMessage(err));
      setProject(null);
      return null;
    }
  }, [slug]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      await refreshProject();
      setLoading(false);
    };
    void load();
  }, [refreshProject]);

  useEffect(() => {
    if (!project?.id || project.permissionMode !== 'CUSTOM') {
      setCustomRoles([]);
      return;
    }

    const loadRoles = async () => {
      try {
        const roles = await projectService.listRoles(project.id);
        setCustomRoles(roles);
      } catch {
        setCustomRoles([]);
      }
    };

    void loadRoles();
  }, [project?.id, project?.permissionMode]);

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
            memberCount,
            setMemberCount,
            boardCount,
            setBoardCount,
          }
        : null,
    [project, slug, customRoles, refreshProject, memberCount, boardCount],
  );

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

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
