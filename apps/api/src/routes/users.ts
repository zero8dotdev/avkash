import { Hono } from 'hono';
import { z } from 'zod';
import { validate } from '@avkash/shared';
import { setUserWorkweek, setUserJoinedOn } from '@avkash/users';
import { type AppEnv, requireAuth } from '../middleware/auth';

const workweekSchema = z.object({ workweek: z.array(z.string()).default([]) });
const joinedOnSchema = z.object({
  joinedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD'),
});

export const users = new Hono<AppEnv>()
  .use(requireAuth)
  .patch('/:id/workweek', async (c) => {
    const { workweek } = validate(
      workweekSchema,
      await c.req.json().catch(() => ({}))
    );
    return c.json(
      await setUserWorkweek(c.get('auth'), c.req.param('id'), workweek)
    );
  })
  .patch('/:id/joined-on', async (c) => {
    const { joinedOn } = validate(
      joinedOnSchema,
      await c.req.json().catch(() => ({}))
    );
    return c.json(
      await setUserJoinedOn(c.get('auth'), c.req.param('id'), joinedOn)
    );
  });
