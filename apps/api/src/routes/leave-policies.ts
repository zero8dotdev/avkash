import { Hono } from 'hono';
import { z } from 'zod';
import { serialize, PreconditionRequiredError } from '@avkash/shared';
import {
  getLeavePolicy,
  listLeavePolicies,
  createLeavePolicy,
  updateLeavePolicy,
  upsertLevelPolicy,
  listLevelPolicies,
} from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { leavePolicyDto, levelLeavePolicyDto } from '../dto';

// ETag for a policy is just its version, quoted (a strong validator).
const etag = (version: number) => `"${version}"`;

// Probation overlay fields (null = inherit base policy value).
const probationFields = {
  probationMaxLeaves: z.number().int().nonnegative().nullish(),
  probationAccruals: z.boolean().nullish(),
  probationAccrualRate: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .nullish(),
  probationEncashable: z.boolean().nullish(),
};

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
  ...probationFields,
});

const updateLeavePolicySchema = createLeavePolicySchema
  .omit({ leaveTypeId: true, teamId: true })
  .partial()
  .extend({ isActive: z.boolean().optional() });
const listPoliciesQuery = z.object({ teamId: z.string().optional() });

export const leavePolicies = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', validateQuery(listPoliciesQuery), async (c) =>
    c.json({ data: serialize(z.array(leavePolicyDto), await listLeavePolicies(c.get('auth'), c.get('query'))) })
  )
  .post('/', idempotency, validateBody(createLeavePolicySchema), async (c) =>
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

// ── Level-leave-policy overrides ─────────────────────────────────────────────
// Separate router; mounted at /leave-policies/levels in app.ts.
const levelPolicySchema = z.object({
  leaveTypeId: z.string().min(1),
  levelId: z.string().min(1),
  maxLeaves: z.number().nonnegative().nullish(),
  accrualPerMonth: z
    .string()
    .regex(/^\d+(\.\d+)?$/)
    .nullish(),
  rollOverLimit: z.number().nonnegative().nullish(),
  ...probationFields,
});
const levelListQuery = z.object({ leaveTypeId: z.string().min(1).optional() });

export const levelPolicies = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', validateQuery(levelListQuery), async (c) => {
    const q = c.get('query');
    return c.json({
      data: serialize(levelLeavePolicyDto.array(), await listLevelPolicies(c.get('auth'), q.leaveTypeId)),
    });
  })
  .put('/', idempotency, validateBody(levelPolicySchema), async (c) => {
    const row = await upsertLevelPolicy(c.get('auth'), c.get('body'));
    return c.json(serialize(levelLeavePolicyDto, row), 200);
  });
