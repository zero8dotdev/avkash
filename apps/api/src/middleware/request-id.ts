import { createMiddleware } from 'hono/factory';

export type RequestIdEnv = { Variables: { requestId: string } };

// Correlation id for the whole request. Honour an inbound X-Request-Id (so a trace
// from a gateway/client propagates), otherwise mint one. Stored on the context for
// logs + the error envelope, and echoed on every response header.
export const requestIdMw = createMiddleware<RequestIdEnv>(async (c, next) => {
  const id = c.req.header('x-request-id') || crypto.randomUUID();
  c.set('requestId', id);
  c.header('X-Request-Id', id);
  await next();
});
