import type { Prisma, PrismaClient } from '@prisma/client';

const assigneeSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
} as const;

export type TaskAssignee = Prisma.UserGetPayload<{
  select: typeof assigneeSelect;
}>;

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function enrichTasksWithAssignees<
  T extends { assigneeIds: string[] },
>(db: DbClient, tasks: T[]): Promise<Array<T & { assignees: TaskAssignee[] }>> {
  const allIds = [...new Set(tasks.flatMap((task) => task.assigneeIds ?? []))];

  if (allIds.length === 0) {
    return tasks.map((task) => ({ ...task, assignees: [] }));
  }

  const users = await db.user.findMany({
    where: { id: { in: allIds } },
    select: assigneeSelect,
  });

  const userMap = new Map(users.map((user) => [user.id, user]));

  return tasks.map((task) => ({
    ...task,
    assignees: (task.assigneeIds ?? [])
      .map((id) => userMap.get(id))
      .filter((user): user is TaskAssignee => user != null),
  }));
}

export async function enrichTaskWithAssignees<
  T extends { assigneeIds: string[] },
>(db: DbClient, task: T): Promise<T & { assignees: TaskAssignee[] }> {
  const [enriched] = await enrichTasksWithAssignees(db, [task]);
  return enriched;
}
