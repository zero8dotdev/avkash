import { Hono } from 'hono';
import { serialize } from '@avkash/shared';
import { getMe } from '@avkash/users';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { userDto } from '../dto';

// Session context for the client after login: the user (DTO), org summary, and team.
export const me = new Hono<AppEnv>().use(requireAuth).get('/', async (c) => {
  const { user, org, team } = await getMe(c.get('auth'));
  return c.json({ data: { user: serialize(userDto, user), org, team } });
});
