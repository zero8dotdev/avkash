import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import { createTeam, listTeams, getTeam, updateTeam } from '@avkash/users';
import { setTeamEscalation } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { etag, requireIfMatch } from '../concurrency';
import { teamDto } from '../dto';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
const createTeamSchema = z.object({
  name: z.string().min(1).max(255),
  managers: z.array(z.string()).optional(),
  location: z.string().max(255).optional(),
  workweek: z.array(z.enum(DAYS)).optional(),
  departmentId: z.string().nullable().optional(),
});
const updateTeamSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  managers: z.array(z.string()).optional(),
  location: z.string().max(255).nullable().optional(),
  locationId: z.string().nullable().optional(),
  workweek: z.array(z.enum(DAYS)).optional(),
  isActive: z.boolean().optional(),
  departmentId: z.string().nullable().optional(),
});
const teamEscalationSchema = z.object({
  escalateAfterDays: z.number().int().min(0).max(365).nullable().optional(),
  escalatesTo: z.string().nullable().optional(),
});

export const teams = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', async (c) => c.json({ data: serialize(z.array(teamDto), await listTeams(c.get('auth'))) }))
  .post('/', idempotency, validateBody(createTeamSchema), async (c) =>
    c.json(serialize(teamDto, await createTeam(c.get('auth'), c.get('body'))), 201)
  )
  .get('/:id', async (c) => {
    const t = await getTeam(c.get('auth'), c.req.param('id'));
    c.header('ETag', etag(t.version));
    return c.json(serialize(teamDto, t));
  })
  .patch('/:id', validateBody(updateTeamSchema), async (c) => {
    const t = await updateTeam(c.get('auth'), c.req.param('id'), c.get('body'), requireIfMatch(c));
    c.header('ETag', etag(t.version));
    return c.json(serialize(teamDto, t));
  })
  // HR: a team's escalation routing — when (escalateAfterDays, 0 = off) and who (escalatesTo).
  .patch('/:id/escalation', validateBody(teamEscalationSchema), async (c) => {
    await setTeamEscalation(c.get('auth'), c.req.param('id'), c.get('body'));
    return c.json({ data: { teamId: c.req.param('id'), ...c.get('body') } });
  });
