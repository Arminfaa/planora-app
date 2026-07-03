import { spawn } from 'child_process';
import { existsSync } from 'fs';
import net from 'net';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mongoDir = join(__dirname, '..', 'mongo');
const configPath = join(mongoDir, 'mongod-rs.cfg');
const port = 27018;

function findMongod() {
  if (process.platform === 'win32') {
    for (const version of ['8.0', '7.0', '6.0']) {
      const candidate = `C:\\Program Files\\MongoDB\\Server\\${version}\\bin\\mongod.exe`;
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return 'mongod';
}

function isPortOpen(host, portToCheck) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port: portToCheck });
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

const alreadyRunning = await isPortOpen('127.0.0.1', port);
if (alreadyRunning) {
  console.log(`MongoDB already running on 127.0.0.1:${port}`);
  process.exit(0);
}

const mongod = findMongod();
const child = spawn(mongod, ['--config', configPath], {
  cwd: mongoDir,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('error', (error) => {
  console.error(`Failed to start MongoDB (${mongod}):`, error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
