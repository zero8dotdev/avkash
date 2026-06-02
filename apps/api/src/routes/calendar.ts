import { Hono } from 'hono';
import { getCalendar } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';

export const calendar = new Hono<AppEnv>().use(requireAuth).get('/', async (c) => {
  const from = c.req.query('from');
  const to = c.req.query('to');
  if (!from || !to) return c.json({ error: 'from and to are required (YYYY-MM-DD)' }, 400);
  const scope = c.req.query('scope') === 'org' ? 'org' : 'team';
  return c.json(await getCalendar(c.get('auth'), { scope, from, to }));
});
