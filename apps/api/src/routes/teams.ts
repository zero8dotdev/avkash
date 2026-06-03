import { Hono } from 'hono';
import { z } from 'zod';
import { setTeamEscalation } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const teamEscalationSchema = z.object({
  escalateAfterDays: z.number().int().min(0).max(365).nullable().optional(),
  escalatesTo: z.string().nullable().optional(),
});

export const teams = new Hono<AppEnv>()
  .use(requireAuth)
  // HR: a team's escalation routing — when (escalateAfterDays, 0 = off) and who (escalatesTo).
  .patch('/:id/escalation', validateBody(teamEscalationSchema), async (c) => {
    await setTeamEscalation(c.get('auth'), c.req.param('id'), c.get('body'));
    return c.json({ data: { teamId: c.req.param('id'), ...c.get('body') } });
  });
