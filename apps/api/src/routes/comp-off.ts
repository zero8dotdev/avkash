import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import { earnCompOff, approveCompOff, rejectCompOff, listCompOff } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { compOffDto } from '../dto';

const earnCompOffSchema = z.object({
  userId: z.string().optional(),
  workedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
  leaveTypeId: z.string().min(1),
  days: z.number().positive().optional(),
});
const compOffQuerySchema = z.object({ userId: z.string().optional() });

export const compOff = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', validateBody(earnCompOffSchema), async (c) =>
    c.json(serialize(compOffDto, await earnCompOff(c.get('auth'), c.get('body'))), 201)
  )
  .get('/', validateQuery(compOffQuerySchema), async (c) =>
    c.json({ data: serialize(z.array(compOffDto), await listCompOff(c.get('auth'), c.get('query').userId)) })
  )
  .post('/:id/approve', async (c) =>
    c.json(serialize(compOffDto, await approveCompOff(c.get('auth'), c.req.param('id'))))
  )
  .post('/:id/reject', async (c) =>
    c.json(serialize(compOffDto, await rejectCompOff(c.get('auth'), c.req.param('id'))))
  );
