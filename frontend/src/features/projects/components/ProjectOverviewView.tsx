'use client';

import { useEffect, useMemo, useState } from 'react';
import { BoardCard } from '@/features/board/components/BoardCard';
import { CreateBoardModal } from '@/features/board/components/CreateBoardModal';
import { EditBoardModal } from '@/features/board/components/EditBoardModal';
import { useBoards } from '@/features/board/hooks/useBoards';
import type { Board } from '@/features/board/types';
import { StatsCard } from '@/features/dashboard/components/StatsCard';
import { useProjectPermissions } from '@/features/permissions/hooks/useProjectPermissions';
import { useProjectContext } from '@/features/projects/context/ProjectContext';
import { useProjectProgress } from '@/features/projects/hooks/useProjectProgress';
import { ProjectProgressOverview } from '@/features/projects/components/ProjectProgressOverview';
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner';
import { Button } from '@/shared/components/ui/Button';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { getApiErrorMessage, isForbiddenError } from '@/lib/api';

function boardMatchesQuery(board: { name: string }, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return board.name.toLowerCase().includes(normalized);
}

export function ProjectOverviewView() {
  const { project, setBoardCount } = useProjectContext();
  const { can } = useProjectPermissions(project);
  const canViewBoards = can('board.view');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [actionError, setActionError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    boards,
    isLoading: loadingBoards,
    error: boardsError,
    createBoard,
    updateBoard,
    deleteBoard,
  } = useBoards(project.id, canViewBoards);

  const {
    stats: progressStats,
    isLoading: loadingProgress,
    error: progressError,
  } = useProjectProgress(project.id, canViewBoards);

  useEffect(() => {
    setBoardCount(boards.length);
  }, [boards.length, setBoardCount]);

  const filteredBoards = useMemo(
    () => boards.filter((board) => boardMatchesQuery(board, searchQuery)),
    [boards, searchQuery],
  );

  const hasSearch = searchQuery.trim().length > 0;

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

  const roleLabel =
    project.currentUserRoleName ??
    (project.currentUserRole === 'OWNER'
      ? 'Owner'
      : project.currentUserRole === 'ADMIN'
        ? 'Admin'
        : 'Member');

  return (
    <>
      <div className="border-b border-gray-100 bg-white/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-3">
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
            <StatsCard
              label="Permission mode"
              value={project.permissionMode === 'CUSTOM' ? 'Custom' : 'Default'}
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              }
            />
          </div>

          {canViewBoards && (
            <div className="mt-6">
              {loadingProgress ? (
                <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-white/60 bg-white/70 backdrop-blur-md">
                  <LoadingSpinner />
                </div>
              ) : progressError ? (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {progressError}
                </div>
              ) : progressStats ? (
                <ProjectProgressOverview stats={progressStats} />
              ) : null}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1 sm:max-w-md">
              <SearchInput
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search boards..."
                aria-label="Search boards"
                className="rounded-xl border-gray-200 bg-white shadow-sm"
              />
            </div>

            {can('board.create') && (
              <Button onClick={() => setShowCreateModal(true)}>
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Board
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
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
    </>
  );
}
