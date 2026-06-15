import { env } from '@avkash/config';

// BullMQ connection options derived from REDIS_URL. Plain options (not a live
// IORedis instance) — so importing this module opens NO connection; BullMQ creates
// the connection (with the worker-required settings) only when a Queue/Worker is
// constructed. That keeps the API safe to depend on @avkash/jobs without Redis.
const url = new URL(env.REDIS_URL);
export const connection = {
  host: url.hostname,
  port: Number(url.port || 6379),
  ...(url.password ? { password: url.password } : {}),
};
