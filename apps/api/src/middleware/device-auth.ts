import { createMiddleware } from 'hono/factory';
import { authenticateDevice, type DeviceContext } from '@avkash/attendance';
import { UnauthenticatedError } from '@avkash/shared';

export type DeviceEnv = { Variables: { device: DeviceContext } };

// Per-device auth for the punch-ingest endpoint — the machine twin of
// requireInternalToken, but revocable per device. The device presents X-Device-Id +
// X-Device-Secret; the domain sha256s the secret and constant-time compares it to the
// stored hash. Unknown / inactive / bad-secret all fail closed.
export const requireDevice = createMiddleware<DeviceEnv>(async (c, next) => {
  const id = c.req.header('x-device-id');
  const secret = c.req.header('x-device-secret');
  if (!id || !secret) throw new UnauthenticatedError('DEVICE_AUTH');

  const device = await authenticateDevice(id, secret);
  if (!device) throw new UnauthenticatedError('DEVICE_AUTH');

  c.set('device', device);
  await next();
});
