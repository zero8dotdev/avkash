import { Hono } from 'hono';
import { z } from 'zod';
import { balanceSummary, utilization } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateQuery } from '../middleware/validate';

const balanceReportQuerySchema = z.object({ teamId: z.string().optional() });
const utilizationQuerySchema = z.object({
  teamId: z.string().optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const reports = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/leave-balance', validateQuery(balanceReportQuerySchema), async (c) =>
    c.json({ data: await balanceSummary(c.get('auth'), c.get('query')) })
  )
  .get('/leave-utilization', validateQuery(utilizationQuerySchema), async (c) =>
    c.json({ data: await utilization(c.get('auth'), c.get('query')) })
  );
