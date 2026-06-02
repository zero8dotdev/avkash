import { Hono } from 'hono';
import { z } from 'zod';
import { createLeavePolicy, updateLeavePolicy } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

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
    c.json(await createLeavePolicy(c.get('auth'), c.get('body')), 201)
  )
  .patch('/:id', validateBody(updateLeavePolicySchema), async (c) =>
    c.json(
      await updateLeavePolicy(c.get('auth'), c.req.param('id'), c.get('body'))
    )
  );
