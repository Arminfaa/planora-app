import { MongoClient } from 'mongodb';
import { EJSON } from 'bson';
import dotenv from 'dotenv';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');
const dumpDir = join(backendRoot, 'mongo-dump');

dotenv.config({ path: join(backendRoot, '.env') });
dotenv.config({ path: join(backendRoot, '.env.production') });

const SOURCE_URL =
  process.env.SOURCE_DATABASE_URL ??
  'mongodb://127.0.0.1:27018/project_management?replicaSet=rs0';

const TARGET_URL = process.env.TARGET_DATABASE_URL ?? process.env.DATABASE_URL;

const BATCH_SIZE = 500;
const mode = process.argv[2] ?? 'all';

function getDbName(uri) {
  const normalized = uri
    .replace('mongodb+srv://', 'https://')
    .replace('mongodb://', 'https://');
  const pathname = new URL(normalized).pathname;
  const name = pathname.replace(/^\//, '').split('?')[0];
  return name || 'project_management';
}

function serializeDocs(docs) {
  return EJSON.stringify(docs, { relaxed: false });
}

function deserializeDocs(raw) {
  return EJSON.parse(raw);
}

async function exportLocal() {
  const dbName = getDbName(SOURCE_URL);
  console.log(`Exporting ${dbName} from local MongoDB...`);

  const client = new MongoClient(SOURCE_URL);
  await client.connect();

  try {
    const db = client.db(dbName);
    const collections = (await db.listCollections().toArray())
      .map((c) => c.name)
      .filter((name) => !name.startsWith('system.'))
      .sort();

    await mkdir(dumpDir, { recursive: true });

    let totalDocs = 0;
    for (const name of collections) {
      const docs = await db.collection(name).find({}).toArray();
      const filePath = join(dumpDir, `${name}.json`);
      await writeFile(filePath, serializeDocs(docs), 'utf8');
      console.log(`  ${name}: ${docs.length} documents`);
      totalDocs += docs.length;
    }

    await writeFile(
      join(dumpDir, '_meta.json'),
      JSON.stringify(
        { dbName, collections, exportedAt: new Date().toISOString() },
        null,
        2,
      ),
      'utf8',
    );

    console.log(
      `\nExport done. ${totalDocs} documents saved to backend/mongo-dump/`,
    );
  } finally {
    await client.close();
  }
}

async function importToAtlas() {
  if (!TARGET_URL) {
    console.error(
      'Missing TARGET_DATABASE_URL or DATABASE_URL (Atlas connection string).',
    );
    process.exit(1);
  }

  const metaPath = join(dumpDir, '_meta.json');
  const meta = JSON.parse(await readFile(metaPath, 'utf8'));
  const targetDbName = getDbName(TARGET_URL);

  console.log(
    `Importing ${meta.collections.length} collections into Atlas (${targetDbName})...`,
  );

  const client = new MongoClient(TARGET_URL, {
    serverSelectionTimeoutMS: 30_000,
    connectTimeoutMS: 30_000,
  });
  await client.connect();

  try {
    const db = client.db(targetDbName);
    let totalDocs = 0;

    for (const name of meta.collections) {
      const filePath = join(dumpDir, `${name}.json`);
      const raw = await readFile(filePath, 'utf8');
      const docs = deserializeDocs(raw);

      await db.collection(name).deleteMany({});

      if (docs.length === 0) {
        console.log(`  ${name}: empty, skipped`);
        continue;
      }

      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = docs.slice(i, i + BATCH_SIZE);
        await db.collection(name).insertMany(batch, { ordered: false });
      }

      console.log(`  ${name}: ${docs.length} documents`);
      totalDocs += docs.length;
    }

    console.log(`\nImport done. ${totalDocs} documents copied to Atlas.`);
  } finally {
    await client.close();
  }
}

async function migrateDirect() {
  if (!TARGET_URL) {
    console.error(
      'Missing TARGET_DATABASE_URL or DATABASE_URL (Atlas connection string).',
    );
    process.exit(1);
  }

  if (SOURCE_URL === TARGET_URL) {
    console.error('Source and target database URLs must be different.');
    process.exit(1);
  }

  const sourceDbName = getDbName(SOURCE_URL);
  const targetDbName = getDbName(TARGET_URL);

  console.log(`Source: ${sourceDbName} @ local`);
  console.log(`Target: ${targetDbName} @ Atlas`);

  const sourceClient = new MongoClient(SOURCE_URL);
  const targetClient = new MongoClient(TARGET_URL, {
    serverSelectionTimeoutMS: 30_000,
    connectTimeoutMS: 30_000,
  });

  await sourceClient.connect();
  await targetClient.connect();

  try {
    const sourceDb = sourceClient.db(sourceDbName);
    const targetDb = targetClient.db(targetDbName);

    const collections = (await sourceDb.listCollections().toArray())
      .map((c) => c.name)
      .filter((name) => !name.startsWith('system.'))
      .sort();

    let totalDocs = 0;
    for (const name of collections) {
      const docs = await sourceDb.collection(name).find({}).toArray();
      await targetDb.collection(name).deleteMany({});

      if (docs.length === 0) {
        console.log(`  ${name}: empty, skipped`);
        continue;
      }

      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        await targetDb
          .collection(name)
          .insertMany(docs.slice(i, i + BATCH_SIZE), {
            ordered: false,
          });
      }

      console.log(`  ${name}: ${docs.length} documents`);
      totalDocs += docs.length;
    }

    console.log(`\nDone. ${totalDocs} documents copied to Atlas.`);
  } finally {
    await sourceClient.close();
    await targetClient.close();
  }
}

async function main() {
  switch (mode) {
    case 'export':
      await exportLocal();
      break;
    case 'import':
      await importToAtlas();
      break;
    case 'all':
      await migrateDirect();
      break;
    default:
      console.error(
        'Usage: node scripts/migrate-to-atlas.mjs [export|import|all]',
      );
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
