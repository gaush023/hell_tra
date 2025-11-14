import { FastifyInstance } from 'fastify';
import { MetricsService } from '../services/MetricsService';

/**
 * Test endpoints for generating metrics (development only)
 */
export async function testMetricsRoutes(fastify: FastifyInstance) {
  const metricsService = MetricsService.getInstance();

  // Simulate a Pong game start
  fastify.post('/api/test/pong/start', async (request, reply) => {
    metricsService.pongGamesTotal.inc({ status: 'started' });
    metricsService.pongGamesActive.inc();

    return {
      message: 'Pong game started (test)',
      active: await metricsService.getMetrics().then(m => {
        const match = m.match(/pong_games_active (\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
    };
  });

  // Simulate a Pong game end
  fastify.post('/api/test/pong/end', async (request, reply) => {
    metricsService.pongGamesTotal.inc({ status: 'ended' });
    metricsService.pongGamesActive.dec();

    return {
      message: 'Pong game ended (test)',
      active: await metricsService.getMetrics().then(m => {
        const match = m.match(/pong_games_active (\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
    };
  });

  // Simulate a Tank game start
  fastify.post('/api/test/tank/start', async (request, reply) => {
    metricsService.tankGamesTotal.inc({ status: 'started' });
    metricsService.tankGamesActive.inc();

    return {
      message: 'Tank game started (test)',
      active: await metricsService.getMetrics().then(m => {
        const match = m.match(/tank_games_active (\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
    };
  });

  // Simulate a Tank game end
  fastify.post('/api/test/tank/end', async (request, reply) => {
    metricsService.tankGamesTotal.inc({ status: 'ended' });
    metricsService.tankGamesActive.dec();

    return {
      message: 'Tank game ended (test)',
      active: await metricsService.getMetrics().then(m => {
        const match = m.match(/tank_games_active (\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
    };
  });

  // Simulate multiple game sessions
  fastify.post('/api/test/simulate-games', async (request, reply) => {
    const body = request.body as any;
    const pongGames = body?.pongGames || 2;
    const tankGames = body?.tankGames || 2;

    // Start Pong games
    for (let i = 0; i < pongGames; i++) {
      metricsService.pongGamesTotal.inc({ status: 'started' });
      metricsService.pongGamesActive.inc();
    }

    // Start Tank games
    for (let i = 0; i < tankGames; i++) {
      metricsService.tankGamesTotal.inc({ status: 'started' });
      metricsService.tankGamesActive.inc();
    }

    // Schedule some games to end after a delay
    setTimeout(() => {
      if (pongGames > 0) {
        metricsService.pongGamesTotal.inc({ status: 'ended' });
        metricsService.pongGamesActive.dec();
      }
      if (tankGames > 0) {
        metricsService.tankGamesTotal.inc({ status: 'ended' });
        metricsService.tankGamesActive.dec();
      }
    }, 10000); // End after 10 seconds

    return {
      message: 'Games simulated',
      pongGames,
      tankGames,
      note: 'Some games will end after 10 seconds'
    };
  });
}
