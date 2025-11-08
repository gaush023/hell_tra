import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import staticFiles from '@fastify/static';
import multipart from '@fastify/multipart';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { gameRoutes } from './routes/game';
import { UserService } from './services/UserService';
import { GameService } from './services/GameService';
import { TankGameService } from './services/TankGameService';
import { WebSocketService } from './services/WebSocketService';
import { DatabaseService } from './database/DatabaseService';
import path from 'path';

const fastify = Fastify({
  logger: true
});

// === plugin register (parent instance) ===
fastify.register(websocket);
fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// static
fastify.register(staticFiles, {
  root: path.join(process.cwd(), 'uploads'),
  prefix: '/api/avatars/',
  decorateReply: false
});

// CORS headers
fastify.addHook('onRequest', async (request, reply) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});

// handle OPTIONS
fastify.addHook('preHandler', async (request, reply) => {
  if (request.method === 'OPTIONS') {
    reply.code(200).send();
    return reply;
  }
});

// ==== DB init ====
const initializeServer = async () => {
  const db = DatabaseService.getInstance();
  await db.initialize();

  const userService = new UserService();
  const gameService = new GameService(userService);
  const tankGameService = new TankGameService(userService);
  const webSocketService = new WebSocketService(userService, gameService, tankGameService);

  return { userService, gameService, tankGameService, webSocketService };
};

const servicesPromise = initializeServer();

// === WebSocket route must be here (same scope as websocket plugin) ===
fastify.get('/ws/', { websocket: true }, async (connection, request) => {
  const { webSocketService } = await servicesPromise;
  webSocketService.handleConnection(connection as any, request);
});

// === normal API routes ===
fastify.register(async function (fastify) {
  const { userService, gameService } = await servicesPromise;

  fastify.decorate('userService', userService);
  fastify.decorate('gameService', gameService);

  await fastify.register(authRoutes);
  await fastify.register(userRoutes);
  await fastify.register(gameRoutes);
});

// health check
fastify.get('/health', async () => {
  return { status: 'OK', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server is running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
