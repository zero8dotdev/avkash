import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { and, desc, eq, lte, sql } from 'drizzle-orm';
import { db, schema, type Device, type DeviceEnrollment } from '@avkash/db';
import { type AuthContext, NotFoundError, PreconditionFailedError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { inWindow, localTimeHHMM } from './window';

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const newSecret = () => randomBytes(24).toString('hex'); // 48 hex chars

type DeviceKind = 'BIOMETRIC' | 'RFID' | 'FACE' | 'KIOSK' | 'MOBILE';

// The context a device gets after `requireDevice` authenticates it.
export interface DeviceContext {
  deviceId: string;
  orgId: string;
  locationId: string;
}

// ── Device CRUD (ADMIN) ──────────────────────────────────────────────────────
export interface CreateDeviceInput {
  locationId: string;
  name: string;
  kind?: DeviceKind;
  serial?: string;
}

// Returns the raw secret ONCE — only its sha256 is stored. The caller surfaces it
// to the operator a single time (the API-key pattern).
export async function createDevice(
  ctx: AuthContext,
  input: CreateDeviceInput
): Promise<{ device: Device; secret: string }> {
  requireRole(ctx, 'ADMIN');
  const [loc] = await db
    .select({ id: schema.location.id })
    .from(schema.location)
    .where(and(eq(schema.location.id, input.locationId), eq(schema.location.orgId, ctx.orgId)))
    .limit(1);
  if (!loc) throw new NotFoundError('LOCATION_NOT_FOUND');
  const secret = newSecret();
  const [device] = await db
    .insert(schema.device)
    .values({
      orgId: ctx.orgId,
      locationId: input.locationId,
      name: input.name,
      kind: input.kind ?? 'BIOMETRIC',
      serial: input.serial ?? null,
      secretHash: sha256(secret),
      createdBy: ctx.userId,
    })
    .returning();
  return { device, secret };
}

export async function listDevices(ctx: AuthContext): Promise<Device[]> {
  requireRole(ctx, 'MANAGER');
  return db.select().from(schema.device).where(eq(schema.device.orgId, ctx.orgId));
}

export async function getDevice(ctx: AuthContext, id: string): Promise<Device> {
  const [d] = await db
    .select()
    .from(schema.device)
    .where(and(eq(schema.device.id, id), eq(schema.device.orgId, ctx.orgId)))
    .limit(1);
  if (!d) throw new NotFoundError('DEVICE_NOT_FOUND');
  return d;
}

export interface UpdateDeviceInput {
  name?: string;
  kind?: DeviceKind;
  serial?: string | null;
  locationId?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export async function updateDevice(
  ctx: AuthContext,
  id: string,
  patch: UpdateDeviceInput,
  expectedVersion?: number
): Promise<Device> {
  requireRole(ctx, 'ADMIN');
  const conds = [eq(schema.device.id, id), eq(schema.device.orgId, ctx.orgId)];
  if (expectedVersion !== undefined) conds.push(eq(schema.device.version, expectedVersion));
  const [row] = await db
    .update(schema.device)
    .set({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.kind !== undefined && { kind: patch.kind }),
      ...(patch.serial !== undefined && { serial: patch.serial }),
      ...(patch.locationId !== undefined && { locationId: patch.locationId }),
      ...(patch.status !== undefined && { status: patch.status }),
      version: sql`${schema.device.version} + 1`,
      updatedBy: ctx.userId,
      updatedAt: new Date(),
    })
    .where(and(...conds))
    .returning();
  if (!row) {
    if (expectedVersion !== undefined) {
      const [cur] = await db
        .select({ version: schema.device.version })
        .from(schema.device)
        .where(and(eq(schema.device.id, id), eq(schema.device.orgId, ctx.orgId)))
        .limit(1);
      if (cur)
        throw new PreconditionFailedError('VERSION_CONFLICT', { expected: expectedVersion, current: cur.version });
    }
    throw new NotFoundError('DEVICE_NOT_FOUND');
  }
  return row;
}

// Rotate a device's secret (revoke + reissue). Returns the new secret once.
export async function rotateDeviceSecret(ctx: AuthContext, id: string): Promise<{ secret: string }> {
  requireRole(ctx, 'ADMIN');
  const secret = newSecret();
  const [row] = await db
    .update(schema.device)
    .set({ secretHash: sha256(secret), updatedBy: ctx.userId, updatedAt: new Date() })
    .where(and(eq(schema.device.id, id), eq(schema.device.orgId, ctx.orgId)))
    .returning({ id: schema.device.id });
  if (!row) throw new NotFoundError('DEVICE_NOT_FOUND');
  return { secret };
}

// Authenticate a device by id + secret (the middleware calls this — keeps DB access
// in the domain). Constant-time compare; unknown/inactive/bad-id → null (fail closed).
export async function authenticateDevice(deviceId: string, secret: string): Promise<DeviceContext | null> {
  let d:
    | { id: string; orgId: string; locationId: string; secretHash: string; status: 'ACTIVE' | 'INACTIVE' }
    | undefined;
  try {
    [d] = await db
      .select({
        id: schema.device.id,
        orgId: schema.device.orgId,
        locationId: schema.device.locationId,
        secretHash: schema.device.secretHash,
        status: schema.device.status,
      })
      .from(schema.device)
      .where(eq(schema.device.id, deviceId))
      .limit(1);
  } catch {
    return null; // malformed device id (not a uuid)
  }
  if (!d || d.status !== 'ACTIVE') return null;
  const presented = Buffer.from(sha256(secret), 'hex');
  const stored = Buffer.from(d.secretHash, 'hex');
  if (presented.length !== stored.length || !timingSafeEqual(presented, stored)) return null;
  return { deviceId: d.id, orgId: d.orgId, locationId: d.locationId };
}

// ── Enrollment (ADMIN) — per-org identity map ────────────────────────────────
export interface EnrollInput {
  userId: string;
  externalId: string;
  label?: string;
}

export async function enrollDevice(ctx: AuthContext, input: EnrollInput): Promise<DeviceEnrollment> {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .insert(schema.deviceEnrollment)
    .values({
      orgId: ctx.orgId,
      userId: input.userId,
      externalId: input.externalId,
      label: input.label ?? null,
      createdBy: ctx.userId,
    })
    .returning();
  return row;
}

export async function listEnrollments(ctx: AuthContext): Promise<DeviceEnrollment[]> {
  requireRole(ctx, 'MANAGER');
  return db.select().from(schema.deviceEnrollment).where(eq(schema.deviceEnrollment.orgId, ctx.orgId));
}

export async function removeEnrollment(ctx: AuthContext, id: string): Promise<void> {
  requireRole(ctx, 'ADMIN');
  const deleted = await db
    .delete(schema.deviceEnrollment)
    .where(and(eq(schema.deviceEnrollment.id, id), eq(schema.deviceEnrollment.orgId, ctx.orgId)))
    .returning({ id: schema.deviceEnrollment.id });
  if (!deleted.length) throw new NotFoundError('ENROLLMENT_NOT_FOUND');
}

// ── Ingest (device-authed) ───────────────────────────────────────────────────
export interface IngestPunchInput {
  externalId: string;
  ts: string; // ISO; device clock (offline batches send the original time)
  direction?: 'IN' | 'OUT';
}

export interface IngestResult {
  id: string | null;
  type: 'IN' | 'OUT';
  flagged: boolean;
  duplicate: boolean;
}

export async function ingestPunch(device: DeviceContext, input: IngestPunchInput): Promise<IngestResult> {
  // 1. externalId → userId (per-org identity map).
  const [enr] = await db
    .select({ userId: schema.deviceEnrollment.userId })
    .from(schema.deviceEnrollment)
    .where(
      and(eq(schema.deviceEnrollment.orgId, device.orgId), eq(schema.deviceEnrollment.externalId, input.externalId))
    )
    .limit(1);
  if (!enr) throw new NotFoundError('ENROLLMENT_NOT_FOUND');

  const ts = new Date(input.ts);

  // 2. Direction: trust the device, else infer by toggling the last punch (first → IN).
  let type = input.direction;
  if (!type) {
    const [last] = await db
      .select({ type: schema.attendancePunch.type })
      .from(schema.attendancePunch)
      .where(and(eq(schema.attendancePunch.userId, enr.userId), lte(schema.attendancePunch.ts, ts)))
      .orderBy(desc(schema.attendancePunch.ts))
      .limit(1);
    type = last?.type === 'IN' ? 'OUT' : 'IN';
  }

  // 3. Allowed-window: accept + flag (never reject).
  let flagged = false;
  let flagReason: string | null = null;
  const [loc] = await db
    .select({
      timezone: schema.location.timezone,
      start: schema.location.punchWindowStart,
      end: schema.location.punchWindowEnd,
    })
    .from(schema.location)
    .where(eq(schema.location.id, device.locationId))
    .limit(1);
  if (loc && (loc.start || loc.end)) {
    const hhmm = localTimeHHMM(ts, loc.timezone);
    if (!inWindow(hhmm, loc.start, loc.end)) {
      flagged = true;
      flagReason = `punch ${hhmm} outside window ${loc.start ?? '—'}–${loc.end ?? '—'}`;
    }
  }

  // 4. Write — idempotent on (deviceId, userId, ts) for exact device retries.
  const [row] = await db
    .insert(schema.attendancePunch)
    .values({
      orgId: device.orgId,
      userId: enr.userId,
      ts,
      type,
      source: 'DEVICE',
      deviceId: device.deviceId,
      locationId: device.locationId,
      flagged,
      flagReason,
      receivedAt: new Date(),
      createdBy: `device:${device.deviceId}`,
    })
    .onConflictDoNothing({
      target: [schema.attendancePunch.deviceId, schema.attendancePunch.userId, schema.attendancePunch.ts],
    })
    .returning({
      id: schema.attendancePunch.id,
      type: schema.attendancePunch.type,
      flagged: schema.attendancePunch.flagged,
    });

  // 5. Fleet health.
  await db.update(schema.device).set({ lastSeenAt: new Date() }).where(eq(schema.device.id, device.deviceId));

  if (!row) return { id: null, type, flagged, duplicate: true }; // idempotent replay
  return { id: row.id, type: row.type, flagged: row.flagged, duplicate: false };
}
