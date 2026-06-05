import { Hono } from 'hono';
import { z } from 'zod';
import { ingestPunch } from '@avkash/attendance';
import { requireDevice, type DeviceEnv } from '../middleware/device-auth';
import { validateBody } from '../middleware/validate';

// Device-authed punch ingest (NOT user-session auth). Mounted under /attendance so the
// path is /attendance/punch; the user attendance router owns the other /attendance/*.
const punchSchema = z.object({
  externalId: z.string().min(1),
  ts: z.string().datetime().optional(), // device clock; defaults to now
  direction: z.enum(['IN', 'OUT']).optional(), // omit → inferred by toggle
});

export const deviceIngest = new Hono<DeviceEnv>()
  .use(requireDevice)
  .post('/punch', validateBody(punchSchema), async (c) => {
    const body = c.get('body');
    const result = await ingestPunch(c.get('device'), {
      externalId: body.externalId,
      ts: body.ts ?? new Date().toISOString(),
      direction: body.direction,
    });
    return c.json(result, result.duplicate ? 200 : 201);
  });
