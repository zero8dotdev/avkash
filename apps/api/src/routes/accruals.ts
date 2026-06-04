import { Hono } from 'hono';
import { upcomingAccruals } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';

// HR/Admin visibility into scheduled leave credits. `upcomingAccruals` gates to
// ADMIN+ and computes each policy's next credit date with the same timing the cron
// uses — the data behind a "next leave balance credit" dashboard tile.
export const accruals = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/upcoming', async (c) => c.json({ data: await upcomingAccruals(c.get('auth')) }));
