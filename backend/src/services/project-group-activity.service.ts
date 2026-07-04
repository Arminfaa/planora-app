import type { Prisma } from '@prisma/client';
import { boardRepository } from '../repositories/board.repository';
import { columnRepository } from '../repositories/column.repository';
import { projectGroupRepository } from '../repositories/project-group.repository';
import { taskRepository } from '../repositories/task.repository';
import { notifyProjectGroupMessageEvent } from '../utils/project-group-events';
import type { ActivityChange } from '../utils/project-group-activity';
import { enrichTaskActivityData } from '../utils/enrich-task-activity-data';

function serializeActivityMessage(
  message: Awaited<ReturnType<typeof projectGroupRepository.findById>>,
) {
  if (!message) return null;

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
    attachments: [],
    canEdit: false,
  };
}

export class ProjectGroupActivityService {
  private async resolveProjectIdFromTask(
    taskId: string,
  ): Promise<string | null> {
    const columnId = await taskRepository.getColumnId(taskId);
    if (!columnId) return null;

    const boardId = await columnRepository.getBoardId(columnId);
    if (!boardId) return null;

    return boardRepository.getProjectId(boardId);
  }

  async logTaskActivityByTaskId(
    userId: string,
    taskId: string,
    changes: ActivityChange[],
    taskTitle?: string,
  ): Promise<void> {
    if (changes.length === 0) return;

    const projectId = await this.resolveProjectIdFromTask(taskId);
    if (!projectId) return;

    const title =
      taskTitle ?? (await taskRepository.findById(taskId))?.title ?? 'Untitled';

    await this.logTaskUpdated(userId, projectId, {
      taskId,
      taskTitle: title,
      changes,
    });
  }

  async log(
    userId: string,
    projectId: string,
    activityType: string,
    activityData: Prisma.InputJsonValue,
  ): Promise<void> {
    const enrichedData = await enrichTaskActivityData(
      activityType,
      activityData as Record<string, unknown>,
    );

    const message = await projectGroupRepository.createActivityMessage({
      projectId,
      authorId: userId,
      activityType,
      activityData: enrichedData as Prisma.InputJsonValue,
    });

    const serialized = serializeActivityMessage(message);
    if (!serialized) return;

    notifyProjectGroupMessageEvent(userId, 'group:message:created', {
      projectId,
      payload: { message: serialized },
    });
  }

  async logTaskCreated(
    userId: string,
    projectId: string,
    data: { taskId: string; taskTitle: string; boardName?: string },
  ) {
    await this.log(userId, projectId, 'task.created', data);
  }

  async logTaskUpdated(
    userId: string,
    projectId: string,
    data: {
      taskId: string;
      taskTitle: string;
      changes: Array<{
        field: string;
        label: string;
        from?: string | null;
        to?: string | null;
      }>;
    },
  ) {
    if (data.changes.length === 0) return;
    await this.log(userId, projectId, 'task.updated', data);
  }

  async logTaskMoved(
    userId: string,
    projectId: string,
    data: {
      taskId: string;
      taskTitle: string;
      fromColumn?: string;
      toColumn?: string;
    },
  ) {
    await this.log(userId, projectId, 'task.moved', data);
  }

  async logTaskDeleted(
    userId: string,
    projectId: string,
    data: { taskId: string; taskTitle: string },
  ) {
    await this.log(userId, projectId, 'task.deleted', data);
  }

  async logBoardCreated(
    userId: string,
    projectId: string,
    data: { boardId: string; boardName: string },
  ) {
    await this.log(userId, projectId, 'board.created', data);
  }

  async logBoardUpdated(
    userId: string,
    projectId: string,
    data: { boardId: string; boardName: string; changes?: string[] },
  ) {
    await this.log(userId, projectId, 'board.updated', data);
  }

  async logBoardDeleted(
    userId: string,
    projectId: string,
    data: { boardId: string; boardName: string },
  ) {
    await this.log(userId, projectId, 'board.deleted', data);
  }

  async logColumnCreated(
    userId: string,
    projectId: string,
    data: { columnId: string; columnName: string; boardName?: string },
  ) {
    await this.log(userId, projectId, 'column.created', data);
  }

  async logColumnUpdated(
    userId: string,
    projectId: string,
    data: { columnId: string; columnName: string; changes?: string[] },
  ) {
    await this.log(userId, projectId, 'column.updated', data);
  }

  async logColumnDeleted(
    userId: string,
    projectId: string,
    data: { columnId: string; columnName: string },
  ) {
    await this.log(userId, projectId, 'column.deleted', data);
  }

  async logMemberJoined(
    userId: string,
    projectId: string,
    data: { memberName: string; memberId: string },
  ) {
    await this.log(userId, projectId, 'member.joined', data);
  }

  async logMemberRemoved(
    userId: string,
    projectId: string,
    data: { memberName: string; memberId: string },
  ) {
    await this.log(userId, projectId, 'member.removed', data);
  }

  async logMemberRoleChanged(
    userId: string,
    projectId: string,
    data: { memberName: string; memberId: string; roleName: string },
  ) {
    await this.log(userId, projectId, 'member.role_changed', data);
  }
}

export const projectGroupActivityService = new ProjectGroupActivityService();
