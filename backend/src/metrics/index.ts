import { collectDefaultMetrics, Registry } from 'prom-client';
import fastifyPlugin from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { createGameMetrics, GameMetrics } from './gameMetrics';
import { httpRequestsTotal } from './httpRequests';

export const metricsRegister = new Registry();
collectDefaultMetrics({ register: metricsRegister });

metricsRegister.registerMetric(httpRequestsTotal);

export const gameMetrics: GameMetrics = createGameMetrics(metricsRegister);

const metricsPlugin = async (fastify: FastifyInstance) => {
  fastify.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', metricsRegister.contentType);
    return metricsRegister.metrics();
  });
};

export default fastifyPlugin(metricsPlugin);
export { httpRequestsTotal };

