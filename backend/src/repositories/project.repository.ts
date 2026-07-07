import { ProjectRole, type Project, type Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class ProjectRepository extends BaseRepository {
  async findById(id: string): Promise<Project | null> {
    return this.db.project.findUnique({ where: { id } });
  }

  async findByIdWithDetails(id: string) {
    return this.db.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { boards: true, members: true } },
      },
    });
  }

  async findBySlug(slug: string): Promise<Project | null> {
    return this.db.project.findUnique({ where: { slug } });
  }

  async findByUser(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Project[]; total: number }> {
    const where: Prisma.ProjectWhereInput = {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    };

    const [items, total] = await Promise.all([
      this.db.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { boards: true, members: true } },
        },
      }),
      this.db.project.count({ where }),
    ]);

    return { items, total };
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    ownerId: string;
    permissionMode?: import('@prisma/client').PermissionMode;
  }): Promise<Project> {
    return this.db.project.create({ data });
  }

  async update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    return this.db.project.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const boards = await tx.board.findMany({
        where: { projectId: id },
        select: { id: true },
      });
      const boardIds = boards.map((board) => board.id);

      const tasks = boardIds.length
        ? await tx.task.findMany({
            where: { boardId: { in: boardIds } },
            select: { id: true },
          })
        : [];
      const taskIds = tasks.map((task) => task.id);

      if (taskIds.length) {
        await tx.taskDependency.deleteMany({
          where: {
            OR: [{ fromTaskId: { in: taskIds } }, { toTaskId: { in: taskIds } }],
          },
        });
        await tx.taskLabel.deleteMany({ where: { taskId: { in: taskIds } } });
        await tx.comment.deleteMany({ where: { taskId: { in: taskIds } } });
        await tx.attachment.deleteMany({ where: { taskId: { in: taskIds } } });
        await tx.taskChecklistItem.deleteMany({
          where: { taskId: { in: taskIds } },
        });
        await tx.task.updateMany({
          where: { boardId: { in: boardIds } },
          data: { parentTaskId: null },
        });
        await tx.task.deleteMany({ where: { id: { in: taskIds } } });
      }

      await tx.taskDependency.deleteMany({ where: { projectId: id } });

      const columns = boardIds.length
        ? await tx.column.findMany({
            where: { boardId: { in: boardIds } },
            select: { id: true },
          })
        : [];
      const columnIds = columns.map((column) => column.id);

      if (columnIds.length) {
        await tx.column.deleteMany({ where: { id: { in: columnIds } } });
      }

      if (boardIds.length) {
        await tx.board.deleteMany({ where: { id: { in: boardIds } } });
      }

      await tx.projectGroupMessage.deleteMany({ where: { projectId: id } });
      await tx.notification.deleteMany({ where: { projectId: id } });
      await tx.label.deleteMany({ where: { projectId: id } });
      await tx.projectInvite.deleteMany({ where: { projectId: id } });
      await tx.projectRoleDefinition.deleteMany({ where: { projectId: id } });
      await tx.projectMember.deleteMany({ where: { projectId: id } });
      await tx.project.delete({ where: { id } });
    });
  }

  async addOwnerAsMember(projectId: string, userId: string): Promise<void> {
    await this.db.projectMember.create({
      data: {
        projectId,
        userId,
        role: ProjectRole.OWNER,
      },
    });
  }
}

export const projectRepository = new ProjectRepository();
