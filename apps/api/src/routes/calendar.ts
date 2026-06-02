import { Hono } from 'hono';
import { z } from 'zod';
import { getCalendar } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateQuery } from '../middleware/validate';

const calendarQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
  scope: z.enum(['team', 'org']).default('team'),
});

export const calendar = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', validateQuery(calendarQuerySchema), async (c) => c.json(await getCalendar(c.get('auth'), c.get('query'))));
