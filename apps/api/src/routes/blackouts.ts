import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import { createBlackout, listBlackouts, updateBlackout, deleteBlackout } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { leaveBlackoutDto } from '../dto';

const createSchema = z.object({
  name: z.string().min(1).max(255),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
  leaveTypeId: z.string().min(1).optional().nullable(),
  locationId: z.string().min(1).optional().nullable(),
});
const patchSchema = createSchema.partial();
const listQuery = z.object({ locationId: z.string().min(1).optional() });

export const blackouts = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', validateQuery(listQuery), async (c) =>
    c.json({ data: serialize(leaveBlackoutDto.array(), await listBlackouts(c.get('auth'), c.get('query'))) })
  )
  .post('/', idempotency, validateBody(createSchema), async (c) => {
    const row = await createBlackout(c.get('auth'), c.get('body'));
    return c.json(serialize(leaveBlackoutDto, row), 201);
  })
  .patch('/:id', validateBody(patchSchema), async (c) => {
    const row = await updateBlackout(c.get('auth'), c.req.param('id'), c.get('body'));
    return c.json(serialize(leaveBlackoutDto, row));
  })
  .delete('/:id', async (c) => {
    await deleteBlackout(c.get('auth'), c.req.param('id'));
    return c.body(null, 204);
  });
