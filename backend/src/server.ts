import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import { env } from './config';
import { logger } from './utils/logger';

const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

io.on('connection', (socket) => {
  logger.debug(`Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.debug(`Socket disconnected: ${socket.id}`);
  });
});

export { io };

server.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`API: http://localhost:${env.PORT}/api/v1`);
});

export default server;
