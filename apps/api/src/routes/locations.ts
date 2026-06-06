import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import { createLocation, listLocations, getLocation, updateLocation } from '@avkash/org';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { etag, requireIfMatch } from '../concurrency';
import { locationDto } from '../dto';

const TIME = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'expected HH:MM');
const LABOR_REGIME = z.enum(['STANDARD', 'SEZ', 'SHOP_ESTABLISHMENT', 'OTHER']);
const createSchema = z.object({
  name: z.string().min(1).max(255),
  timezone: z.string().min(1).max(64), // IANA, e.g. Asia/Kolkata
  address: z.string().max(500).nullish(),
  latitude: z.string().nullish(),
  longitude: z.string().nullish(),
  geofenceRadiusM: z.number().int().positive().nullish(),
  ipAllowlist: z.array(z.string()).nullish(),
  punchWindowStart: TIME.nullish(),
  punchWindowEnd: TIME.nullish(),
  laborRegime: LABOR_REGIME.optional(),
  overtimeThresholdHours: z.string().regex(/^\d+(\.\d{1,2})?$/).nullish(),
});
const updateSchema = createSchema.partial().extend({ isActive: z.boolean().optional() });

// Locations are org config (timezone, geofence, punch window). Read = MANAGER+, write = ADMIN.
export const locations = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', idempotency, validateBody(createSchema), async (c) =>
    c.json(serialize(locationDto, await createLocation(c.get('auth'), c.get('body'))), 201)
  )
  .get('/', async (c) => c.json({ data: serialize(z.array(locationDto), await listLocations(c.get('auth'))) }))
  .get('/:id', async (c) => {
    const l = await getLocation(c.get('auth'), c.req.param('id'));
    c.header('ETag', etag(l.version));
    return c.json(serialize(locationDto, l));
  })
  .patch('/:id', validateBody(updateSchema), async (c) => {
    const l = await updateLocation(c.get('auth'), c.req.param('id'), c.get('body'), requireIfMatch(c));
    c.header('ETag', etag(l.version));
    return c.json(serialize(locationDto, l));
  });
