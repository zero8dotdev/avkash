import { Hono } from 'hono';
import { z } from 'zod';
import { validate } from '@avkash/shared';
import {
  earnCompOff,
  approveCompOff,
  rejectCompOff,
  listCompOff,
} from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';

const earnCompOffSchema = z.object({
  userId: z.string().optional(),
  workedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
  leaveTypeId: z.string().min(1),
  days: z.number().positive().optional(),
});

export const compOff = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', async (c) => {
    const body = validate(
      earnCompOffSchema,
      await c.req.json().catch(() => ({}))
    );
    return c.json(await earnCompOff(c.get('auth'), body), 201);
  })
  .get('/', async (c) =>
    c.json(await listCompOff(c.get('auth'), c.req.query('userId')))
  )
  .post('/:id/approve', async (c) =>
    c.json(await approveCompOff(c.get('auth'), c.req.param('id')))
  )
  .post('/:id/reject', async (c) =>
    c.json(await rejectCompOff(c.get('auth'), c.req.param('id')))
  );
