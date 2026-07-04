import { ApiError } from '../utils/ApiError';
import { boardRepository } from '../repositories/board.repository';
import { columnRepository } from '../repositories/column.repository';
import { commentRepository } from '../repositories/comment.repository';
import { taskRepository } from '../repositories/task.repository';
import { projectAccessService } from './project-access.service';
import { permissionService } from './permission.service';
import type {
  CreateCommentInput,
  UpdateCommentInput,
} from '../validators/comment.validator';

function serializeComment(comment: {
  id: string;
  content: string;
  taskId: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}) {
  return {
    id: comment.id,
    content: comment.content,
    taskId: comment.taskId,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    author: comment.author,
  };
}

export class CommentService {
  private async resolveProjectIdFromTask(taskId: string): Promise<string> {
    const columnId = await taskRepository.getColumnId(taskId);
    if (!columnId) {
      throw new ApiError(404, 'Task not found');
    }

    const boardId = await columnRepository.getBoardId(columnId);
    if (!boardId) {
      throw new ApiError(404, 'Column not found');
    }

    const projectId = await boardRepository.getProjectId(boardId);
    if (!projectId) {
      throw new ApiError(404, 'Board not found');
    }

    return projectId;
  }

  private async canManageComment(
    userId: string,
    projectId: string,
    authorId: string,
    action: 'edit' | 'delete',
  ): Promise<boolean> {
    if (authorId === userId) {
      return true;
    }

    await projectAccessService.ensureMember(userId, projectId);

    const permission =
      action === 'edit' ? 'comment.edit_any' : 'comment.delete_any';
    return permissionService.can(userId, projectId, permission);
  }

  async list(userId: string, taskId: string) {
    const projectId = await this.resolveProjectIdFromTask(taskId);
    await projectAccessService.ensureMember(userId, projectId);

    const comments = await commentRepository.findByTask(taskId);
    return comments.map(serializeComment);
  }

  async create(userId: string, taskId: string, input: CreateCommentInput) {
    const projectId = await this.resolveProjectIdFromTask(taskId);
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'comment.create',
    );

    const comment = await commentRepository.create({
      content: input.content,
      taskId,
      authorId: userId,
    });

    return serializeComment(comment);
  }

  async update(
    userId: string,
    taskId: string,
    commentId: string,
    input: UpdateCommentInput,
  ) {
    const projectId = await this.resolveProjectIdFromTask(taskId);
    await projectAccessService.ensureMember(userId, projectId);

    const comment = await commentRepository.findById(commentId);
    if (!comment || comment.taskId !== taskId) {
      throw new ApiError(404, 'Comment not found');
    }

    const canManage = await this.canManageComment(
      userId,
      projectId,
      comment.authorId,
      'edit',
    );
    if (!canManage) {
      throw new ApiError(403, 'You cannot edit this comment');
    }

    const updated = await commentRepository.update(commentId, input.content);
    return serializeComment(updated);
  }

  async delete(userId: string, taskId: string, commentId: string) {
    const projectId = await this.resolveProjectIdFromTask(taskId);
    await projectAccessService.ensureMember(userId, projectId);

    const comment = await commentRepository.findById(commentId);
    if (!comment || comment.taskId !== taskId) {
      throw new ApiError(404, 'Comment not found');
    }

    const canManage = await this.canManageComment(
      userId,
      projectId,
      comment.authorId,
      'delete',
    );
    if (!canManage) {
      throw new ApiError(403, 'You cannot delete this comment');
    }

    await commentRepository.delete(commentId);
  }
}

export const commentService = new CommentService();
