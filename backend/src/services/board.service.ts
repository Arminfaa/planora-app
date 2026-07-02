import { ApiError } from '../utils/ApiError';
import { boardRepository } from '../repositories/board.repository';
import { projectAccessService } from './project-access.service';
import type {
  CreateBoardInput,
  UpdateBoardInput,
} from '../validators/board.validator';

export class BoardService {
  async listByProject(userId: string, projectId: string) {
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

  async create(userId: string, projectId: string, input: CreateBoardInput) {
    await projectAccessService.ensureMember(userId, projectId);

    return boardRepository.create({
      name: input.name,
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
    return boardRepository.update(boardId, input);
  }

  async delete(userId: string, boardId: string) {
    const projectId = await boardRepository.getProjectId(boardId);
    if (!projectId) {
      throw new ApiError(404, 'Board not found');
    }

    await projectAccessService.ensureAdmin(userId, projectId);
    await boardRepository.delete(boardId);
  }
}

export const boardService = new BoardService();
