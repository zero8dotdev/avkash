import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import {
  initiateTransfer,
  approveTransfer,
  cancelTransfer,
  listTransfers,
  getTransfer,
} from '@avkash/users';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { transferDto } from '../dto';
import { syncOrgTuples } from '@avkash/authz-sync';

const createSchema = z.object({
  userId: z.string().min(1),
  fromLocationId: z.string().min(1),
  toLocationId: z.string().min(1),
  fromDepartmentId: z.string().min(1).optional().nullable(),
  toDepartmentId: z.string().min(1).optional().nullable(),
  type: z.enum(['TEMPORARY', 'PERMANENT']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  letterUrl: z.string().max(2048).optional().nullable(),
});

const listQuery = z.object({ userId: z.string().min(1).optional() });

export const transfers = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', validateQuery(listQuery), async (c) => {
    const q = c.get('query');
    return c.json({ data: serialize(transferDto.array(), await listTransfers(c.get('auth'), q.userId)) });
  })
  .post('/', idempotency, validateBody(createSchema), async (c) => {
    const row = await initiateTransfer(c.get('auth'), c.get('body'));
    return c.json(serialize(transferDto, row), 201);
  })
  .get('/:id', async (c) => {
    const row = await getTransfer(c.get('auth'), c.req.param('id'));
    return c.json(serialize(transferDto, row));
  })
  .post('/:id/approve', async (c) => {
    const ctx = c.get('auth');
    const row = await approveTransfer(ctx, c.req.param('id'));
    // Fast-lane revoke: attempt a synchronous FGA sync so the transferred employee's
    // old team manager loses visibility immediately.
    // The outbox event (emitted by approveTransfer) is the reliability guarantee;
    // this is best-effort only — failure is logged but does not fail the request.
    try {
      await syncOrgTuples(ctx.orgId);
    } catch (err) {
      console.error(
        '[authz-sync] fast-lane syncOrgTuples after transfer approve failed:',
        err instanceof Error ? err.message : err
      );
    }
    return c.json(serialize(transferDto, row));
  })
  .post('/:id/cancel', async (c) => {
    await cancelTransfer(c.get('auth'), c.req.param('id'));
    return c.body(null, 204);
  });
