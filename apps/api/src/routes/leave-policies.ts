import { Hono } from 'hono';
import { z } from 'zod';
import { validate } from '@avkash/shared';
import { createLeavePolicy, updateLeavePolicy } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';

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
  .post('/', async (c) => {
    const body = validate(
      createLeavePolicySchema,
      await c.req.json().catch(() => ({}))
    );
    return c.json(await createLeavePolicy(c.get('auth'), body), 201);
  })
  .patch('/:id', async (c) => {
    const body = validate(
      updateLeavePolicySchema,
      await c.req.json().catch(() => ({}))
    );
    return c.json(
      await updateLeavePolicy(c.get('auth'), c.req.param('id'), body)
    );
  });
