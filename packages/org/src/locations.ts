import { and, eq, sql } from 'drizzle-orm';
import { db, schema, type Organisation, type Location } from '@avkash/db';
import { type AuthContext, NotFoundError, PreconditionFailedError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

// The countries an org operates in (legacy string list). Drives which holiday set
// applies to its teams. Superseded by the Location entity below, kept during transition.
export async function setOrgLocations(ctx: AuthContext, locations: string[]): Promise<Organisation> {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .update(schema.organisation)
    .set({ location: locations })
    .where(eq(schema.organisation.orgId, ctx.orgId))
    .returning();
  if (!row) throw new NotFoundError('ORG_NOT_FOUND');
  return row;
}

// ── Location entity (plan 23) ────────────────────────────────────────────────
// A first-class site: timezone (the load-bearing field), geofence, allowed punch
// window. ADMIN-managed; optimistic-concurrency on edits like our other resources.

export interface CreateLocationInput {
  name: string;
  timezone: string;
  address?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  geofenceRadiusM?: number | null;
  ipAllowlist?: string[] | null;
  punchWindowStart?: string | null;
  punchWindowEnd?: string | null;
}

export async function createLocation(ctx: AuthContext, input: CreateLocationInput): Promise<Location> {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .insert(schema.location)
    .values({
      orgId: ctx.orgId,
      name: input.name,
      timezone: input.timezone,
      address: input.address ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      geofenceRadiusM: input.geofenceRadiusM ?? null,
      ipAllowlist: input.ipAllowlist ?? null,
      punchWindowStart: input.punchWindowStart ?? null,
      punchWindowEnd: input.punchWindowEnd ?? null,
      createdBy: ctx.userId,
    })
    .returning();
  return row;
}

export async function listLocations(ctx: AuthContext): Promise<Location[]> {
  requireRole(ctx, 'MANAGER'); // visible to managers+; mutations are ADMIN-only
  return db.select().from(schema.location).where(eq(schema.location.orgId, ctx.orgId));
}

export async function getLocation(ctx: AuthContext, id: string): Promise<Location> {
  const [row] = await db
    .select()
    .from(schema.location)
    .where(and(eq(schema.location.id, id), eq(schema.location.orgId, ctx.orgId)))
    .limit(1);
  if (!row) throw new NotFoundError('LOCATION_NOT_FOUND');
  return row;
}

export interface UpdateLocationInput extends Partial<CreateLocationInput> {
  isActive?: boolean;
}

export async function updateLocation(
  ctx: AuthContext,
  id: string,
  patch: UpdateLocationInput,
  expectedVersion?: number
): Promise<Location> {
  requireRole(ctx, 'ADMIN');
  const conds = [eq(schema.location.id, id), eq(schema.location.orgId, ctx.orgId)];
  if (expectedVersion !== undefined) conds.push(eq(schema.location.version, expectedVersion));
  const [row] = await db
    .update(schema.location)
    .set({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.timezone !== undefined && { timezone: patch.timezone }),
      ...(patch.address !== undefined && { address: patch.address }),
      ...(patch.latitude !== undefined && { latitude: patch.latitude }),
      ...(patch.longitude !== undefined && { longitude: patch.longitude }),
      ...(patch.geofenceRadiusM !== undefined && { geofenceRadiusM: patch.geofenceRadiusM }),
      ...(patch.ipAllowlist !== undefined && { ipAllowlist: patch.ipAllowlist }),
      ...(patch.punchWindowStart !== undefined && { punchWindowStart: patch.punchWindowStart }),
      ...(patch.punchWindowEnd !== undefined && { punchWindowEnd: patch.punchWindowEnd }),
      ...(patch.isActive !== undefined && { isActive: patch.isActive }),
      version: sql`${schema.location.version} + 1`,
      updatedBy: ctx.userId,
      updatedAt: new Date(),
    })
    .where(and(...conds))
    .returning();
  if (!row) {
    if (expectedVersion !== undefined) {
      const [cur] = await db
        .select({ version: schema.location.version })
        .from(schema.location)
        .where(and(eq(schema.location.id, id), eq(schema.location.orgId, ctx.orgId)))
        .limit(1);
      if (cur)
        throw new PreconditionFailedError('VERSION_CONFLICT', { expected: expectedVersion, current: cur.version });
    }
    throw new NotFoundError('LOCATION_NOT_FOUND');
  }
  return row;
}
