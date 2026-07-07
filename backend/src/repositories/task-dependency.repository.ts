import { BaseRepository } from './base.repository';

const dependencyInclude = {
  fromTask: {
    select: {
      id: true,
      title: true,
      slug: true,
      boardId: true,
      board: { select: { id: true, name: true, slug: true } },
    },
  },
  toTask: {
    select: {
      id: true,
      title: true,
      slug: true,
      boardId: true,
      board: { select: { id: true, name: true, slug: true } },
    },
  },
} as const;

export class TaskDependencyRepository extends BaseRepository {
  async findByProject(projectId: string) {
    return this.db.taskDependency.findMany({
      where: { projectId },
      include: dependencyInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string) {
    return this.db.taskDependency.findUnique({
      where: { id },
      include: dependencyInclude,
    });
  }

  async findByTask(taskId: string) {
    return this.db.taskDependency.findMany({
      where: {
        OR: [{ fromTaskId: taskId }, { toTaskId: taskId }],
      },
      include: dependencyInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findEdge(fromTaskId: string, toTaskId: string) {
    return this.db.taskDependency.findUnique({
      where: {
        fromTaskId_toTaskId: { fromTaskId, toTaskId },
      },
    });
  }

  async create(data: {
    projectId: string;
    fromTaskId: string;
    toTaskId: string;
    createdById: string;
  }) {
    return this.db.taskDependency.create({
      data,
      include: dependencyInclude,
    });
  }

  async delete(id: string) {
    return this.db.taskDependency.delete({
      where: { id },
      include: dependencyInclude,
    });
  }

  async listEdgesByProject(projectId: string) {
    return this.db.taskDependency.findMany({
      where: { projectId },
      select: { fromTaskId: true, toTaskId: true },
    });
  }
}

export const taskDependencyRepository = new TaskDependencyRepository();
