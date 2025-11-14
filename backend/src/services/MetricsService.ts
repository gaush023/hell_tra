import { Registry, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';

/**
 * MetricsService handles all Prometheus metrics collection
 * for monitoring the application performance and business metrics
 */
export class MetricsService {
  private static instance: MetricsService;
  private readonly registry: Registry;

  // HTTP Metrics
  public readonly httpRequestsTotal: Counter;
  public readonly httpRequestDuration: Histogram;

  // WebSocket Metrics
  public readonly wsConnectionsTotal: Counter;
  public readonly wsActiveConnections: Gauge;
  public readonly wsMessagesTotal: Counter;

  // Game Metrics
  public readonly pongGamesTotal: Counter;
  public readonly pongGamesActive: Gauge;
  public readonly tankGamesTotal: Counter;
  public readonly tankGamesActive: Gauge;

  // User Metrics
  public readonly onlineUsers: Gauge;
  public readonly authenticatedUsers: Counter;

  private constructor() {
    this.registry = new Registry();

    // Collect default metrics (CPU, memory, etc.)
    collectDefaultMetrics({ register: this.registry });

    // HTTP Request Counter
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    // HTTP Request Duration Histogram
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry],
    });

    // WebSocket Connections Total
    this.wsConnectionsTotal = new Counter({
      name: 'ws_connections_total',
      help: 'Total number of WebSocket connections',
      labelNames: ['status'],
      registers: [this.registry],
    });

    // WebSocket Active Connections
    this.wsActiveConnections = new Gauge({
      name: 'ws_active_connections',
      help: 'Number of currently active WebSocket connections',
      registers: [this.registry],
    });

    // WebSocket Messages Total
    this.wsMessagesTotal = new Counter({
      name: 'ws_messages_total',
      help: 'Total number of WebSocket messages',
      labelNames: ['type', 'direction'],
      registers: [this.registry],
    });

    // Pong Games Total
    this.pongGamesTotal = new Counter({
      name: 'pong_games_total',
      help: 'Total number of Pong games',
      labelNames: ['status'],
      registers: [this.registry],
    });

    // Pong Games Active
    this.pongGamesActive = new Gauge({
      name: 'pong_games_active',
      help: 'Number of currently active Pong games',
      registers: [this.registry],
    });

    // Tank Games Total
    this.tankGamesTotal = new Counter({
      name: 'tank_games_total',
      help: 'Total number of Tank games',
      labelNames: ['status'],
      registers: [this.registry],
    });

    // Tank Games Active
    this.tankGamesActive = new Gauge({
      name: 'tank_games_active',
      help: 'Number of currently active Tank games',
      registers: [this.registry],
    });

    // Online Users
    this.onlineUsers = new Gauge({
      name: 'online_users_total',
      help: 'Number of currently online users',
      registers: [this.registry],
    });

    // Authenticated Users
    this.authenticatedUsers = new Counter({
      name: 'authenticated_users_total',
      help: 'Total number of authenticated users',
      labelNames: ['status'],
      registers: [this.registry],
    });
  }

  /**
   * Get singleton instance of MetricsService
   */
  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  /**
   * Get metrics in Prometheus format
   */
  public async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get content type for Prometheus metrics
   */
  public getContentType(): string {
    return this.registry.contentType;
  }
}
