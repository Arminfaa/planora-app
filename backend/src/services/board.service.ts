import { ApiError } from '../utils/ApiError';
import { toSlug } from '../utils/slug';
import type { Board, Prisma } from '@prisma/client';
import { boardRepository } from '../repositories/board.repository';
import { projectRepository } from '../repositories/project.repository';
import {
  notifyBoardMetaEvent,
  notifyProjectBoardEvent,
} from '../utils/board-events';
import { permissionService } from './permission.service';
import { projectAccessService } from './project-access.service';
import { removeStoredFile, storeUploadedFile } from './storage/storage.service';
import { isImageMimeType } from './storage/storage.config';
import type {
  CreateBoardInput,
  UpdateBoardInput,
} from '../validators/board.validator';

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;
export const BOARD_COMPLETED_COLOR = '#10B981';

export class BoardService {
  private async resolveProjectId(idOrSlug: string): Promise<string> {
    if (OBJECT_ID_PATTERN.test(idOrSlug)) {
      return idOrSlug;
    }

    const project = await projectRepository.findBySlug(idOrSlug);
    if (!project) {
      throw new ApiError(404, 'Project not found');
    }

    return project.id;
  }

  private async resolveBoardId(
    projectId: string,
    idOrSlug: string,
  ): Promise<string> {
    if (OBJECT_ID_PATTERN.test(idOrSlug)) {
      const board = await boardRepository.findById(idOrSlug);
      if (!board || board.projectId !== projectId) {
        throw new ApiError(404, 'Board not found');
      }
      return board.id;
    }

    const board = await boardRepository.findByProjectAndSlug(
      projectId,
      idOrSlug,
    );
    if (!board) {
      throw new ApiError(404, 'Board not found');
    }

    return board.id;
  }

  private async generateUniqueSlug(
    projectId: string,
    name: string,
    excludeBoardId?: string,
  ): Promise<string> {
    let slug = toSlug(name) || `board-${Date.now()}`;
    const existing = await boardRepository.findByProjectAndSlug(
      projectId,
      slug,
    );

    if (existing && existing.id !== excludeBoardId) {
      slug = `${slug}-${Date.now()}`;
    }

    return slug;
  }

  async listByProject(userId: string, projectIdOrSlug: string) {
    const projectId = await this.resolveProjectId(projectIdOrSlug);
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'board.view',
    );
    const boards = await boardRepository.findByProject(projectId);
    const completionStats =
      await boardRepository.countTaskCompletionByProject(projectId);

    return boards.map((board) => {
      const stats = completionStats.get(board.id) ?? {
        total: 0,
        completed: 0,
        incomplete: 0,
      };
      return {
        ...board,
        taskCount: stats.total,
        incompleteTaskCount: stats.incomplete,
      };
    });
  }

  /**
   * Keep board completion in sync with its tasks:
   * - all tasks completed (and at least one exists) → mark completed + green
   * - any incomplete task → clear completed flag
   */
  async syncCompletionFromTasks(
    boardId: string,
    userId?: string,
  ): Promise<Board | null> {
    const board = await boardRepository.findMetaById(boardId);
    if (!board) return null;

    const { total, incomplete } =
      await boardRepository.countTaskCompletion(boardId);
    const shouldComplete = total > 0 && incomplete === 0;

    const updateData: Prisma.BoardUpdateInput = {};

    if (shouldComplete) {
      if (!board.isCompleted) {
        updateData.isCompleted = true;
      }
      if (board.color !== BOARD_COMPLETED_COLOR) {
        updateData.color = BOARD_COMPLETED_COLOR;
      }
    } else if (board.isCompleted) {
      updateData.isCompleted = false;
    }

    if (Object.keys(updateData).length === 0) {
      return null;
    }

    const updated = await boardRepository.update(boardId, updateData);

    if (userId) {
      notifyProjectBoardEvent(userId, 'board:updated', {
        projectId: updated.projectId,
        boardId: updated.id,
        payload: { board: updated },
      });
      notifyBoardMetaEvent(
        userId,
        updated.id,
        updated as unknown as Record<string, unknown>,
      );
    }

    return updated;
  }

  private async sanitizeBoardTasks(
    userId: string,
    projectId: string,
    board: NonNullable<Awaited<ReturnType<typeof boardRepository.findById>>>,
  ) {
    const canViewTasks = await permissionService.can(
      userId,
      projectId,
      'task.view',
    );

    if (canViewTasks) {
      return board;
    }

    return {
      ...board,
      columns: board.columns.map((column) => ({
        ...column,
        tasks: [],
      })),
    };
  }

  async getById(userId: string, boardId: string) {
    const board = await boardRepository.findById(boardId);
    if (!board) {
      throw new ApiError(404, 'Board not found');
    }

    await projectAccessService.ensurePermission(
      userId,
      board.projectId,
      'board.view',
    );

    return this.sanitizeBoardTasks(userId, board.projectId, board);
  }

  async getByProjectAndSlug(
    userId: string,
    projectIdOrSlug: string,
    boardIdOrSlug: string,
  ) {
    const projectId = await this.resolveProjectId(projectIdOrSlug);
    const boardId = await this.resolveBoardId(projectId, boardIdOrSlug);
    return this.getById(userId, boardId);
  }

  async create(
    userId: string,
    projectIdOrSlug: string,
    input: CreateBoardInput,
  ) {
    const projectId = await this.resolveProjectId(projectIdOrSlug);
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'board.create',
    );

    const slug = await this.generateUniqueSlug(projectId, input.name);

    return boardRepository.createWithDefaultColumns({
      name: input.name,
      slug,
      projectId,
      position: input.position,
      color: input.color ?? undefined,
      isCompleted: input.isCompleted,
    });
  }

  async update(userId: string, boardId: string, input: UpdateBoardInput) {
    const projectId = await boardRepository.getProjectId(boardId);
    if (!projectId) {
      throw new ApiError(404, 'Board not found');
    }

    const permission =
      input.position !== undefined &&
      input.name === undefined &&
      input.color === undefined &&
      input.isCompleted === undefined
        ? 'board.reorder'
        : 'board.edit';
    await projectAccessService.ensurePermission(userId, projectId, permission);

    const updateData: Prisma.BoardUpdateInput = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
      updateData.slug = await this.generateUniqueSlug(
        projectId,
        input.name,
        boardId,
      );
    }

    if (input.position !== undefined) {
      updateData.position = input.position;
    }

    if (input.isCompleted === true) {
      updateData.isCompleted = true;
      updateData.color = BOARD_COMPLETED_COLOR;
    } else if (input.isCompleted === false) {
      updateData.isCompleted = false;
      if (input.color !== undefined) {
        updateData.color = input.color;
      }
    } else if (input.color !== undefined) {
      updateData.color = input.color;
    }

    return boardRepository.update(boardId, updateData);
  }

  async delete(userId: string, boardId: string) {
    const projectId = await boardRepository.getProjectId(boardId);
    if (!projectId) {
      throw new ApiError(404, 'Board not found');
    }

    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'board.delete',
    );
    await boardRepository.delete(boardId);
  }

  private async removeBoardBackgroundFiles(board: {
    backgroundStorageKey?: string | null;
    backgroundStorageProvider?: string | null;
  }): Promise<void> {
    if (!board.backgroundStorageKey) return;

    await removeStoredFile(
      board.backgroundStorageKey,
      board.backgroundStorageProvider === 'cloudinary' ? 'cloudinary' : 'local',
      'IMAGE',
    );
  }

  async uploadBackground(
    userId: string,
    boardId: string,
    file: Express.Multer.File,
  ) {
    const existing = await boardRepository.findById(boardId);
    if (!existing) {
      throw new ApiError(404, 'Board not found');
    }

    await projectAccessService.ensurePermission(
      userId,
      existing.projectId,
      'board.change_background',
    );

    if (!file) {
      throw new ApiError(400, 'Image file is required');
    }

    if (!isImageMimeType(file.mimetype)) {
      throw new ApiError(400, 'Only image files are allowed');
    }

    const stored = await storeUploadedFile(file);

    if (stored.type !== 'IMAGE') {
      throw new ApiError(400, 'Only image files are allowed');
    }

    await this.removeBoardBackgroundFiles(existing);

    return boardRepository.update(boardId, {
      backgroundUrl: stored.url,
      backgroundStorageKey: stored.storageKey,
      backgroundStorageProvider: stored.storageProvider,
    });
  }

  async removeBackground(userId: string, boardId: string) {
    const existing = await boardRepository.findById(boardId);
    if (!existing) {
      throw new ApiError(404, 'Board not found');
    }

    await projectAccessService.ensurePermission(
      userId,
      existing.projectId,
      'board.change_background',
    );

    await this.removeBoardBackgroundFiles(existing);

    return boardRepository.update(boardId, {
      backgroundUrl: null,
      backgroundStorageKey: null,
      backgroundStorageProvider: null,
    });
  }
}

export const boardService = new BoardService();
