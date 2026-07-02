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
    await projectAccessService.ensureMember(userId, projectId);

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
    await projectAccessService.ensureMember(userId, projectId);

    return columnRepository.update(columnId, input);
  }

  async delete(userId: string, columnId: string) {
    const boardId = await columnRepository.getBoardId(columnId);
    if (!boardId) {
      throw new ApiError(404, 'Column not found');
    }

    const projectId = await this.resolveProjectId(boardId);
    await projectAccessService.ensureAdmin(userId, projectId);
    await columnRepository.delete(columnId);
  }
}

export const columnService = new ColumnService();
