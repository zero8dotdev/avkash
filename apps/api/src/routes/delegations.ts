import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import { setDelegation, clearDelegation, listDelegations } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { delegationDto } from '../dto';

const setDelegationSchema = z.object({
  toUserId: z.string().min(1),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
  endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
  teamId: z.string().optional(),
});

export const delegations = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', validateBody(setDelegationSchema), async (c) =>
    c.json(serialize(delegationDto, await setDelegation(c.get('auth'), c.get('body'))), 201)
  )
  .get('/', async (c) => c.json({ data: serialize(z.array(delegationDto), await listDelegations(c.get('auth'))) }))
  .delete('/:id', async (c) => {
    await clearDelegation(c.get('auth'), c.req.param('id'));
    return c.json({ cleared: true });
  });
