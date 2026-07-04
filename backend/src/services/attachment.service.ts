import { ApiError } from '../utils/ApiError';
import { attachmentRepository } from '../repositories/attachment.repository';
import { boardRepository } from '../repositories/board.repository';
import { columnRepository } from '../repositories/column.repository';
import { taskRepository } from '../repositories/task.repository';
import { projectAccessService } from './project-access.service';
import {
  removeStoredFile,
  serializeAttachmentUrl,
  storeUploadedFile,
} from './storage/storage.service';

function serializeAttachment(attachment: {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  type: string;
  taskId: string;
  createdAt: Date;
}) {
  return {
    id: attachment.id,
    filename: attachment.filename,
    url: serializeAttachmentUrl(attachment.url),
    mimeType: attachment.mimeType,
    size: attachment.size,
    type: attachment.type,
    taskId: attachment.taskId,
    createdAt: attachment.createdAt.toISOString(),
  };
}

export class AttachmentService {
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

  async list(userId: string, taskId: string) {
    const projectId = await this.resolveProjectIdFromTask(taskId);
    await projectAccessService.ensureMember(userId, projectId);

    const attachments = await attachmentRepository.findByTask(taskId);
    return attachments.map(serializeAttachment);
  }

  async upload(userId: string, taskId: string, file: Express.Multer.File) {
    const projectId = await this.resolveProjectIdFromTask(taskId);
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'attachment.upload',
    );

    if (!file) {
      throw new ApiError(400, 'File is required');
    }

    const stored = await storeUploadedFile(file);

    const attachment = await attachmentRepository.create({
      filename: stored.filename,
      url: stored.url,
      mimeType: stored.mimeType,
      size: stored.size,
      type: stored.type,
      taskId,
      storageKey: stored.storageKey,
      storageProvider: stored.storageProvider,
    });

    return serializeAttachment(attachment);
  }

  async delete(userId: string, taskId: string, attachmentId: string) {
    const projectId = await this.resolveProjectIdFromTask(taskId);
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'attachment.delete',
    );

    const attachment = await attachmentRepository.findById(attachmentId);
    if (!attachment || attachment.taskId !== taskId) {
      throw new ApiError(404, 'Attachment not found');
    }

    if (attachment.storageKey) {
      await removeStoredFile(
        attachment.storageKey,
        attachment.storageProvider === 'cloudinary' ? 'cloudinary' : 'local',
        attachment.type,
      );
    }

    await attachmentRepository.delete(attachmentId);
    return attachment.filename;
  }
}

export const attachmentService = new AttachmentService();
