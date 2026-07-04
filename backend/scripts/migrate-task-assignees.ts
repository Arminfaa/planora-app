/**
 * One-time migration: copy legacy `assigneeId` into `assigneeIds` for existing tasks.
 * Run after schema change: npx tsx scripts/migrate-task-assignees.ts
 */
import { prisma } from '../src/config/database';

async function main() {
  const rawTasks = await prisma.$runCommandRaw({
    find: 'tasks',
    filter: {
      assigneeId: { $exists: true, $ne: null },
      $or: [{ assigneeIds: { $exists: false } }, { assigneeIds: { $size: 0 } }],
    },
  });

  const cursor = rawTasks as {
    cursor?: {
      firstBatch?: Array<{
        _id: { $oid: string };
        assigneeId: { $oid: string };
      }>;
    };
  };

  const batch = cursor.cursor?.firstBatch ?? [];
  let migrated = 0;

  for (const doc of batch) {
    const taskId = doc._id.$oid;
    const assigneeId = doc.assigneeId.$oid;

    await prisma.task.update({
      where: { id: taskId },
      data: { assigneeIds: [assigneeId] },
    });
    migrated += 1;
  }

  console.log(`Migrated ${migrated} task(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
