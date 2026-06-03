import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import { createLeaveType, listLeaveTypes, updateLeaveType } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { leaveTypeDto } from '../dto';

const createLeaveTypeSchema = z.object({
  name: z.string().min(1).max(80),
  color: z.string().optional(),
  kind: z.enum(['LEAVE', 'COMP_OFF']).optional(),
  isPaid: z.boolean().optional(),
  emoji: z.string().optional(),
  statusMsg: z.string().optional(),
});
const updateLeaveTypeSchema = createLeaveTypeSchema.partial().extend({ isActive: z.boolean().optional() });

export const leaveTypes = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', async (c) =>
    c.json({
      data: serialize(
        z.array(leaveTypeDto),
        await listLeaveTypes(c.get('auth'), { activeOnly: c.req.query('active') === 'true' })
      ),
    })
  )
  .post('/', idempotency, validateBody(createLeaveTypeSchema), async (c) =>
    c.json(serialize(leaveTypeDto, await createLeaveType(c.get('auth'), c.get('body'))), 201)
  )
  .patch('/:id', validateBody(updateLeaveTypeSchema), async (c) =>
    c.json(serialize(leaveTypeDto, await updateLeaveType(c.get('auth'), c.req.param('id'), c.get('body'))))
  );
