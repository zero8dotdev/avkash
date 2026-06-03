import { Hono } from 'hono';
import { z } from 'zod';
import { serialize, PreconditionRequiredError } from '@avkash/shared';
import { getLeavePolicy, createLeavePolicy, updateLeavePolicy } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { leavePolicyDto } from '../dto';

// ETag for a policy is just its version, quoted (a strong validator).
const etag = (version: number) => `"${version}"`;

const createLeavePolicySchema = z.object({
  leaveTypeId: z.string().min(1),
  teamId: z.string().min(1),
  maxLeaves: z.number().nonnegative().optional(),
  unlimited: z.boolean().optional(),
  autoApprove: z.boolean().optional(),
  allowNegativeBalance: z.boolean().optional(),
  rollOver: z.boolean().optional(),
  rollOverLimit: z.number().nonnegative().optional(),
  rollOverExpiry: z
    .string()
    .regex(/^\d{2}\/\d{2}$/, 'expected MM/DD')
    .optional(),
  accruals: z.boolean().optional(),
  accrualFrequency: z.enum(['MONTHLY', 'QUARTERLY']).optional(),
  accrueOn: z.enum(['BEGINNING', 'END']).optional(),
  encashable: z.boolean().optional(),
  encashmentMaxDays: z.number().nonnegative().optional(),
  compOffExpiryDays: z.number().nonnegative().optional(),
  prorateOnJoin: z.boolean().optional(),
});

const updateLeavePolicySchema = createLeavePolicySchema
  .omit({ leaveTypeId: true, teamId: true })
  .partial()
  .extend({ isActive: z.boolean().optional() });

export const leavePolicies = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', validateBody(createLeavePolicySchema), async (c) =>
    c.json(serialize(leavePolicyDto, await createLeavePolicy(c.get('auth'), c.get('body'))), 201)
  )
  // GET hands the client the current version as an ETag, which it must echo back as
  // If-Match on the next PATCH.
  .get('/:id', async (c) => {
    const policy = await getLeavePolicy(c.get('auth'), c.req.param('id'));
    c.header('ETag', etag(policy.version));
    return c.json(serialize(leavePolicyDto, policy));
  })
  // PATCH requires If-Match (428 if missing). A stale version → 412 from the domain.
  .patch('/:id', validateBody(updateLeavePolicySchema), async (c) => {
    const ifMatch = c.req.header('if-match');
    if (!ifMatch) throw new PreconditionRequiredError('PRECONDITION_REQUIRED');
    const expectedVersion = Number(ifMatch.replace(/"/g, ''));
    const updated = await updateLeavePolicy(c.get('auth'), c.req.param('id'), c.get('body'), expectedVersion);
    c.header('ETag', etag(updated.version));
    return c.json(serialize(leavePolicyDto, updated));
  });
