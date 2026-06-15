import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import { setUserWorkweek, setUserJoinedOn, listUsers, getUser, updateUserAdmin } from '@avkash/users';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { etag, requireIfMatch } from '../concurrency';
import { userDto } from '../dto';

const workweekSchema = z.object({ workweek: z.array(z.string()).default([]) });
const joinedOnSchema = z.object({ joinedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD') });
const listUsersQuery = z.object({ teamId: z.string().optional() });
const updateUserSchema = z.object({
  role: z.enum(['ADMIN', 'MANAGER', 'USER']).optional(),
  teamId: z.string().nullable().optional(),
  locationId: z.string().nullable().optional(),
});

export const users = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/', validateQuery(listUsersQuery), async (c) =>
    c.json({ data: serialize(z.array(userDto), await listUsers(c.get('auth'), c.get('query'))) })
  )
  .get('/:id', async (c) => {
    const u = await getUser(c.get('auth'), c.req.param('id'));
    c.header('ETag', etag(u.version));
    return c.json(serialize(userDto, u));
  })
  // HR: change a person's role/team (If-Match required).
  .patch('/:id', validateBody(updateUserSchema), async (c) => {
    const u = await updateUserAdmin(c.get('auth'), c.req.param('id'), c.get('body'), requireIfMatch(c));
    c.header('ETag', etag(u.version));
    return c.json(serialize(userDto, u));
  })
  .patch('/:id/workweek', validateBody(workweekSchema), async (c) =>
    c.json(serialize(userDto, await setUserWorkweek(c.get('auth'), c.req.param('id'), c.get('body').workweek)))
  )
  .patch('/:id/joined-on', validateBody(joinedOnSchema), async (c) =>
    c.json(serialize(userDto, await setUserJoinedOn(c.get('auth'), c.req.param('id'), c.get('body').joinedOn)))
  );
