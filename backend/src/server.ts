import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import {
  checkDatabaseHealth,
  connectDatabase,
  disconnectDatabase,
  env,
} from './config';
import { setupSocket } from './socket';
import { logger } from './utils/logger';

const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

setupSocket(io);

async function startServer(): Promise<void> {
  try {
    await connectDatabase();
    const dbHealthy = await checkDatabaseHealth();

    if (dbHealthy) {
      logger.info('Database connected');
    } else {
      logger.warn('Database connection failed — API will run in degraded mode');
    }

    server.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`API: http://localhost:${env.PORT}/api/v1`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

const shutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received — shutting down`);
  await disconnectDatabase();
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

void startServer();

export { io };
export default server;
