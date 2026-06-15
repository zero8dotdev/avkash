import { createMiddleware } from 'hono/factory';

export type RequestIdEnv = { Variables: { requestId: string } };

// Honour an inbound X-Request-Id (trace propagation from gateway/client), otherwise
// mint one. Stored on context for logs + error envelope; echoed on every response.
export const requestIdMw = createMiddleware<RequestIdEnv>(async (c, next) => {
  const id = c.req.header('x-request-id') || crypto.randomUUID();
  c.set('requestId', id);
  c.header('X-Request-Id', id);
  await next();
});
