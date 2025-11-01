import { Counter } from 'prom-client';

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'total requests',
  labelNames: ['method', 'route', 'status_code', 'service'],
});
