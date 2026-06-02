import { Hono } from 'hono';
import { z } from 'zod';
import { requestEncashment, approveEncashment, markEncashmentPaid, rejectEncashment } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const requestEncashmentSchema = z.object({
  leaveTypeId: z.string().min(1),
  days: z.number().positive(),
  userId: z.string().optional(),
});

export const encashments = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', validateBody(requestEncashmentSchema), async (c) =>
    c.json(await requestEncashment(c.get('auth'), c.get('body')), 201)
  )
  .post('/:id/approve', async (c) => c.json(await approveEncashment(c.get('auth'), c.req.param('id'))))
  .post('/:id/pay', async (c) => c.json(await markEncashmentPaid(c.get('auth'), c.req.param('id'))))
  .post('/:id/reject', async (c) => c.json(await rejectEncashment(c.get('auth'), c.req.param('id'))));
