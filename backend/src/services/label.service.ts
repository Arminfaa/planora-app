import { ApiError } from '../utils/ApiError';
import { boardRepository } from '../repositories/board.repository';
import { columnRepository } from '../repositories/column.repository';
import { labelRepository } from '../repositories/label.repository';
import { projectRepository } from '../repositories/project.repository';
import { taskRepository } from '../repositories/task.repository';
import { projectAccessService } from './project-access.service';
import type {
  CreateLabelInput,
  UpdateLabelInput,
} from '../validators/label.validator';

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

function serializeLabel(label: {
  id: string;
  name: string;
  color: string;
  projectId: string;
}) {
  return {
    id: label.id,
    name: label.name,
    color: label.color,
    projectId: label.projectId,
  };
}

export class LabelService {
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

  async list(userId: string, projectIdOrSlug: string) {
    const projectId = await this.resolveProjectId(projectIdOrSlug);
    await projectAccessService.ensureMember(userId, projectId);

    const labels = await labelRepository.findByProject(projectId);
    return labels.map(serializeLabel);
  }

  async create(
    userId: string,
    projectIdOrSlug: string,
    input: CreateLabelInput,
  ) {
    const projectId = await this.resolveProjectId(projectIdOrSlug);
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'label.create',
    );

    const existing = await labelRepository.findByProjectAndName(
      projectId,
      input.name,
    );
    if (existing) {
      throw new ApiError(409, 'A label with this name already exists');
    }

    const label = await labelRepository.create({
      name: input.name,
      color: input.color,
      projectId,
    });

    return serializeLabel(label);
  }

  async update(
    userId: string,
    projectIdOrSlug: string,
    labelId: string,
    input: UpdateLabelInput,
  ) {
    const projectId = await this.resolveProjectId(projectIdOrSlug);
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'label.edit',
    );

    const label = await labelRepository.findById(labelId);
    if (!label || label.projectId !== projectId) {
      throw new ApiError(404, 'Label not found');
    }

    if (input.name && input.name !== label.name) {
      const existing = await labelRepository.findByProjectAndName(
        projectId,
        input.name,
      );
      if (existing) {
        throw new ApiError(409, 'A label with this name already exists');
      }
    }

    const updated = await labelRepository.update(labelId, input);
    return serializeLabel(updated);
  }

  async delete(userId: string, projectIdOrSlug: string, labelId: string) {
    const projectId = await this.resolveProjectId(projectIdOrSlug);
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'label.delete',
    );

    const label = await labelRepository.findById(labelId);
    if (!label || label.projectId !== projectId) {
      throw new ApiError(404, 'Label not found');
    }

    await labelRepository.delete(labelId);
  }

  async assignToTask(userId: string, taskId: string, labelId: string) {
    const projectId = await this.resolveProjectIdFromTask(taskId);
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'label.assign',
    );

    const label = await labelRepository.findById(labelId);
    if (!label || label.projectId !== projectId) {
      throw new ApiError(404, 'Label not found');
    }

    const existing = await labelRepository.findTaskLabel(taskId, labelId);
    if (existing) {
      throw new ApiError(409, 'Label is already assigned to this task');
    }

    const taskLabel = await labelRepository.assignToTask(taskId, labelId);
    return {
      id: taskLabel.label.id,
      name: taskLabel.label.name,
      color: taskLabel.label.color,
    };
  }

  async removeFromTask(userId: string, taskId: string, labelId: string) {
    const projectId = await this.resolveProjectIdFromTask(taskId);
    await projectAccessService.ensurePermission(
      userId,
      projectId,
      'label.assign',
    );

    const label = await labelRepository.findById(labelId);
    if (!label || label.projectId !== projectId) {
      throw new ApiError(404, 'Label not found');
    }

    await labelRepository.removeFromTask(taskId, labelId);
    return label.name;
  }
}

export const labelService = new LabelService();
