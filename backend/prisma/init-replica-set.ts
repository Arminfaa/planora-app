import { MongoClient } from 'mongodb';

const MONGO_URI =
  process.env.DATABASE_URL?.split('?')[0] ??
  'mongodb://127.0.0.1:27018/project_management';

const BASE_URI = MONGO_URI.replace(/\/[^/]*$/, '');

async function main() {
  const client = new MongoClient(`${BASE_URI}/?directConnection=true`);
  await client.connect();

  try {
    const status = await client.db('admin').command({ replSetGetStatus: 1 });
    console.log(`Replica set already active: ${status.set}`);
  } catch {
    console.log('Initializing single-node replica set...');
    await client.db('admin').command({
      replSetInitiate: {
        _id: 'rs0',
        members: [{ _id: 0, host: '127.0.0.1:27018' }],
      },
    });
    console.log('Replica set initialized: rs0');
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  await client.close();
}

main().catch((error) => {
  console.error('Replica set init failed:', error);
  process.exit(1);
});
