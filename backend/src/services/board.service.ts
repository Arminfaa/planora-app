import { ApiError } from '../utils/ApiError';
import { toSlug } from '../utils/slug';
import type { Prisma } from '@prisma/client';
import { boardRepository } from '../repositories/board.repository';
import { projectRepository } from '../repositories/project.repository';
import { projectAccessService } from './project-access.service';
import { removeStoredFile, storeUploadedFile } from './storage/storage.service';
import { isImageMimeType } from './storage/storage.config';
import type {
  CreateBoardInput,
  UpdateBoardInput,
} from '../validators/board.validator';

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

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
    await projectAccessService.ensureMember(userId, projectId);
    return boardRepository.findByProject(projectId);
  }

  async getById(userId: string, boardId: string) {
    const board = await boardRepository.findById(boardId);
    if (!board) {
      throw new ApiError(404, 'Board not found');
    }

    await projectAccessService.ensureMember(userId, board.projectId);
    return board;
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
    await projectAccessService.ensureMember(userId, projectId);

    const slug = await this.generateUniqueSlug(projectId, input.name);

    return boardRepository.createWithDefaultColumns({
      name: input.name,
      slug,
      projectId,
      position: input.position,
    });
  }

  async update(userId: string, boardId: string, input: UpdateBoardInput) {
    const projectId = await boardRepository.getProjectId(boardId);
    if (!projectId) {
      throw new ApiError(404, 'Board not found');
    }

    await projectAccessService.ensureMember(userId, projectId);

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

    return boardRepository.update(boardId, updateData);
  }

  async delete(userId: string, boardId: string) {
    const projectId = await boardRepository.getProjectId(boardId);
    if (!projectId) {
      throw new ApiError(404, 'Board not found');
    }

    await projectAccessService.ensureAdmin(userId, projectId);
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

    await projectAccessService.ensureAdmin(userId, existing.projectId);

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

    await projectAccessService.ensureAdmin(userId, existing.projectId);

    await this.removeBoardBackgroundFiles(existing);

    return boardRepository.update(boardId, {
      backgroundUrl: null,
      backgroundStorageKey: null,
      backgroundStorageProvider: null,
    });
  }
}

export const boardService = new BoardService();
