import { Hono } from 'hono';
import { z } from 'zod';
import { serialize } from '@avkash/shared';
import {
  createDevice,
  listDevices,
  getDevice,
  updateDevice,
  rotateDeviceSecret,
  enrollDevice,
  listEnrollments,
  removeEnrollment,
} from '@avkash/attendance';
import { type AppEnv, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { idempotency } from '../middleware/idempotency';
import { etag, requireIfMatch } from '../concurrency';
import { deviceDto, enrollmentDto } from '../dto';

const KIND = z.enum(['BIOMETRIC', 'RFID', 'FACE', 'KIOSK', 'MOBILE']);
const createDeviceSchema = z.object({
  locationId: z.string().min(1),
  name: z.string().min(1).max(255),
  kind: KIND.optional(),
  serial: z.string().max(255).optional(),
});
const updateDeviceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  kind: KIND.optional(),
  serial: z.string().max(255).nullable().optional(),
  locationId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});
const enrollSchema = z.object({
  userId: z.string().min(1),
  externalId: z.string().min(1).max(255),
  label: z.string().max(255).optional(),
});

// Device + enrollment management (HR). Read = MANAGER+, mutations = ADMIN. The device
// secret is returned ONCE on create/rotate and never again. /enrollments routes are
// declared before /:id so the static path wins.
export const devices = new Hono<AppEnv>()
  .use(requireAuth)
  .post('/', idempotency, validateBody(createDeviceSchema), async (c) => {
    const { device, secret } = await createDevice(c.get('auth'), c.get('body'));
    return c.json({ ...serialize(deviceDto, device), secret }, 201);
  })
  .get('/', async (c) => c.json({ data: serialize(z.array(deviceDto), await listDevices(c.get('auth'))) }))
  .post('/enrollments', idempotency, validateBody(enrollSchema), async (c) =>
    c.json(serialize(enrollmentDto, await enrollDevice(c.get('auth'), c.get('body'))), 201)
  )
  .get('/enrollments', async (c) =>
    c.json({ data: serialize(z.array(enrollmentDto), await listEnrollments(c.get('auth'))) })
  )
  .delete('/enrollments/:id', async (c) => {
    await removeEnrollment(c.get('auth'), c.req.param('id'));
    return c.json({ deleted: true });
  })
  .get('/:id', async (c) => {
    const d = await getDevice(c.get('auth'), c.req.param('id'));
    c.header('ETag', etag(d.version));
    return c.json(serialize(deviceDto, d));
  })
  .patch('/:id', validateBody(updateDeviceSchema), async (c) => {
    const d = await updateDevice(c.get('auth'), c.req.param('id'), c.get('body'), requireIfMatch(c));
    c.header('ETag', etag(d.version));
    return c.json(serialize(deviceDto, d));
  })
  .post('/:id/rotate-secret', async (c) => c.json(await rotateDeviceSecret(c.get('auth'), c.req.param('id'))));
