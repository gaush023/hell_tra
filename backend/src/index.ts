import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import staticFiles from '@fastify/static';
import multipart from '@fastify/multipart';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { gameRoutes } from './routes/game';
import { testMetricsRoutes } from './routes/test-metrics';
import { UserService } from './services/UserService';
import { GameService } from './services/GameService';
import { TankGameService } from './services/TankGameService';
import { WebSocketService } from './services/WebSocketService';
import { DatabaseService } from './database/DatabaseService';
import { MetricsService } from './services/MetricsService';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables (optional - will use defaults if .env doesn't exist)
try {
  dotenv.config({ path: path.join(__dirname, '../../.env') });
} catch (e) {
  console.log('No .env file found, using default configuration');
}

// HTTPS Configuration with defaults
const sslKeyPath = path.join(__dirname, '../../', process.env.SSL_KEY_PATH || 'certs/server.key');
const sslCertPath = path.join(__dirname, '../../', process.env.SSL_CERT_PATH || 'certs/server.crt');

// Check if SSL certificates exist
const certsExist = fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath);

// Enable HTTPS if certificates exist (unless explicitly disabled)
const httpsEnabled = process.env.HTTPS_ENABLED === 'true' && certsExist;

const httpsOptions = httpsEnabled ? {
  https: {
    key: fs.readFileSync(sslKeyPath),
    cert: fs.readFileSync(sslCertPath)
  }
} : {};

const fastify = Fastify({
  logger: true,
  ...httpsOptions
});

// Initialize metrics service
const metricsService = MetricsService.getInstance();

fastify.register(websocket);
fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Serve static files for avatar uploads
fastify.register(staticFiles, {
  root: path.join(process.cwd(), 'uploads', 'avatars'),
  prefix: '/api/avatars/',
  decorateReply: false
});

// Add CORS support globally - using onRequest to catch all requests early
fastify.addHook('onRequest', async (request, reply) => {
  const origin = process.env.FRONTEND_URL || 'https://localhost';

  // Set CORS headers for all requests
  reply.header('Access-Control-Allow-Origin', origin);
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  reply.header('Access-Control-Allow-Credentials', 'true');
  reply.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours

  // Handle OPTIONS preflight immediately
  if (request.method === 'OPTIONS') {
    reply.code(204).send();
  }

  // Start metrics timer
  (request as any).metricsStartTime = process.hrtime();
});

// Track HTTP request metrics
fastify.addHook('onResponse', async (request, reply) => {
  // Skip metrics endpoint to avoid recursion
  if (request.url === '/metrics') {
    return;
  }

  const route = request.routeOptions?.url || request.url || 'unknown';
  const method = request.method;
  const statusCode = reply.statusCode.toString();

  // Increment request counter
  metricsService.httpRequestsTotal.inc({ method, route, status_code: statusCode });

  // Record request duration
  if ((request as any).metricsStartTime) {
    const [seconds, nanoseconds] = process.hrtime((request as any).metricsStartTime);
    const duration = seconds + nanoseconds / 1e9;
    metricsService.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
  }
});

// Initialize database first
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

fastify.register(async function (fastify) {
  const { userService, gameService } = await servicesPromise;

  // Pass userService and gameService to routes
  fastify.decorate('userService', userService);
  fastify.decorate('gameService', gameService);

  await fastify.register(authRoutes, { prefix: '/api' });
  await fastify.register(userRoutes, { prefix: '/api' });
  await fastify.register(gameRoutes, { prefix: '/api' });
  await fastify.register(testMetricsRoutes); // Test endpoints for metrics
});

fastify.register(async function (fastify) {
  const { webSocketService } = await servicesPromise;

  fastify.get('/ws', { websocket: true }, (connection, request) => {
    webSocketService.handleConnection(connection as any, request);
  });
});

fastify.get('/health', async () => {
  return { status: 'OK', timestamp: new Date().toISOString() };
});

// Prometheus metrics endpoint
fastify.get('/metrics', async (request, reply) => {
  // Update game metrics with actual counts from game services
  const services = await servicesPromise;
  const pongActiveCount = services.gameService.getActiveGamesCount();
  const tankActiveCount = services.tankGameService.getActiveGamesCount();

  metricsService.pongGamesActive.set(pongActiveCount);
  metricsService.tankGamesActive.set(tankActiveCount);

  reply.header('Content-Type', metricsService.getContentType());
  return metricsService.getMetrics();
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001', 10);
    await fastify.listen({ port, host: '0.0.0.0' });
    const protocol = (httpsEnabled && certsExist) ? 'https' : 'http';
    console.log(`\n🚀 Server is running on ${protocol}://localhost:${port}`);
    console.log(`📡 WebSocket: ${protocol === 'https' ? 'wss' : 'ws'}://localhost:${port}/ws`);
    console.log(`🔒 HTTPS: ${httpsEnabled && certsExist ? 'Enabled ✓' : 'Disabled (using HTTP)'}`);
    if (httpsEnabled && !certsExist) {
      console.log('⚠️  HTTPS_ENABLED=true but certificates not found. Run ./generate-certs.sh');
    }
    console.log('');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
