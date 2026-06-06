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
  listSourcePolicies,
  upsertSourcePolicy,
  confirmPunches,
  listPendingConfirmations,
} from '@avkash/attendance';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { punchDto, regularizationDto } from '../dto';

const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');
// Plan 46: remote context for factory visits, client sites, and field work.
const remoteContextSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('WFH') }),
  z.object({ type: z.literal('FACTORY_VISIT'), locationId: z.string().uuid() }),
  z.object({ type: z.literal('CLIENT_SITE'), clientName: z.string(), city: z.string().optional(), country: z.string().optional() }),
  z.object({ type: z.literal('FIELD'), city: z.string().optional(), country: z.string().optional() }),
]);
const punchBody = z.object({
  wfh: z.boolean().optional(),
  location: z.string().max(255).optional(),
  remoteContext: remoteContextSchema.optional(),
});
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
  )
  // Plan 31: source policy management (ADMIN).
  // Plan 40: manager confirms or rejects FIELD employees' pending WEB punches.
  .post(
    '/confirm',
    validateBody(
      z.object({
        punchIds: z.array(z.string().min(1)).min(1).max(100),
        action: z.enum(['CONFIRM', 'REJECT']),
      })
    ),
    async (c) => {
      const { punchIds, action } = c.get('body');
      const result = await confirmPunches(c.get('auth'), punchIds, action);
      return c.json(result);
    }
  )
  .get('/pending-confirmation', validateQuery(z.object({ teamId: z.string().min(1) })), async (c) =>
    c.json({ data: await listPendingConfirmations(c.get('auth'), c.get('query').teamId) })
  )
  .get('/source-policy', async (c) => c.json({ data: await listSourcePolicies(c.get('auth')) }))
  .put(
    '/source-policy/:levelId',
    validateBody(
      z.object({ allowedSources: z.array(z.enum(['WEB', 'SLACK', 'DEVICE', 'REGULARIZATION'])).min(1) })
    ),
    async (c) => {
      const levelId = c.req.param('levelId');
      await upsertSourcePolicy(c.get('auth'), levelId, c.get('body').allowedSources);
      return c.json({ updated: true });
    }
  );
