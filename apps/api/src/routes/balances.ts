import { Hono } from 'hono';
import { getBalances } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';

export const balances = new Hono<AppEnv>().use(requireAuth).get('/:userId', async (c) => {
  const ctx = c.get('auth');
  const userId = c.req.param('userId');
  if (ctx.role === 'USER' && userId !== ctx.userId) return c.json({ error: 'forbidden' }, 403);
  return c.json(await getBalances(ctx, userId));
});
