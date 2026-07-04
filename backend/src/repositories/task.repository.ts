import type { Prisma } from '@prisma/client';
import {
  enrichTaskWithAssignees,
  enrichTasksWithAssignees,
} from '../utils/task-enrichment';
import { BaseRepository } from './base.repository';

const taskInclude = {
  createdBy: {
    select: { id: true, name: true, email: true },
  },
  labels: {
    include: { label: true },
  },
  checklistItems: {
    orderBy: { position: 'asc' as const },
  },
} satisfies Prisma.TaskInclude;

type TaskRecord = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;
type EnrichedTask = Awaited<
  ReturnType<typeof enrichTaskWithAssignees<TaskRecord>>
>;

export class TaskRepository extends BaseRepository {
  private async enrichOne(task: TaskRecord): Promise<EnrichedTask> {
    return enrichTaskWithAssignees(this.db, task);
  }

  private async enrichMany(tasks: TaskRecord[]): Promise<EnrichedTask[]> {
    return enrichTasksWithAssignees(this.db, tasks);
  }

  async findByBoardAndSlug(boardId: string, slug: string) {
    const task = await this.db.task.findUnique({
      where: { boardId_slug: { boardId, slug } },
      include: taskInclude,
    });
    return task ? this.enrichOne(task) : null;
  }

  async findById(id: string) {
    const task = await this.db.task.findUnique({
      where: { id },
      include: taskInclude,
    });
    return task ? this.enrichOne(task) : null;
  }

  async findByColumn(
    columnId: string,
    page: number,
    limit: number,
  ): Promise<{ items: EnrichedTask[]; total: number }> {
    const where = { columnId };

    const [items, total] = await Promise.all([
      this.db.task.findMany({
        where,
        orderBy: { position: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: taskInclude,
      }),
      this.db.task.count({ where }),
    ]);

    return { items: await this.enrichMany(items), total };
  }

  async findByBoard(boardId: string) {
    const tasks = await this.db.task.findMany({
      where: { boardId },
      orderBy: [{ column: { position: 'asc' } }, { position: 'asc' }],
      include: {
        ...taskInclude,
        column: {
          select: { id: true, name: true, color: true, position: true },
        },
      },
    });
    return this.enrichMany(tasks);
  }

  async create(data: {
    title: string;
    slug: string;
    description?: string;
    columnId: string;
    boardId: string;
    position?: number;
    priority?: Prisma.TaskCreateInput['priority'];
    dueDate?: Date;
    assigneeIds?: string[];
    createdById: string;
  }) {
    const task = await this.db.task.create({
      data: {
        ...data,
        assigneeIds: data.assigneeIds ?? [],
      },
      include: taskInclude,
    });
    return this.enrichOne(task);
  }

  async update(id: string, data: Prisma.TaskUpdateInput) {
    const task = await this.db.task.update({
      where: { id },
      data,
      include: taskInclude,
    });
    return this.enrichOne(task);
  }

  async moveTask(
    taskId: string,
    targetColumnId: string,
    targetPosition: number,
  ) {
    const task = await this.db.task.findUnique({
      where: { id: taskId },
      select: { id: true, columnId: true },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    const sourceColumnId = task.columnId;

    await this.db.$transaction(async (tx) => {
      const reorderColumn = async (
        columnId: string,
        orderedIds: string[],
      ): Promise<void> => {
        for (let index = 0; index < orderedIds.length; index += 1) {
          await tx.task.update({
            where: { id: orderedIds[index] },
            data: { columnId, position: index },
          });
        }
      };

      const getOrderedIds = async (columnId: string): Promise<string[]> => {
        const tasks = await tx.task.findMany({
          where: { columnId },
          orderBy: { position: 'asc' },
          select: { id: true },
        });
        return tasks.map((item) => item.id);
      };

      if (sourceColumnId === targetColumnId) {
        const ids = await getOrderedIds(sourceColumnId);
        const fromIndex = ids.indexOf(taskId);
        if (fromIndex === -1) return;

        const [removed] = ids.splice(fromIndex, 1);
        const toIndex = Math.max(0, Math.min(targetPosition, ids.length));
        ids.splice(toIndex, 0, removed);

        await reorderColumn(sourceColumnId, ids);
        return;
      }

      const sourceIds = (await getOrderedIds(sourceColumnId)).filter(
        (id) => id !== taskId,
      );
      const targetIds = (await getOrderedIds(targetColumnId)).filter(
        (id) => id !== taskId,
      );
      const toIndex = Math.max(0, Math.min(targetPosition, targetIds.length));
      targetIds.splice(toIndex, 0, taskId);

      await reorderColumn(sourceColumnId, sourceIds);
      await reorderColumn(targetColumnId, targetIds);
    });

    return this.findById(taskId);
  }

  async delete(id: string): Promise<void> {
    const task = await this.db.task.findUnique({
      where: { id },
      select: { columnId: true },
    });

    if (!task) return;

    await this.db.$transaction(async (tx) => {
      await tx.taskLabel.deleteMany({ where: { taskId: id } });
      await tx.comment.deleteMany({ where: { taskId: id } });
      await tx.attachment.deleteMany({ where: { taskId: id } });
      await tx.taskChecklistItem.deleteMany({ where: { taskId: id } });
      await tx.task.delete({ where: { id } });

      const remaining = await tx.task.findMany({
        where: { columnId: task.columnId },
        orderBy: { position: 'asc' },
        select: { id: true },
      });

      for (let index = 0; index < remaining.length; index += 1) {
        await tx.task.update({
          where: { id: remaining[index].id },
          data: { position: index },
        });
      }
    });
  }

  async getColumnId(taskId: string): Promise<string | null> {
    const task = await this.db.task.findUnique({
      where: { id: taskId },
      select: { columnId: true },
    });
    return task?.columnId ?? null;
  }

  async getProgressStatsByProjectId(projectId: string) {
    const [tasks, boards] = await Promise.all([
      this.db.task.findMany({
        where: { column: { board: { projectId } } },
        select: { isCompleted: true, assigneeIds: true, boardId: true },
      }),
      this.db.board.findMany({
        where: { projectId },
        select: { id: true, name: true, slug: true, position: true },
        orderBy: { position: 'asc' },
      }),
    ]);

    const computeStats = (items: { isCompleted: boolean }[]) => {
      const totalTasks = items.length;
      const completedTasks = items.filter((task) => task.isCompleted).length;
      const inProgressTasks = totalTasks - completedTasks;
      const completionPercent =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        completionPercent,
      };
    };

    const buildTeamWorkload = (
      boardTasks: { assigneeIds: string[] }[],
      userById: Map<
        string,
        { id: string; name: string; avatar: string | null }
      >,
      limit = 8,
    ) => {
      const assigneeCounts = new Map<string, number>();
      for (const task of boardTasks) {
        for (const assigneeId of task.assigneeIds) {
          assigneeCounts.set(
            assigneeId,
            (assigneeCounts.get(assigneeId) ?? 0) + 1,
          );
        }
      }

      return [...assigneeCounts.keys()]
        .map((userId) => {
          const user = userById.get(userId);
          if (!user) return null;

          return {
            userId: user.id,
            name: user.name,
            avatar: user.avatar,
            assignedTaskCount: assigneeCounts.get(userId) ?? 0,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .sort((a, b) => b.assignedTaskCount - a.assignedTaskCount)
        .slice(0, limit);
    };

    const overall = computeStats(tasks);

    const tasksByBoard = new Map<string, typeof tasks>();
    for (const task of tasks) {
      const boardTasks = tasksByBoard.get(task.boardId) ?? [];
      boardTasks.push(task);
      tasksByBoard.set(task.boardId, boardTasks);
    }

    const allAssigneeIds = new Set<string>();
    for (const task of tasks) {
      for (const assigneeId of task.assigneeIds) {
        allAssigneeIds.add(assigneeId);
      }
    }

    const users =
      allAssigneeIds.size > 0
        ? await this.db.user.findMany({
            where: { id: { in: [...allAssigneeIds] } },
            select: { id: true, name: true, avatar: true },
          })
        : [];

    const userById = new Map(users.map((user) => [user.id, user]));
    const teamWorkload = buildTeamWorkload(tasks, userById);

    const boardStats = boards.map((board) => {
      const boardTasks = tasksByBoard.get(board.id) ?? [];

      return {
        boardId: board.id,
        boardName: board.name,
        boardSlug: board.slug,
        ...computeStats(boardTasks),
        teamWorkload: buildTeamWorkload(boardTasks, userById),
      };
    });

    return {
      ...overall,
      teamWorkload,
      boards: boardStats,
    };
  }

  async unassignUserFromProject(
    userId: string,
    projectId: string,
  ): Promise<void> {
    const tasks = await this.db.task.findMany({
      where: {
        assigneeIds: { has: userId },
        column: { board: { projectId } },
      },
      select: { id: true, assigneeIds: true },
    });

    await Promise.all(
      tasks.map((task) =>
        this.db.task.update({
          where: { id: task.id },
          data: {
            assigneeIds: task.assigneeIds.filter((id) => id !== userId),
          },
        }),
      ),
    );
  }
}

export const taskRepository = new TaskRepository();
