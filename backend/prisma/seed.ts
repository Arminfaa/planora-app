import { Prisma, PrismaClient, ProjectGroupMessageType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SEED_PROJECTS, SEED_USERS } from './seed-data';

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(9 + (days % 8), (days * 7) % 60, 0, 0);
  return date;
}

function dueInDays(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(17, 0, 0, 0);
  return date;
}

async function clearDatabase() {
  console.log('Clearing existing database...');

  await prisma.projectGroupAttachment.deleteMany();
  await prisma.projectGroupMessage.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.taskChecklistItem.deleteMany();
  await prisma.taskLabel.deleteMany();
  await prisma.task.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
  await prisma.label.deleteMany();
  await prisma.projectInvite.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.projectRoleDefinition.deleteMany();
  await prisma.project.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await clearDatabase();

  const userByEmail = new Map<string, { id: string; name: string }>();

  console.log('Creating users...');
  for (const seedUser of SEED_USERS) {
    const passwordHash = await bcrypt.hash(seedUser.password, 12);
    const user = await prisma.user.create({
      data: {
        email: seedUser.email,
        name: seedUser.name,
        password: passwordHash,
      },
    });
    userByEmail.set(seedUser.email, { id: user.id, name: user.name });
  }

  const owner = userByEmail.get('arminfaa@gmail.com');
  if (!owner) {
    throw new Error('Owner user arminfaa@gmail.com was not created');
  }

  let totalTasks = 0;
  let totalComments = 0;
  let totalChecklistItems = 0;
  let totalMessages = 0;

  console.log('Creating projects, boards, tasks, and chat...');

  for (const projectSeed of SEED_PROJECTS) {
    const project = await prisma.project.create({
      data: {
        name: projectSeed.name,
        slug: projectSeed.slug,
        description: projectSeed.description,
        ownerId: owner.id,
      },
    });

    await prisma.projectMember.createMany({
      data: projectSeed.members.map((member) => {
        const user = userByEmail.get(member.email);
        if (!user) {
          throw new Error(`Unknown member email: ${member.email}`);
        }
        return {
          projectId: project.id,
          userId: user.id,
          role: member.role,
        };
      }),
    });

    const labelByName = new Map<string, string>();
    for (const labelSeed of projectSeed.labels) {
      const label = await prisma.label.create({
        data: {
          name: labelSeed.name,
          color: labelSeed.color,
          projectId: project.id,
        },
      });
      labelByName.set(labelSeed.name, label.id);
    }

    const taskIdsForActivity: string[] = [];
    const projectBoardIds: string[] = [];

    for (const boardSeed of projectSeed.boards) {
      const board = await prisma.board.create({
        data: {
          name: boardSeed.name,
          slug: boardSeed.slug,
          projectId: project.id,
          position: boardSeed.position,
          columns: {
            create: boardSeed.columns.map((column, index) => ({
              name: column.name,
              position: index,
              color: column.color,
            })),
          },
        },
        include: { columns: { orderBy: { position: 'asc' } } },
      });

      projectBoardIds.push(board.id);

      const columnByKey = new Map(
        boardSeed.columns.map((column, index) => [
          column.key,
          board.columns[index]!.id,
        ]),
      );

      for (const [taskIndex, taskSeed] of boardSeed.tasks.entries()) {
        const columnId = columnByKey.get(taskSeed.columnKey);
        if (!columnId) {
          throw new Error(
            `Unknown column key "${taskSeed.columnKey}" on board ${boardSeed.slug}`,
          );
        }

        const assigneeIds = (taskSeed.assigneeEmails ?? []).map((email) => {
          const user = userByEmail.get(email);
          if (!user) throw new Error(`Unknown assignee email: ${email}`);
          return user.id;
        });

        const creatorEmail =
          taskSeed.assigneeEmails?.[0] ?? 'arminfaa@gmail.com';
        const creator = userByEmail.get(creatorEmail) ?? owner;

        const isDoneColumn = ['done', 'resolved'].includes(taskSeed.columnKey);
        const isCompleted = taskSeed.isCompleted ?? isDoneColumn;

        const task = await prisma.task.create({
          data: {
            title: taskSeed.title,
            slug: taskSeed.slug,
            description: taskSeed.description,
            columnId,
            boardId: board.id,
            position: taskIndex,
            priority: taskSeed.priority,
            isCompleted,
            dueDate:
              taskSeed.dueDateOffsetDays !== undefined
                ? dueInDays(taskSeed.dueDateOffsetDays)
                : undefined,
            assigneeIds,
            createdById: creator.id,
          },
        });

        totalTasks += 1;
        taskIdsForActivity.push(task.id);

        if (taskSeed.labelNames) {
          for (const labelName of taskSeed.labelNames) {
            const labelId = labelByName.get(labelName);
            if (labelId) {
              await prisma.taskLabel.create({
                data: { taskId: task.id, labelId },
              });
            }
          }
        }

        if (taskSeed.checklist) {
          for (const [index, item] of taskSeed.checklist.entries()) {
            await prisma.taskChecklistItem.create({
              data: {
                taskId: task.id,
                title: item.title,
                isDone: item.isDone,
                position: index,
              },
            });
            totalChecklistItems += 1;
          }
        }

        if (taskSeed.comments) {
          for (const commentSeed of taskSeed.comments) {
            const author = userByEmail.get(commentSeed.authorEmail);
            if (!author) continue;

            await prisma.comment.create({
              data: {
                taskId: task.id,
                authorId: author.id,
                content: commentSeed.content,
                createdAt: daysAgo(Math.max(1, taskIndex + 2)),
              },
            });
            totalComments += 1;
          }
        }
      }
    }

    for (const chatSeed of projectSeed.chat) {
      const author = userByEmail.get(chatSeed.authorEmail);
      if (!author) continue;

      const createdAt = daysAgo(chatSeed.daysAgo);

      if (chatSeed.type === 'USER') {
        await prisma.projectGroupMessage.create({
          data: {
            projectId: project.id,
            type: ProjectGroupMessageType.USER,
            content: chatSeed.content,
            authorId: author.id,
            createdAt,
            updatedAt: createdAt,
          },
        });
      } else {
        const activityData = { ...chatSeed.activityData };

        if (
          chatSeed.activityType === 'member.joined' &&
          typeof activityData.memberName === 'string'
        ) {
          const joinedUser = [...userByEmail.values()].find(
            (user) => user.name === activityData.memberName,
          );
          if (joinedUser) {
            activityData.memberId = joinedUser.id;
          }
        }

        if (
          chatSeed.activityType.startsWith('task.') &&
          !activityData.taskId &&
          typeof activityData.taskTitle === 'string'
        ) {
          const linkedTask = await prisma.task.findFirst({
            where: {
              title: activityData.taskTitle as string,
              boardId: { in: projectBoardIds },
            },
          });
          if (linkedTask) {
            activityData.taskId = linkedTask.id;
          }
        }

        await prisma.projectGroupMessage.create({
          data: {
            projectId: project.id,
            type: ProjectGroupMessageType.ACTIVITY,
            authorId: author.id,
            activityType: chatSeed.activityType,
            activityData: activityData as Prisma.InputJsonValue,
            createdAt,
            updatedAt: createdAt,
          },
        });
      }

      totalMessages += 1;
    }

    if (taskIdsForActivity.length > 0) {
      await prisma.projectGroupMessage.create({
        data: {
          projectId: project.id,
          type: ProjectGroupMessageType.ACTIVITY,
          authorId: owner.id,
          activityType: 'board.created',
          activityData: { boardName: projectSeed.boards[0]!.name },
          createdAt: daysAgo(20),
          updatedAt: daysAgo(20),
        },
      });
      totalMessages += 1;
    }
  }

  console.log('');
  console.log('Seed completed successfully');
  console.log('────────────────────────────────────────');
  console.log(`  Projects:         ${SEED_PROJECTS.length}`);
  console.log(`  Users:            ${SEED_USERS.length}`);
  console.log(`  Tasks:            ${totalTasks}`);
  console.log(`  Checklist items:  ${totalChecklistItems}`);
  console.log(`  Task comments:    ${totalComments}`);
  console.log(`  Chat messages:    ${totalMessages}`);
  console.log('');
  console.log('Login credentials:');
  console.log('────────────────────────────────────────');
  for (const seedUser of SEED_USERS) {
    const marker =
      seedUser.email === 'arminfaa@gmail.com' ? ' (project owner)' : '';
    console.log(`  ${seedUser.email}${marker}`);
    console.log(`  Password: ${seedUser.password}`);
    console.log('');
  }
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
