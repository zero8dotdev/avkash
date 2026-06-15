import { Hono } from 'hono';
import { z } from 'zod';
import { assignShiftSupervisor, removeShiftSupervisor, listShiftSupervisors } from '@avkash/attendance';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';

const assignSchema = z.object({
  userId: z.string().min(1),
  shiftId: z.string().min(1),
  locationId: z.string().min(1),
  departmentId: z.string().nullish(),
});
const listQuery = z.object({
  shiftId: z.string().optional(),
  locationId: z.string().optional(),
});

export const shiftSupervisors = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', validateBody(assignSchema), async (c) => {
    const row = await assignShiftSupervisor(c.get('auth'), c.get('body'));
    return c.json({ data: row }, 201);
  })
  .get('/', validateQuery(listQuery), async (c) => {
    const q = c.get('query');
    const rows = await listShiftSupervisors(c.get('auth'), q);
    return c.json({ data: rows });
  })
  .delete('/:id', async (c) => {
    await removeShiftSupervisor(c.get('auth'), c.req.param('id'));
    return c.json({ deleted: true });
  });
