import { Hono } from 'hono';
import { z } from 'zod';
import { validate } from '@avkash/shared';
import { setDelegation, clearDelegation, listDelegations } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';

const setDelegationSchema = z.object({
  toUserId: z.string().min(1),
  startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
  endsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
  teamId: z.string().optional(),
});

export const delegations = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', async (c) => {
    const body = validate(
      setDelegationSchema,
      await c.req.json().catch(() => ({}))
    );
    return c.json(await setDelegation(c.get('auth'), body), 201);
  })
  .get('/', async (c) => c.json(await listDelegations(c.get('auth'))))
  .delete('/:id', async (c) => {
    await clearDelegation(c.get('auth'), c.req.param('id'));
    return c.json({ cleared: true });
  });
