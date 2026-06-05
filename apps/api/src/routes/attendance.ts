import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import {
  recordPunch,
  listAttendance,
  teamToday,
  requestRegularization,
  listRegularizations,
  approveRegularization,
  rejectRegularization,
} from '@avkash/attendance';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { punchDto, regularizationDto } from '../dto';

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
const punchBody = z.object({ wfh: z.boolean().optional(), location: z.string().max(255).optional() });
const rangeQuery = z.object({ from: DATE, to: DATE });
const todayQuery = z.object({ teamId: z.string() });
const regBody = z.object({
  date: DATE,
  requestedIn: z.string().datetime().nullish(),
  requestedOut: z.string().datetime().nullish(),
  reason: z.string().min(1).max(500),
});
const decisionBody = z.object({ note: z.string().max(500).optional() });
const regListQuery = z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional() });

// Self check-in/out + resolved daily attendance. /me and /today before /:userId.
export const attendance = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/check-in', validateBody(punchBody), async (c) =>
    c.json(serialize(punchDto, await recordPunch(c.get('auth'), { type: 'IN', ...c.get('body') })), 201)
  )
  .post('/check-out', validateBody(punchBody), async (c) =>
    c.json(serialize(punchDto, await recordPunch(c.get('auth'), { type: 'OUT', ...c.get('body') })), 201)
  )
  .get('/me', validateQuery(rangeQuery), async (c) =>
    c.json({
      data: await listAttendance(c.get('auth'), c.get('auth').userId ?? '', c.get('query').from, c.get('query').to),
    })
  )
  .get('/today', validateQuery(todayQuery), async (c) =>
    c.json({ data: await teamToday(c.get('auth'), c.get('query').teamId) })
  )
  // Regularizations: fix a forgotten/missed punch → manager approval writes the punch.
  .post('/regularizations', idempotency, validateBody(regBody), async (c) =>
    c.json(serialize(regularizationDto, await requestRegularization(c.get('auth'), c.get('body'))), 201)
  )
  .get('/regularizations', validateQuery(regListQuery), async (c) =>
    c.json({
      data: serialize(z.array(regularizationDto), await listRegularizations(c.get('auth'), c.get('query').status)),
    })
  )
  .post('/regularizations/:id/approve', validateBody(decisionBody), async (c) =>
    c.json(
      serialize(regularizationDto, await approveRegularization(c.get('auth'), c.req.param('id'), c.get('body').note))
    )
  )
  .post('/regularizations/:id/reject', validateBody(decisionBody), async (c) =>
    c.json(
      serialize(regularizationDto, await rejectRegularization(c.get('auth'), c.req.param('id'), c.get('body').note))
    )
  )
  .get('/:userId', validateQuery(rangeQuery), async (c) =>
    c.json({ data: await listAttendance(c.get('auth'), c.req.param('userId'), c.get('query').from, c.get('query').to) })
  );
