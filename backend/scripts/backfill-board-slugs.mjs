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
  const boards = db.collection('boards');
  const allBoards = await boards.find({}).toArray();
  const usedSlugsByProject = new Map();

  for (const board of allBoards) {
    const projectId = String(board.projectId);
    if (!usedSlugsByProject.has(projectId)) {
      usedSlugsByProject.set(projectId, new Set());
    }

    const used = usedSlugsByProject.get(projectId);
    if (board.slug && typeof board.slug === 'string') {
      used.add(board.slug);
      continue;
    }

    let slug = toSlug(board.name ?? 'board');
    if (used.has(slug)) {
      slug = `${slug}-${Date.now()}`;
    }

    used.add(slug);
    await boards.updateOne({ _id: board._id }, { $set: { slug } });
    console.log(`Updated board "${board.name}" -> ${slug}`);
  }
} finally {
  await client.close();
}
