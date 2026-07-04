import { ApiError } from '../utils/ApiError';
import { boardRepository } from '../repositories/board.repository';
import { columnRepository } from '../repositories/column.repository';
import { projectAccessService } from './project-access.service';
import type {
  CreateColumnInput,
  UpdateColumnInput,
} from '../validators/column.validator';

export class ColumnService {
  private async resolveProjectId(boardId: string): Promise<string> {
    const projectId = await boardRepository.getProjectId(boardId);
    if (!projectId) {
      throw new ApiError(404, 'Board not found');
    }
    return projectId;
  }

  async create(userId: string, boardId: string, input: CreateColumnInput) {
    const projectId = await this.resolveProjectId(boardId);
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'column.create',
    );

    return columnRepository.create({
      name: input.name,
      boardId,
      position: input.position,
      color: input.color,
    });
  }

  async update(userId: string, columnId: string, input: UpdateColumnInput) {
    const boardId = await columnRepository.getBoardId(columnId);
    if (!boardId) {
      throw new ApiError(404, 'Column not found');
    }

    const projectId = await this.resolveProjectId(boardId);

    if (input.position !== undefined) {
      await projectAccessService.ensurePermission(
        userId,
        projectId,
        'column.reorder',
      );
    } else {
      await projectAccessService.ensurePermission(
        userId,
        projectId,
        'column.edit',
      );
    }

    return columnRepository.update(columnId, input);
  }

  async reorder(userId: string, boardId: string, columnIds: string[]) {
    const projectId = await this.resolveProjectId(boardId);
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'column.reorder',
    );

    const existing = await columnRepository.findByBoardId(boardId);
    if (existing.length !== columnIds.length) {
      throw new ApiError(400, 'Invalid column order');
    }

    const existingIds = new Set(existing.map((column) => column.id));
    if (!columnIds.every((id) => existingIds.has(id))) {
      throw new ApiError(400, 'Invalid column order');
    }

    return columnRepository.reorder(boardId, columnIds);
  }

  async delete(userId: string, columnId: string) {
    const boardId = await columnRepository.getBoardId(columnId);
    if (!boardId) {
      throw new ApiError(404, 'Column not found');
    }

    const projectId = await this.resolveProjectId(boardId);
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'column.delete',
    );
    await columnRepository.delete(columnId);
  }
}

export const columnService = new ColumnService();
