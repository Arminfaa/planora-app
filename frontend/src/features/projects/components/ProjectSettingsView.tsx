'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useProjectPermissions } from '@/features/permissions/hooks/useProjectPermissions';
import { useDeleteProject } from '../hooks/useDeleteProject';
import { projectService } from '../services/project.service';
import { useProjectContext } from '../context/ProjectContext';
import { DeleteProjectModal } from './DeleteProjectModal';
import { EditProjectModal } from './EditProjectModal';
import { ProjectRolesPanel } from './ProjectRolesPanel';
import { WorkingCalendarPanel } from './WorkingCalendarPanel';
import { replaceProjectSlugInPath } from '../utils/projectPaths';
import type { UpdateProjectInput } from '../types';
import { getApiErrorMessage, isForbiddenError } from '@/lib/api';
import { useLocale } from '@/i18n/LocaleProvider';

export function ProjectSettingsView() {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const {
    project,
    customRoles,
    setCustomRoles,
    applyProjectUpdate,
    boardCount,
    memberCount,
  } = useProjectContext();
  const { deleteProject, isDeleting } = useDeleteProject();
  const { can } = useProjectPermissions(project);

  const [showEditProject, setShowEditProject] = useState(false);
  const [showDeleteProject, setShowDeleteProject] = useState(false);
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
    const updated = await projectService.update(projectId, data);
    const { slugChanged, previousSlug, nextSlug } = applyProjectUpdate(updated);

    if (slugChanged) {
      router.replace(
        replaceProjectSlugInPath(pathname, previousSlug, nextSlug),
      );
    }
  };

  const handleDeleteProject = async () => {
    setActionError('');
    try {
      await deleteProject({ projectId: project.id, slug: project.slug });
      setShowDeleteProject(false);
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
            {t('projects.noSettingsPermission')}
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
        <h2 className="text-lg font-semibold text-gray-900">
          {t('projects.projectDetails')}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {t('projects.projectDetailsHint')}
        </p>
        {canEditProject && (
          <button
            type="button"
            onClick={() => setShowEditProject(true)}
            className="mt-4 inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            {t('projects.editProject')}
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

      {canEditProject ? (
        <WorkingCalendarPanel projectId={project.id} canEdit />
      ) : null}

      {canDeleteProject && (
        <section className="rounded-xl border border-red-200 bg-red-50/50 p-6">
          <h2 className="text-lg font-semibold text-red-900">
            {t('settings.dangerZone')}
          </h2>
          <p className="mt-1 text-sm text-red-700">
            {t('projects.dangerZoneDescription')}
          </p>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => setShowDeleteProject(true)}
            className="mt-4 inline-flex items-center rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? t('common.deleting') : t('settings.deleteProject')}
          </button>
        </section>
      )}

      {showDeleteProject && (
        <DeleteProjectModal
          project={project}
          boardCount={boardCount}
          memberCount={memberCount}
          open={showDeleteProject}
          isDeleting={isDeleting}
          onClose={() => setShowDeleteProject(false)}
          onConfirm={handleDeleteProject}
        />
      )}

      {showEditProject && (
        <EditProjectModal
          project={project}
          canManageRoles={canManageRoles}
          onClose={() => setShowEditProject(false)}
          onSubmit={handleUpdateProject}
          onRolesUpdated={(roles) => {
            setCustomRoles(roles);
            void projectService.getById(project.id).then((refreshed) => {
              applyProjectUpdate(refreshed);
            });
          }}
        />
      )}
    </div>
  );
}
