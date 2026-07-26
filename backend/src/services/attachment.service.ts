import { AttachmentType } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { attachmentRepository } from '../repositories/attachment.repository';
import { boardRepository } from '../repositories/board.repository';
import { columnRepository } from '../repositories/column.repository';
import { taskRepository } from '../repositories/task.repository';
import type { CreateLinkAttachmentInput } from '../validators/attachment.validator';
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
    url:
      attachment.type === 'LINK'
        ? attachment.url
        : serializeAttachmentUrl(attachment.url),
    mimeType: attachment.mimeType,
    size: attachment.size,
    type: attachment.type,
    taskId: attachment.taskId,
    createdAt: attachment.createdAt.toISOString(),
  };
}

function normalizeAttachmentUrl(raw: string): string {
  return raw.trim();
}

function deriveLinkFilename(url: string, filename?: string): string {
  if (filename?.trim()) {
    return filename.trim();
  }

  try {
    const parsed = new URL(url);
    const path =
      parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '';
    return `${parsed.hostname}${path}`.slice(0, 255);
  } catch {
    return url.slice(0, 255);
  }
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

  async createLink(
    userId: string,
    taskId: string,
    input: CreateLinkAttachmentInput,
  ) {
    const projectId = await this.resolveProjectIdFromTask(taskId);
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'attachment.upload',
    );

    const url = normalizeAttachmentUrl(input.url);
    if (!url) {
      throw new ApiError(400, 'URL is required');
    }

    // Only enforce URL shape for explicit http(s) values; share paths stay as-is.
    if (/^https?:\/\//i.test(url)) {
      try {
        new URL(url);
      } catch {
        throw new ApiError(400, 'Invalid URL');
      }
    }

    const attachment = await attachmentRepository.create({
      filename: deriveLinkFilename(url, input.filename),
      url,
      mimeType: 'text/uri-list',
      size: 0,
      type: AttachmentType.LINK,
      taskId,
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
