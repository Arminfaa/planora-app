'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectPermissions } from '@/features/permissions/hooks/useProjectPermissions';
import { projectService } from '../services/project.service';
import { useProjectContext } from '../context/ProjectContext';
import { EditProjectModal } from './EditProjectModal';
import { ProjectRolesPanel } from './ProjectRolesPanel';
import type { UpdateProjectInput } from '../types';
import { getApiErrorMessage, isForbiddenError } from '@/lib/api';

export function ProjectSettingsView() {
  const router = useRouter();
  const {
    project,
    slug,
    customRoles,
    setCustomRoles,
    refreshProject,
    setProject,
  } = useProjectContext();
  const { can } = useProjectPermissions(project);

  const [showEditProject, setShowEditProject] = useState(false);
  const [actionError, setActionError] = useState('');

  const canEditProject = can('project.edit');
  const canDeleteProject = can('project.delete');
  const canManageRoles = can('role.manage');
  const isCustomProject = project.permissionMode === 'CUSTOM';

  const hasAccess =
    canEditProject || canDeleteProject || (isCustomProject && canManageRoles);

  const handleUpdateProject = async (
    projectId: string,
    data: UpdateProjectInput,
  ) => {
    setActionError('');
    await projectService.update(projectId, data);
    const refreshed = await refreshProject();
    if (refreshed && refreshed.slug !== slug) {
      router.replace(`/dashboard/projects/${refreshed.slug}/settings`);
    }
  };

  const handleDeleteProject = async () => {
    if (
      !confirm(
        `Delete project "${project.name}"? All boards, columns, and tasks will be removed.`,
      )
    ) {
      return;
    }

    setActionError('');
    try {
      await projectService.delete(project.id);
      router.push('/dashboard');
    } catch (err) {
      if (!isForbiddenError(err)) {
        setActionError(getApiErrorMessage(err));
      }
    }
  };

  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-500">
            You do not have permission to manage project settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      {actionError && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Project details</h2>
        <p className="mt-1 text-sm text-gray-500">
          Update the project name, description, and permission mode.
        </p>
        {canEditProject && (
          <button
            type="button"
            onClick={() => setShowEditProject(true)}
            className="mt-4 inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Edit project
          </button>
        )}
      </section>

      {isCustomProject && (
        <ProjectRolesPanel
          projectId={project.id}
          canManage={canManageRoles}
          currentUserRole={{
            id: project.currentUserRoleDefinitionId,
            name: project.currentUserRoleName,
            permissions: project.currentUserPermissions ?? [],
          }}
          onRolesChange={setCustomRoles}
        />
      )}

      {canDeleteProject && (
        <section className="rounded-xl border border-red-200 bg-red-50/50 p-6">
          <h2 className="text-lg font-semibold text-red-900">Danger zone</h2>
          <p className="mt-1 text-sm text-red-700">
            Deleting this project removes all boards, tasks, and messages
            permanently.
          </p>
          <button
            type="button"
            onClick={() => void handleDeleteProject()}
            className="mt-4 inline-flex items-center rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50"
          >
            Delete project
          </button>
        </section>
      )}

      {showEditProject && (
        <EditProjectModal
          project={project}
          canManageRoles={canManageRoles}
          onClose={() => setShowEditProject(false)}
          onSubmit={handleUpdateProject}
          onRolesUpdated={(roles) => {
            setCustomRoles(roles);
            void refreshProject().then((refreshed) => {
              if (refreshed) setProject(refreshed);
            });
          }}
        />
      )}
    </div>
  );
}
