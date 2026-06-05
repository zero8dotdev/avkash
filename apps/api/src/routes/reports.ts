import { Hono } from 'hono';
import { z } from 'zod';
import { balanceSummary, utilization } from '@avkash/leave';
import { muster } from '@avkash/attendance';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateQuery } from '../middleware/validate';

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
const balanceReportQuerySchema = z.object({ teamId: z.string().optional() });
const utilizationQuerySchema = z.object({
  teamId: z.string().optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});
const musterQuerySchema = z.object({ teamId: z.string().min(1), from: DATE, to: DATE });

export const reports = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/leave-balance', validateQuery(balanceReportQuerySchema), async (c) =>
    c.json({ data: await balanceSummary(c.get('auth'), c.get('query')) })
  )
  .get('/leave-utilization', validateQuery(utilizationQuerySchema), async (c) =>
    c.json({ data: await utilization(c.get('auth'), c.get('query')) })
  )
  // Attendance muster: each member's resolved day grid + summary (MANAGER+).
  .get('/muster', validateQuery(musterQuerySchema), async (c) => {
    const q = c.get('query');
    return c.json({ data: await muster(c.get('auth'), q.teamId, q.from, q.to) });
  });
