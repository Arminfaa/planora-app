'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { BoardCard } from '@/features/board/components/BoardCard';
import { CreateBoardForm } from '@/features/board/components/CreateBoardForm';
import { EditBoardModal } from '@/features/board/components/EditBoardModal';
import { useBoards } from '@/features/board/hooks/useBoards';
import type { Board } from '@/features/board/types';
import { formatDate } from '@/features/dashboard/utils/stats';
import { EditProjectModal } from '@/features/projects/components/EditProjectModal';
import { ProjectTeamPanel } from '@/features/projects/components/ProjectTeamPanel';
import { useProjectTeam } from '@/features/projects/hooks/useProjectTeam';
import { projectService } from '@/features/projects/services/project.service';
import type { AddProjectMemberInput, Project } from '@/features/projects/types';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { Button } from '@/shared/components/ui/Button';
import { getApiErrorMessage } from '@/lib/api';

export default function ProjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;
  const [project, setProject] = useState<Project | null>(null);
  const [projectError, setProjectError] = useState('');
  const [loadingProject, setLoadingProject] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [actionError, setActionError] = useState('');
  const { user } = useAuth();

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
  } = useBoards(project?.id ?? null);

  const canManageProject =
    project?.currentUserRole === 'OWNER' ||
    project?.currentUserRole === 'ADMIN';

  const canDeleteBoard = canManageProject;

  const {
    members,
    invites,
    isLoading: loadingTeam,
    error: teamError,
    inviteMember,
    updateMemberRole,
    removeMember,
    revokeInvite,
  } = useProjectTeam(project?.id ?? null, canManageProject);

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

  const handleUpdateProject = async (
    projectId: string,
    data: { name?: string; description?: string },
  ) => {
    setActionError('');
    const updated = await projectService.update(projectId, data);
    setProject((prev) =>
      prev
        ? {
            ...prev,
            ...updated,
            currentUserRole: prev.currentUserRole,
            owner: prev.owner,
            _count: prev._count,
          }
        : prev,
    );

    if (updated.slug !== slug) {
      router.replace(`/dashboard/projects/${updated.slug}`);
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
      setShowCreateForm(false);
    } catch (err) {
      setActionError(getApiErrorMessage(err));
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
      setActionError(getApiErrorMessage(err));
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
      setActionError(getApiErrorMessage(err));
    }
  };

  if (loadingProject) return <LoadingSpinner />;

  if (projectError || !project) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {projectError || 'Project not found'}
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back to Dashboard
      </Link>

      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="mt-2 text-gray-600">{project.description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
              <span>Updated: {formatDate(project.updatedAt)}</span>
              {project.owner && <span>Owner: {project.owner.name}</span>}
            </div>
          </div>

          {canManageProject && (
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowEditProject(true)}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleDeleteProject}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      <ProjectTeamPanel
        members={members}
        invites={invites}
        isLoading={loadingTeam}
        error={teamError}
        canManage={canManageProject}
        currentUserId={user?.id}
        onInvite={handleInviteMember}
        onUpdateRole={updateMemberRole}
        onRemove={removeMember}
        onRevokeInvite={revokeInvite}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Boards</h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isConnected && isJoined
                  ? 'bg-green-500'
                  : isConnected
                    ? 'bg-amber-400'
                    : 'bg-gray-300'
              }`}
            />
            {isConnected && isJoined
              ? 'Live'
              : isConnected
                ? 'Joining...'
                : 'Connecting...'}
            {lastRemoteUpdate && (
              <span className="text-gray-400">
                · Updated {lastRemoteUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'New Board'}
        </Button>
      </div>

      {(boardsError || actionError) && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {boardsError || actionError}
        </div>
      )}

      {showCreateForm && (
        <div className="mb-6">
          <CreateBoardForm
            onSubmit={handleCreateBoard}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {loadingBoards ? (
        <LoadingSpinner />
      ) : boards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center text-gray-600">
          <p>No boards in this project yet.</p>
          <Button className="mt-4" onClick={() => setShowCreateForm(true)}>
            Create your first board
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              projectSlug={project.slug}
              canDelete={canDeleteBoard}
              onEdit={setEditingBoard}
              onDelete={handleDeleteBoard}
            />
          ))}
        </div>
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
          onClose={() => setShowEditProject(false)}
          onSubmit={handleUpdateProject}
        />
      )}
    </div>
  );
}
