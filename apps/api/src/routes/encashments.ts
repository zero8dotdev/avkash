import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import { requestEncashment, approveEncashment, markEncashmentPaid, rejectEncashment } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { encashmentDto } from '../dto';

const requestEncashmentSchema = z.object({
  leaveTypeId: z.string().min(1),
  days: z.number().positive(),
  userId: z.string().optional(),
});

export const encashments = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', idempotency, validateBody(requestEncashmentSchema), async (c) =>
    c.json(serialize(encashmentDto, await requestEncashment(c.get('auth'), c.get('body'))), 201)
  )
  .post('/:id/approve', async (c) =>
    c.json(serialize(encashmentDto, await approveEncashment(c.get('auth'), c.req.param('id'))))
  )
  .post('/:id/pay', async (c) =>
    c.json(serialize(encashmentDto, await markEncashmentPaid(c.get('auth'), c.req.param('id'))))
  )
  .post('/:id/reject', async (c) =>
    c.json(serialize(encashmentDto, await rejectEncashment(c.get('auth'), c.req.param('id'))))
  );
