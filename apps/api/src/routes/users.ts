import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import { setUserWorkweek, setUserJoinedOn } from '@avkash/users';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { userDto } from '../dto';

const workweekSchema = z.object({ workweek: z.array(z.string()).default([]) });
const joinedOnSchema = z.object({ joinedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD') });

export const users = new Hono<AppEnv>()
  .use(requireAuth)
  .patch('/:id/workweek', validateBody(workweekSchema), async (c) =>
    c.json(serialize(userDto, await setUserWorkweek(c.get('auth'), c.req.param('id'), c.get('body').workweek)))
  )
  .patch('/:id/joined-on', validateBody(joinedOnSchema), async (c) =>
    c.json(serialize(userDto, await setUserJoinedOn(c.get('auth'), c.req.param('id'), c.get('body').joinedOn)))
  );
