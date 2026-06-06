import { and, eq, inArray, sql } from 'drizzle-orm';
import { db, schema, type Department, type DepartmentLocation } from '@avkash/db';
import { type AuthContext, NotFoundError, PreconditionFailedError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

export interface CreateDepartmentInput {
  name: string;
  code: string;
  description?: string | null;
}

export async function createDepartment(ctx: AuthContext, input: CreateDepartmentInput): Promise<Department> {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .insert(schema.department)
    .values({
      orgId: ctx.orgId,
      name: input.name,
      code: input.code.toUpperCase(),
      description: input.description ?? null,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    })
    .returning();
  return row;
}

export async function listDepartments(
  ctx: AuthContext,
  opts?: { locationId?: string; activeOnly?: boolean }
): Promise<Department[]> {
  requireRole(ctx, 'MANAGER');
  const conds = [eq(schema.department.orgId, ctx.orgId)];
  if (opts?.activeOnly !== false) conds.push(eq(schema.department.isActive, true));

  if (opts?.locationId) {
    // Filter to departments that exist at this location via the join table.
    const locationDepts = await db
      .select({ departmentId: schema.departmentLocation.departmentId })
      .from(schema.departmentLocation)
      .where(
        and(
          eq(schema.departmentLocation.orgId, ctx.orgId),
          eq(schema.departmentLocation.locationId, opts.locationId)
        )
      );
    const ids = locationDepts.map((r) => r.departmentId);
    if (ids.length === 0) return [];
    conds.push(inArray(schema.department.id, ids));
  }

  return db.select().from(schema.department).where(and(...conds)).orderBy(schema.department.name);
}

export async function getDepartment(ctx: AuthContext, id: string): Promise<Department> {
  requireRole(ctx, 'MANAGER');
  const [row] = await db
    .select()
    .from(schema.department)
    .where(and(eq(schema.department.id, id), eq(schema.department.orgId, ctx.orgId)))
    .limit(1);
  if (!row) throw new NotFoundError('DEPARTMENT_NOT_FOUND');
  return row;
}

export interface UpdateDepartmentInput {
  name?: string;
  code?: string;
  description?: string | null;
}

export async function updateDepartment(
  ctx: AuthContext,
  id: string,
  patch: UpdateDepartmentInput,
  expectedVersion?: number
): Promise<Department> {
  requireRole(ctx, 'ADMIN');
  const conds = [eq(schema.department.id, id), eq(schema.department.orgId, ctx.orgId)];
  if (expectedVersion !== undefined) conds.push(eq(schema.department.version, expectedVersion));
  const [row] = await db
    .update(schema.department)
    .set({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.code !== undefined && { code: patch.code.toUpperCase() }),
      ...(patch.description !== undefined && { description: patch.description }),
      version: sql`${schema.department.version} + 1`,
      updatedBy: ctx.userId,
      updatedAt: new Date(),
    })
    .where(and(...conds))
    .returning();
  if (!row) {
    if (expectedVersion !== undefined) {
      const [cur] = await db
        .select({ version: schema.department.version })
        .from(schema.department)
        .where(and(eq(schema.department.id, id), eq(schema.department.orgId, ctx.orgId)))
        .limit(1);
      if (cur)
        throw new PreconditionFailedError('VERSION_CONFLICT', { expected: expectedVersion, current: cur.version });
    }
    throw new NotFoundError('DEPARTMENT_NOT_FOUND');
  }
  return row;
}

// Soft-delete: users retain the FK, isActive becomes false.
export async function archiveDepartment(ctx: AuthContext, id: string): Promise<Department> {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .update(schema.department)
    .set({
      isActive: false,
      version: sql`${schema.department.version} + 1`,
      updatedBy: ctx.userId,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.department.id, id), eq(schema.department.orgId, ctx.orgId)))
    .returning();
  if (!row) throw new NotFoundError('DEPARTMENT_NOT_FOUND');
  return row;
}

// ── Department ↔ Location matrix ─────────────────────────────────────────────

export async function assignDepartmentToLocation(
  ctx: AuthContext,
  departmentId: string,
  locationId: string,
  headUserId?: string | null
): Promise<DepartmentLocation> {
  requireRole(ctx, 'ADMIN');
  // Verify department and location belong to this org.
  const [dept] = await db
    .select({ id: schema.department.id })
    .from(schema.department)
    .where(and(eq(schema.department.id, departmentId), eq(schema.department.orgId, ctx.orgId)))
    .limit(1);
  if (!dept) throw new NotFoundError('DEPARTMENT_NOT_FOUND');

  const [row] = await db
    .insert(schema.departmentLocation)
    .values({
      orgId: ctx.orgId,
      departmentId,
      locationId,
      headUserId: headUserId ?? null,
      createdBy: ctx.userId,
    })
    .onConflictDoUpdate({
      target: [schema.departmentLocation.departmentId, schema.departmentLocation.locationId],
      set: { headUserId: headUserId ?? null },
    })
    .returning();
  return row;
}

export async function removeDepartmentFromLocation(
  ctx: AuthContext,
  departmentId: string,
  locationId: string
): Promise<void> {
  requireRole(ctx, 'ADMIN');
  await db
    .delete(schema.departmentLocation)
    .where(
      and(
        eq(schema.departmentLocation.departmentId, departmentId),
        eq(schema.departmentLocation.locationId, locationId),
        eq(schema.departmentLocation.orgId, ctx.orgId)
      )
    );
}

export async function setDepartmentHead(
  ctx: AuthContext,
  departmentId: string,
  locationId: string,
  headUserId: string
): Promise<DepartmentLocation> {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .update(schema.departmentLocation)
    .set({ headUserId })
    .where(
      and(
        eq(schema.departmentLocation.departmentId, departmentId),
        eq(schema.departmentLocation.locationId, locationId),
        eq(schema.departmentLocation.orgId, ctx.orgId)
      )
    )
    .returning();
  if (!row) throw new NotFoundError('DEPARTMENT_LOCATION_NOT_FOUND');
  return row;
}

export async function getDepartmentHead(
  orgId: string,
  departmentId: string,
  locationId: string
): Promise<string | null> {
  const [row] = await db
    .select({ headUserId: schema.departmentLocation.headUserId })
    .from(schema.departmentLocation)
    .where(
      and(
        eq(schema.departmentLocation.departmentId, departmentId),
        eq(schema.departmentLocation.locationId, locationId),
        eq(schema.departmentLocation.orgId, orgId)
      )
    )
    .limit(1);
  return row?.headUserId ?? null;
}

// Predicate: is this user the department head at the given location?
export async function isDepartmentHead(
  ctx: AuthContext,
  departmentId: string,
  locationId: string
): Promise<boolean> {
  const headId = await getDepartmentHead(ctx.orgId, departmentId, locationId);
  return headId === ctx.userId;
}

// List of locations a department is assigned to, with head info.
export async function getDepartmentLocations(
  ctx: AuthContext,
  departmentId: string
): Promise<DepartmentLocation[]> {
  requireRole(ctx, 'MANAGER');
  return db
    .select()
    .from(schema.departmentLocation)
    .where(
      and(
        eq(schema.departmentLocation.departmentId, departmentId),
        eq(schema.departmentLocation.orgId, ctx.orgId)
      )
    );
}
