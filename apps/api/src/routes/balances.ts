import { Hono } from 'hono';
import { getBalances } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';

// Authz (self, or MANAGER+ for others) lives in getBalances, not here.
export const balances = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/:userId', async (c) => c.json(await getBalances(c.get('auth'), c.req.param('userId'))));
