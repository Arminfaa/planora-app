import { PrismaClient, ProjectRole, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { toSlug } from '../src/utils/slug';

const prisma = new PrismaClient();

async function findOrCreateUser(
  email: string,
  name: string,
  passwordHash: string,
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  return prisma.user.create({
    data: { email, name, password: passwordHash },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await findOrCreateUser(
    'admin@example.com',
    'Admin User',
    passwordHash,
  );

  const member = await findOrCreateUser(
    'member@example.com',
    'Team Member',
    passwordHash,
  );

  let project = await prisma.project.findUnique({
    where: { slug: 'demo-project' },
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Demo Project',
        slug: 'demo-project',
        description: 'A sample project to explore the platform',
        ownerId: admin.id,
      },
    });

    await prisma.projectMember.createMany({
      data: [
        { projectId: project.id, userId: admin.id, role: ProjectRole.OWNER },
        { projectId: project.id, userId: member.id, role: ProjectRole.MEMBER },
      ],
    });
  }

  const boardsMissingSlug = await prisma.board.findMany({
    where: { slug: { isSet: false } },
  });

  for (const existingBoard of boardsMissingSlug) {
    let slug = toSlug(existingBoard.name);
    const duplicate = await prisma.board.findFirst({
      where: {
        projectId: existingBoard.projectId,
        slug,
        NOT: { id: existingBoard.id },
      },
    });
    if (duplicate) {
      slug = `${slug}-${Date.now()}`;
    }
    await prisma.board.update({
      where: { id: existingBoard.id },
      data: { slug },
    });
  }

  let board = await prisma.board.findFirst({
    where: {
      projectId: project.id,
      OR: [{ slug: 'main-board' }, { name: 'Main Board' }],
    },
    include: { columns: { orderBy: { position: 'asc' } } },
  });

  if (!board) {
    board = await prisma.board.create({
      data: {
        name: 'Main Board',
        slug: 'main-board',
        projectId: project.id,
        position: 0,
        columns: {
          create: [
            { name: 'To Do', position: 0, color: '#6B7280' },
            { name: 'In Progress', position: 1, color: '#3B82F6' },
            { name: 'Done', position: 2, color: '#10B981' },
          ],
        },
      },
      include: { columns: { orderBy: { position: 'asc' } } },
    });
  } else if (board.slug !== 'main-board') {
    board = await prisma.board.update({
      where: { id: board.id },
      data: { slug: 'main-board' },
      include: { columns: { orderBy: { position: 'asc' } } },
    });
  }

  const boardsStillMissingSlug = await prisma.board.findMany({
    where: { slug: { isSet: false } },
  });

  for (const existingBoard of boardsStillMissingSlug) {
    let slug = toSlug(existingBoard.name);
    const duplicate = await prisma.board.findFirst({
      where: {
        projectId: existingBoard.projectId,
        slug,
        NOT: { id: existingBoard.id },
      },
    });
    if (duplicate) {
      slug = `${slug}-${Date.now()}`;
    }
    await prisma.board.update({
      where: { id: existingBoard.id },
      data: { slug },
    });
  }

  const [todoCol, inProgressCol, doneCol] = board.columns;

  const existingTasks = await prisma.task.count({
    where: { column: { boardId: board.id } },
  });

  if (existingTasks === 0) {
    await prisma.task.createMany({
      data: [
        {
          title: 'Set up project repository',
          slug: 'set-up-project-repository',
          description: 'Initialize the monorepo structure',
          columnId: doneCol.id,
          boardId: board.id,
          position: 0,
          priority: TaskPriority.HIGH,
          createdById: admin.id,
          assigneeId: admin.id,
        },
        {
          title: 'Design database schema',
          slug: 'design-database-schema',
          description: 'Create Prisma models for all entities',
          columnId: doneCol.id,
          boardId: board.id,
          position: 1,
          priority: TaskPriority.HIGH,
          createdById: admin.id,
          assigneeId: admin.id,
        },
        {
          title: 'Implement authentication',
          slug: 'implement-authentication',
          description: 'JWT login and register endpoints',
          columnId: inProgressCol.id,
          boardId: board.id,
          position: 0,
          priority: TaskPriority.MEDIUM,
          createdById: admin.id,
          assigneeId: member.id,
        },
        {
          title: 'Build Kanban board UI',
          slug: 'build-kanban-board-ui',
          description: 'Drag and drop task management',
          columnId: todoCol.id,
          boardId: board.id,
          position: 0,
          priority: TaskPriority.MEDIUM,
          createdById: admin.id,
        },
      ],
    });
  }

  const labels = [
    { name: 'Bug', color: '#EF4444' },
    { name: 'Feature', color: '#8B5CF6' },
    { name: 'Enhancement', color: '#06B6D4' },
  ] as const;

  for (const label of labels) {
    const exists = await prisma.label.findFirst({
      where: { projectId: project.id, name: label.name },
    });

    if (!exists) {
      await prisma.label.create({
        data: {
          name: label.name,
          color: label.color,
          projectId: project.id,
        },
      });
    }
  }

  const userCount = await prisma.user.count();
  const taskCount = await prisma.task.count();

  console.log('Seed completed successfully');
  console.log(`  Users: ${userCount} | Tasks: ${taskCount}`);
  console.log('  admin@example.com / member@example.com');
  console.log('  Password: password123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
