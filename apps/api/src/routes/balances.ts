import { Hono } from 'hono';
import { z } from 'zod';
import { getBalances, adjustBalance, setOpeningBalance } from '@avkash/leave';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

// Authz (self / MANAGER+ for reads, ADMIN for writes) lives in the domain, not here.
// LeaveBalance is already a computed DTO — no DB-row projection needed.
const adjustSchema = z.object({
  leaveTypeId: z.string().min(1),
  amount: z.number(),
  note: z.string().min(1).max(255),
});
const openingSchema = z.object({
  leaveTypeId: z.string().min(1),
  amount: z.number(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  note: z.string().max(255).optional(),
});

export const balances = new Hono<AppEnv>()
  .use(requireAuth)
  .get('/:userId', async (c) => c.json({ data: await getBalances(c.get('auth'), c.req.param('userId')) }))
  // HR: signed correction/grant (+/−).
  .post('/:userId/adjust', validateBody(adjustSchema), async (c) =>
    c.json({ data: await adjustBalance(c.get('auth'), { userId: c.req.param('userId'), ...c.get('body') }) }, 201)
  )
  // HR: seed an initial (opening) balance for an onboarded employee.
  .post('/:userId/opening', validateBody(openingSchema), async (c) =>
    c.json({ data: await setOpeningBalance(c.get('auth'), { userId: c.req.param('userId'), ...c.get('body') }) }, 201)
  );
