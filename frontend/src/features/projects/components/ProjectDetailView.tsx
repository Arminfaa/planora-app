'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BoardCard } from '@/features/board/components/BoardCard';
import { CreateBoardModal } from '@/features/board/components/CreateBoardModal';
import { EditBoardModal } from '@/features/board/components/EditBoardModal';
import { useBoards } from '@/features/board/hooks/useBoards';
import type { Board } from '@/features/board/types';
import { StatsCard } from '@/features/dashboard/components/StatsCard';
import { EditProjectModal } from '@/features/projects/components/EditProjectModal';
import { ProjectHeader } from '@/features/projects/components/ProjectHeader';
import { ProjectRolesPanel } from '@/features/projects/components/ProjectRolesPanel';
import { ProjectTeamPanel } from '@/features/projects/components/ProjectTeamPanel';
import { ProjectGroupPanel } from '@/features/project-group/components/ProjectGroupPanel';
import { useProjectTeam } from '@/features/projects/hooks/useProjectTeam';
import { projectService } from '@/features/projects/services/project.service';
import { useProjectPermissions } from '@/features/permissions/hooks/useProjectPermissions';
import type {
  AddProjectMemberInput,
  Project,
  ProjectRoleDefinition,
  UpdateProjectInput,
} from '@/features/projects/types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { Button } from '@/shared/components/ui/Button';
import { getApiErrorMessage, isForbiddenError } from '@/lib/api';

function boardMatchesQuery(board: { name: string }, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return board.name.toLowerCase().includes(normalized);
}

export function ProjectDetailView() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;
  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState('');
  const [loadingProject, setLoadingProject] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [actionError, setActionError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [customRoles, setCustomRoles] = useState<ProjectRoleDefinition[]>([]);
  const { user } = useAuth();
  const { can } = useProjectPermissions(project);

  const canViewTeam = can('team.view');
  const canViewBoards = can('board.view');
  const canViewGroup = can('group.view');
  const canManageInvites = can('team.manage_invites');
  const canManageRoles = can('role.manage');
  const isCustomProject = project?.permissionMode === 'CUSTOM';

  const {
    boards,
    isLoading: loadingBoards,
    error: boardsError,
    createBoard,
    updateBoard,
    deleteBoard,
    isConnected,
    isJoined,
    lastRemoteUpdate,
  } = useBoards(project?.id ?? null, canViewBoards);

  const {
    members,
    invites,
    isLoading: loadingTeam,
    error: teamError,
    inviteMember,
    updateMemberRole,
    removeMember,
    revokeInvite,
  } = useProjectTeam(project?.id ?? null, canViewTeam, canManageInvites);

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

  useEffect(() => {
    const fetchProject = async () => {
      setLoadingProject(true);
      setProjectError('');
      try {
        const data = await projectService.getBySlug(slug);
        setProject(data);
      } catch (err) {
        setProject(null);
        setProjectError(getApiErrorMessage(err));
      } finally {
        setLoadingProject(false);
      }
    };
    void fetchProject();
  }, [slug]);

  const filteredBoards = useMemo(
    () => boards.filter((board) => boardMatchesQuery(board, searchQuery)),
    [boards, searchQuery],
  );

  const hasSearch = searchQuery.trim().length > 0;

  const handleUpdateProject = async (
    projectId: string,
    data: UpdateProjectInput,
  ) => {
    setActionError('');
    await projectService.update(projectId, data);
    const refreshed = await projectService.getBySlug(slug);
    setProject(refreshed);

    if (refreshed.slug !== slug) {
      router.replace(`/dashboard/projects/${refreshed.slug}`);
    }
  };

  const handleInviteMember = async (data: AddProjectMemberInput) => {
    setActionError('');
    const result = await inviteMember(data);
    if (!result) return null;

    if (result.type === 'member') {
      return { type: 'member' as const };
    }

    const inviteUrl = `${window.location.origin}/register?invite=${result.invite.token}`;
    await navigator.clipboard.writeText(inviteUrl);
    return {
      type: 'invite' as const,
      inviteUrl,
      email: result.invite.email,
    };
  };

  const handleCreateBoard = async (data: { name: string }) => {
    setActionError('');
    try {
      await createBoard(data);
    } catch (err) {
      if (!isForbiddenError(err)) {
        setActionError(getApiErrorMessage(err));
      }
      throw err;
    }
  };

  const handleUpdateBoard = async (
    boardId: string,
    data: { name?: string },
  ) => {
    setActionError('');
    const updated = await updateBoard(boardId, data);

    if (editingBoard?.id === boardId && updated?.slug) {
      setEditingBoard((prev) =>
        prev ? { ...prev, name: updated.name, slug: updated.slug } : prev,
      );
    }
  };

  const handleDeleteBoard = async (board: Board) => {
    if (
      !confirm(
        `Delete board "${board.name}"? All columns and tasks will be removed.`,
      )
    ) {
      return;
    }

    setActionError('');
    try {
      await deleteBoard(board.id);
    } catch (err) {
      if (!isForbiddenError(err)) {
        setActionError(getApiErrorMessage(err));
      }
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;

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

  if (loadingProject) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (projectError || !project) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {projectError || 'Project not found'}
        </div>
      </div>
    );
  }

  const roleLabel =
    project.currentUserRoleName ??
    (project.currentUserRole === 'OWNER'
      ? 'Owner'
      : project.currentUserRole === 'ADMIN'
        ? 'Admin'
        : 'Member');

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <div className="relative overflow-hidden border-b border-indigo-100/60 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(99,102,241,0.12),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_100%,rgba(139,92,246,0.08),transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
          <ProjectHeader
            project={project}
            boardCount={boards.length}
            memberCount={members.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewBoard={() => setShowCreateModal(true)}
            canEditProject={can('project.edit')}
            canDeleteProject={can('project.delete')}
            canCreateBoard={can('board.create')}
            onEditProject={() => setShowEditProject(true)}
            onDeleteProject={() => void handleDeleteProject()}
            isConnected={isConnected}
            isJoined={isJoined}
            lastRemoteUpdate={lastRemoteUpdate}
          />

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatsCard
              label="Boards"
              value={boards.length}
              accent="blue"
              variant="glass"
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"
                  />
                </svg>
              }
            />
            <StatsCard
              label="Members"
              value={members.length}
              accent="green"
              variant="glass"
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              }
            />
            <StatsCard
              label="Your role"
              value={roleLabel}
              accent="purple"
              variant="glass"
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        {canViewGroup && (
          <ProjectGroupPanel
            projectId={project.id}
            canView={canViewGroup}
            canSend={can('group.send')}
            canUpload={can('group.upload')}
            canDeleteAny={can('group.delete_any')}
          />
        )}

        {canViewTeam && (
          <ProjectTeamPanel
            members={members}
            invites={invites}
            isLoading={loadingTeam}
            error={teamError}
            canInvite={can('team.invite')}
            canChangeRole={can('team.change_role')}
            canRemove={can('team.remove')}
            canManageInvites={canManageInvites}
            permissionMode={project.permissionMode ?? 'DEFAULT'}
            customRoles={customRoles}
            currentUserId={user?.id}
            onInvite={handleInviteMember}
            onUpdateRole={updateMemberRole}
            onRemove={removeMember}
            onRevokeInvite={revokeInvite}
          />
        )}

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

        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Boards</h2>
            {hasSearch && canViewBoards && (
              <p className="mt-0.5 text-sm text-gray-500">
                {filteredBoards.length} of {boards.length} shown
              </p>
            )}
          </div>

          {!canViewBoards ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center">
              <p className="text-sm text-gray-500">
                You do not have permission to view boards in this project.
              </p>
            </div>
          ) : (
            <>
              {(boardsError || actionError) && (
                <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {boardsError || actionError}
                </div>
              )}

              {loadingBoards ? (
                <LoadingSpinner />
              ) : boards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
                  <p className="text-gray-600">No boards yet</p>
                  {can('board.create') && (
                    <Button
                      className="mt-4"
                      onClick={() => setShowCreateModal(true)}
                    >
                      Create your first board
                    </Button>
                  )}
                </div>
              ) : filteredBoards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-white py-16 text-center">
                  <p className="text-gray-600">No boards match your search</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredBoards.map((board) => (
                    <BoardCard
                      key={board.id}
                      board={board}
                      projectSlug={project.slug}
                      canDelete={can('board.delete')}
                      canEdit={can('board.edit')}
                      onEdit={setEditingBoard}
                      onDelete={handleDeleteBoard}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {showCreateModal && (
        <CreateBoardModal
          onSubmit={handleCreateBoard}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingBoard && (
        <EditBoardModal
          board={editingBoard}
          onClose={() => setEditingBoard(null)}
          onSubmit={handleUpdateBoard}
        />
      )}

      {showEditProject && (
        <EditProjectModal
          project={project}
          canManageRoles={canManageRoles}
          onClose={() => setShowEditProject(false)}
          onSubmit={handleUpdateProject}
          onRolesUpdated={setCustomRoles}
        />
      )}
    </div>
  );
}
