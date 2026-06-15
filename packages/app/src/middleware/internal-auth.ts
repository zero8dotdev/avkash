import { createMiddleware } from 'hono/factory';
import { UnauthenticatedError } from '@avkash/shared';

// Guard for cron-triggered /internal endpoints. The scheduler must present
// X-Internal-Token matching INTERNAL_API_TOKEN. Fails closed in production when
// the token is unset; permits passthrough in lower environments for local dev.
export const requireInternalToken = createMiddleware(async (c, next) => {
  const expected = process.env.INTERNAL_API_TOKEN;
  if (!expected) {
    if (process.env.NODE_ENV === 'production') throw new UnauthenticatedError('INTERNAL_AUTH');
    return next();
  }
  if (c.req.header('x-internal-token') !== expected) throw new UnauthenticatedError('INTERNAL_AUTH');
  return next();
});
