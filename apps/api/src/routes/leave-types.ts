import { Hono } from 'hono';
import { z } from 'zod';
import { validate } from '@avkash/shared';
import {
  createLeaveType,
  listLeaveTypes,
  updateLeaveType,
} from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';

const createLeaveTypeSchema = z.object({
  name: z.string().min(1).max(80),
  color: z.string().optional(),
  kind: z.enum(['LEAVE', 'COMP_OFF']).optional(),
  isPaid: z.boolean().optional(),
  emoji: z.string().optional(),
  statusMsg: z.string().optional(),
});
const updateLeaveTypeSchema = createLeaveTypeSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

export const leaveTypes = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', async (c) =>
    c.json(
      await listLeaveTypes(c.get('auth'), {
        activeOnly: c.req.query('active') === 'true',
      })
    )
  )
  .post('/', async (c) => {
    const body = validate(
      createLeaveTypeSchema,
      await c.req.json().catch(() => ({}))
    );
    return c.json(await createLeaveType(c.get('auth'), body), 201);
  })
  .patch('/:id', async (c) => {
    const body = validate(
      updateLeaveTypeSchema,
      await c.req.json().catch(() => ({}))
    );
    return c.json(
      await updateLeaveType(c.get('auth'), c.req.param('id'), body)
    );
  });
