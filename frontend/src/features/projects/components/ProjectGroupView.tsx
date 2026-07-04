'use client';

import { ProjectGroupPanel } from '@/features/project-group/components/ProjectGroupPanel';
import { useProjectPermissions } from '@/features/permissions/hooks/useProjectPermissions';
import { useProjectContext } from '../context/ProjectContext';

export function ProjectGroupView() {
  const { project } = useProjectContext();
  const { can } = useProjectPermissions(project);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6">
      <ProjectGroupPanel
        projectId={project.id}
        canView={can('group.view')}
        canSend={can('group.send')}
        canUpload={can('group.upload')}
        canDeleteAny={can('group.delete_any')}
        fullHeight
      />
    </div>
  );
}
