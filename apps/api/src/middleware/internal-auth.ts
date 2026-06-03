import { createMiddleware } from 'hono/factory';
import { UnauthenticatedError } from '@avkash/shared';

// Guard for the cron-triggered /internal endpoints (accrual, rollover, grace sweep).
// A scheduler must present X-Internal-Token matching INTERNAL_API_TOKEN. If the token
// is unset we fail closed in production (misconfiguration must not open the door) but
// allow it in lower environments for local dev convenience.
export const requireInternalToken = createMiddleware(async (c, next) => {
  const expected = process.env.INTERNAL_API_TOKEN;
  if (!expected) {
    if (process.env.NODE_ENV === 'production') throw new UnauthenticatedError('INTERNAL_AUTH');
    return next();
  }
  if (c.req.header('x-internal-token') !== expected) throw new UnauthenticatedError('INTERNAL_AUTH');
  return next();
});
