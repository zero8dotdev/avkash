import { Hono } from 'hono';
import { z } from 'zod';
import { PreconditionRequiredError } from '@avkash/shared';
import {
  createPolicy,
  getPolicy,
  listPolicies,
  updatePolicy,
  publishPolicy,
  unpublishPolicy,
  archivePolicy,
  getPolicyVersionHistory,
  acknowledgePolicy,
  listAcknowledgements,
  pendingAcknowledgements,
} from '@avkash/policy';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { etag } from '../concurrency';

const createSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase alphanumeric and hyphens'),
  body: z.string().optional(),
  effectiveFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish(),
  locationIds: z.array(z.string()).nullish(),
  departmentIds: z.array(z.string()).nullish(),
  levelIds: z.array(z.string()).nullish(),
  requiresAck: z.boolean().optional(),
  ackDeadlineDays: z.number().int().nonnegative().nullish(),
});
const updateSchema = createSchema.omit({ slug: true }).partial().extend({ body: z.string().optional() });
const listQuery = z.object({ status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional() });

export const policies = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', idempotency, validateBody(createSchema), async (c) =>
    c.json({ data: await createPolicy(c.get('auth'), c.get('body')) }, 201)
  )
  .get('/', validateQuery(listQuery), async (c) => c.json({ data: await listPolicies(c.get('auth'), c.get('query')) }))
  // Pending acknowledgements (USER sees their own; ADMIN can pass ?userId=).
  .get('/pending', async (c) => {
    const userId = c.req.query('userId');
    return c.json({ data: await pendingAcknowledgements(c.get('auth'), userId) });
  })
  .get('/:id', async (c) => {
    const p = await getPolicy(c.get('auth'), c.req.param('id'));
    c.header('ETag', etag(p.dbVersion));
    return c.json({ data: p });
  })
  .patch('/:id', validateBody(updateSchema), async (c) => {
    const ifMatch = c.req.header('if-match');
    if (!ifMatch) throw new PreconditionRequiredError('PRECONDITION_REQUIRED');
    const expectedVersion = Number(ifMatch.replace(/"/g, ''));
    return c.json({ data: await updatePolicy(c.get('auth'), c.req.param('id'), c.get('body'), expectedVersion) });
  })
  .post('/:id/publish', async (c) => c.json({ data: await publishPolicy(c.get('auth'), c.req.param('id')) }))
  .post('/:id/unpublish', async (c) => c.json({ data: await unpublishPolicy(c.get('auth'), c.req.param('id')) }))
  .post('/:id/archive', async (c) => c.json({ data: await archivePolicy(c.get('auth'), c.req.param('id')) }))
  .get('/:id/history', async (c) => c.json({ data: await getPolicyVersionHistory(c.get('auth'), c.req.param('id')) }))
  .post('/:id/acknowledge', async (c) => c.json({ data: await acknowledgePolicy(c.get('auth'), c.req.param('id')) }))
  .get('/:id/acknowledgements', async (c) =>
    c.json({ data: await listAcknowledgements(c.get('auth'), c.req.param('id')) })
  );
