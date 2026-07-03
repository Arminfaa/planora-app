import { MongoClient } from 'mongodb';

const uri =
  process.env.DATABASE_URL ?? 'mongodb://127.0.0.1:27018/project_management';

function toSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db();
  const tasks = db.collection('tasks');
  const columns = db.collection('columns');
  const allTasks = await tasks.find({}).toArray();
  const usedSlugsByBoard = new Map();

  for (const task of allTasks) {
    const column = await columns.findOne({ _id: task.columnId });
    if (!column) {
      console.warn(`Skipping task ${task._id}: column not found`);
      continue;
    }

    const boardId = String(column.boardId);
    if (!usedSlugsByBoard.has(boardId)) {
      usedSlugsByBoard.set(boardId, new Set());
    }

    const used = usedSlugsByBoard.get(boardId);
    const updates = {};

    if (!task.boardId) {
      updates.boardId = column.boardId;
    }

    if (!task.slug || typeof task.slug !== 'string' || task.slug.length === 0) {
      let slug = toSlug(task.title ?? 'task') || `task-${Date.now()}`;
      if (used.has(slug)) {
        slug = `${slug}-${Date.now()}`;
      }
      updates.slug = slug;
      used.add(slug);
    } else {
      used.add(task.slug);
    }

    if (Object.keys(updates).length > 0) {
      await tasks.updateOne({ _id: task._id }, { $set: updates });
      console.log(
        `Updated task "${task.title}" -> ${updates.slug ?? task.slug}`,
      );
    }
  }
} finally {
  await client.close();
}
