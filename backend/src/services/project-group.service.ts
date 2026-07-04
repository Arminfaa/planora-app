import { ApiError } from '../utils/ApiError';
import { buildPagination } from '../utils/pagination';
import { projectGroupRepository } from '../repositories/project-group.repository';
import { projectAccessService } from './project-access.service';
import { permissionService } from './permission.service';
import {
  removeStoredFile,
  serializeAttachmentUrl,
  storeUploadedFile,
} from './storage/storage.service';
import { notifyProjectGroupMessageEvent } from '../utils/project-group-events';
import type {
  CreateGroupMessageInput,
  UpdateGroupMessageInput,
} from '../validators/project-group.validator';

export const MESSAGE_EDIT_WINDOW_MS = 5 * 60 * 1000;

function serializeAttachment(attachment: {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  type: string;
  createdAt: Date;
}) {
  return {
    id: attachment.id,
    filename: attachment.filename,
    url: serializeAttachmentUrl(attachment.url),
    mimeType: attachment.mimeType,
    size: attachment.size,
    type: attachment.type,
    createdAt: attachment.createdAt.toISOString(),
  };
}

function serializeMessage(message: {
  id: string;
  projectId: string;
  type: string;
  content: string | null;
  activityType: string | null;
  activityData: unknown;
  createdAt: Date;
  updatedAt: Date;
  editedAt: Date | null;
  author: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  attachments: Array<{
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    type: string;
    createdAt: Date;
  }>;
}) {
  return {
    id: message.id,
    projectId: message.projectId,
    type: message.type,
    content: message.content,
    activityType: message.activityType,
    activityData: message.activityData,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    editedAt: message.editedAt?.toISOString() ?? null,
    author: message.author,
    attachments: message.attachments.map(serializeAttachment),
    canEdit:
      message.type === 'USER' &&
      Date.now() - message.createdAt.getTime() <= MESSAGE_EDIT_WINDOW_MS,
  };
}

export class ProjectGroupService {
  private async canDeleteMessage(
    userId: string,
    projectId: string,
    authorId: string | null,
  ): Promise<boolean> {
    if (authorId === userId) {
      return true;
    }

    await projectAccessService.ensureMember(userId, projectId);
    return permissionService.can(userId, projectId, 'group.delete_any');
  }

  private canEditOwnMessage(createdAt: Date): boolean {
    return Date.now() - createdAt.getTime() <= MESSAGE_EDIT_WINDOW_MS;
  }

  async list(userId: string, projectId: string, page: number, limit: number) {
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'group.view',
    );

    const { items, total } = await projectGroupRepository.findByProject(
      projectId,
      page,
      limit,
    );

    const serialized = items.map(serializeMessage).reverse();
    return buildPagination(serialized, total, page, limit);
  }

  async create(
    userId: string,
    projectId: string,
    input: CreateGroupMessageInput,
  ) {
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'group.send',
    );

    const content = input.content?.trim();
    if (!content) {
      throw new ApiError(400, 'Message content is required');
    }

    const message = await projectGroupRepository.createUserMessage({
      projectId,
      authorId: userId,
      content,
    });

    const serialized = serializeMessage(message);
    notifyProjectGroupMessageEvent(userId, 'group:message:created', {
      projectId,
      payload: { message: serialized },
    });

    return serialized;
  }

  async createWithFile(
    userId: string,
    projectId: string,
    file: Express.Multer.File,
    content?: string,
  ) {
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'group.upload',
    );

    if (!file) {
      throw new ApiError(400, 'File is required');
    }

    const trimmedContent = content?.trim() || null;
    const message = await projectGroupRepository.createUserMessage({
      projectId,
      authorId: userId,
      content: trimmedContent ?? undefined,
    });

    const stored = await storeUploadedFile(file);
    await projectGroupRepository.createAttachment({
      messageId: message.id,
      filename: stored.filename,
      url: stored.url,
      mimeType: stored.mimeType,
      size: stored.size,
      type: stored.type,
      storageKey: stored.storageKey,
      storageProvider: stored.storageProvider,
    });

    const fullMessage = await projectGroupRepository.findById(message.id);
    if (!fullMessage) {
      throw new ApiError(500, 'Failed to create message');
    }

    const serialized = serializeMessage(fullMessage);
    notifyProjectGroupMessageEvent(userId, 'group:message:created', {
      projectId,
      payload: { message: serialized },
    });

    return serialized;
  }

  async update(
    userId: string,
    projectId: string,
    messageId: string,
    input: UpdateGroupMessageInput,
  ) {
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'group.view',
    );

    const message = await projectGroupRepository.findById(messageId);
    if (!message || message.projectId !== projectId) {
      throw new ApiError(404, 'Message not found');
    }

    if (message.type !== 'USER') {
      throw new ApiError(400, 'Activity messages cannot be edited');
    }

    if (message.authorId !== userId) {
      throw new ApiError(403, 'You can only edit your own messages');
    }

    if (!this.canEditOwnMessage(message.createdAt)) {
      throw new ApiError(403, 'Edit window has expired');
    }

    const updated = await projectGroupRepository.updateContent(
      messageId,
      input.content,
    );
    const serialized = serializeMessage(updated);

    notifyProjectGroupMessageEvent(userId, 'group:message:updated', {
      projectId,
      payload: { message: serialized },
    });

    return serialized;
  }

  async delete(userId: string, projectId: string, messageId: string) {
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'group.view',
    );

    const message = await projectGroupRepository.findById(messageId);
    if (!message || message.projectId !== projectId) {
      throw new ApiError(404, 'Message not found');
    }

    if (message.type !== 'USER') {
      throw new ApiError(400, 'Activity messages cannot be deleted');
    }

    const canDelete = await this.canDeleteMessage(
      userId,
      projectId,
      message.authorId,
    );
    if (!canDelete) {
      throw new ApiError(403, 'You cannot delete this message');
    }

    for (const attachment of message.attachments) {
      if (attachment.storageKey) {
        await removeStoredFile(
          attachment.storageKey,
          attachment.storageProvider === 'cloudinary' ? 'cloudinary' : 'local',
          attachment.type,
        );
      }
    }

    await projectGroupRepository.delete(messageId);

    notifyProjectGroupMessageEvent(userId, 'group:message:deleted', {
      projectId,
      payload: { messageId },
    });
  }
}

export const projectGroupService = new ProjectGroupService();
