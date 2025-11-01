import { Gauge, Counter, Histogram, Registry } from 'prom-client';

export function createGameMetrics(registry: Registry) {
  const gameActiveMatches = new Gauge({
    name: 'game_active_matches',
    help: 'Number of matches currently in progress',
    registers: [registry],
  });

  const gameTotalMatches = new Counter({
    name: 'game_total_matches',
    help: 'Total number of matches started',
    registers: [registry],
  });

  const playersOnline = new Gauge({
    name: 'players_online',
    help: 'Number of players currently connected',
    registers: [registry],
  });

  const matchPlayers = new Gauge({
    name: 'match_players',
    help: 'Number of players in matches (by mode)',
    labelNames: ['mode'],
    registers: [registry],
  });

  const matchDuration = new Histogram({
    name: 'match_duration_seconds',
    help: 'Match duration in seconds',
    buckets: [30, 60, 120, 300, 600, 1800],
    registers: [registry],
  });

  const playerLatency = new Histogram({
    name: 'player_latency_ms',
    help: 'Player latency distribution in ms',
    buckets: [10, 30, 50, 100, 200, 500],
    registers: [registry],
  });

  return {
    gameActiveMatches,
    gameTotalMatches,
    playersOnline,
    matchPlayers,
    matchDuration,
    playerLatency,
  };
}

export type GameMetrics = ReturnType<typeof createGameMetrics>;
