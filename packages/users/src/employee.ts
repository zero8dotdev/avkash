import { and, eq, inArray, sql } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { type AuthContext, NotFoundError, ForbiddenError, PreconditionFailedError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

// OrgLevel type — returned by getEmployeeLevel for downstream guards.
export type OrgLevelInfo = { id: string; name: string; code: string; rank: number; isFloating: boolean };

type EmployeeProfile = typeof schema.employeeProfile.$inferSelect;
type Relationship = 'HR' | 'SELF' | 'MANAGER' | 'PEER';
type ReadTier = 'PUBLIC' | 'MANAGER' | 'SELF' | 'HR';
type WriteTier = 'SELF' | 'HR';

// The single source of truth for field-level access (plans/18). Reads project to the
// fields the viewer may see; writes are gated by the viewer's relationship. Audit
// fields + orgId are absent here, so they're never projected and never writable.
const FIELD_TIERS: Record<string, { read: ReadTier; write: WriteTier }> = {
  employeeCode: { read: 'PUBLIC', write: 'HR' },
  designation: { read: 'PUBLIC', write: 'HR' },
  employmentType: { read: 'MANAGER', write: 'HR' },
  // Plan 29 (revised): organisational level (OrgLevel FK) — HR-write, MANAGER-read.
  levelId: { read: 'MANAGER', write: 'HR' },
  workLocation: { read: 'MANAGER', write: 'HR' },
  reportingManagerId: { read: 'MANAGER', write: 'HR' },
  employmentStatus: { read: 'MANAGER', write: 'HR' },
  probationEndsOn: { read: 'MANAGER', write: 'HR' },
  confirmedOn: { read: 'MANAGER', write: 'HR' },
  exitDate: { read: 'HR', write: 'HR' },
  exitReason: { read: 'HR', write: 'HR' },
  dateOfBirth: { read: 'SELF', write: 'SELF' },
  gender: { read: 'SELF', write: 'SELF' },
  maritalStatus: { read: 'SELF', write: 'SELF' },
  nationality: { read: 'SELF', write: 'SELF' },
  personalEmail: { read: 'SELF', write: 'SELF' },
  personalPhone: { read: 'SELF', write: 'SELF' },
  address: { read: 'SELF', write: 'SELF' },
  emergencyContact: { read: 'SELF', write: 'SELF' },
};

function canRead(tier: ReadTier, rel: Relationship): boolean {
  if (rel === 'HR') return true; // HR sees all
  if (tier === 'PUBLIC') return true;
  if (tier === 'MANAGER') return rel === 'MANAGER' || rel === 'SELF';
  if (tier === 'SELF') return rel === 'SELF';
  return false; // HR-tier field, non-HR viewer
}

function projectProfile(profile: EmployeeProfile, rel: Relationship): Record<string, unknown> {
  const out: Record<string, unknown> = { userId: profile.userId };
  for (const [field, { read }] of Object.entries(FIELD_TIERS)) {
    if (canRead(read, rel)) out[field] = (profile as Record<string, unknown>)[field];
  }
  return out;
}

function assertWritable(keys: string[], rel: Relationship): void {
  for (const k of keys) {
    const tier = FIELD_TIERS[k];
    const ok = tier && (rel === 'HR' || (tier.write === 'SELF' && rel === 'SELF'));
    if (!ok) throw new ForbiddenError('FORBIDDEN');
  }
}

async function resolveRelationship(ctx: AuthContext, subjectUserId: string): Promise<Relationship> {
  if (ctx.role === 'OWNER' || ctx.role === 'ADMIN') return 'HR';
  if (ctx.userId === subjectUserId) return 'SELF';
  const [subj] = await db
    .select({ teamId: schema.user.teamId })
    .from(schema.user)
    .where(eq(schema.user.id, subjectUserId))
    .limit(1);
  // a direct reporting manager
  const [prof] = await db
    .select({ rm: schema.employeeProfile.reportingManagerId })
    .from(schema.employeeProfile)
    .where(eq(schema.employeeProfile.userId, subjectUserId))
    .limit(1);
  if (prof?.rm && prof.rm === ctx.userId) return 'MANAGER';
  // or a manager of the subject's team
  if (subj?.teamId) {
    const [t] = await db
      .select({ managers: schema.team.managers })
      .from(schema.team)
      .where(eq(schema.team.teamId, subj.teamId))
      .limit(1);
    if (t && (t.managers ?? []).includes(ctx.userId ?? '')) return 'MANAGER';
  }
  return 'PEER';
}

async function loadOrSynth(orgId: string, userId: string): Promise<EmployeeProfile> {
  const [row] = await db
    .select()
    .from(schema.employeeProfile)
    .where(eq(schema.employeeProfile.userId, userId))
    .limit(1);
  if (row) return row;
  // No profile yet — synthesise an empty one (ACTIVE, version 0) so reads work before first write.
  return { userId, orgId, employmentStatus: 'ACTIVE', version: 0 } as EmployeeProfile;
}

async function assertInOrg(ctx: AuthContext, userId: string): Promise<void> {
  const [u] = await db
    .select({ orgId: schema.user.orgId })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);
  if (!u || u.orgId !== ctx.orgId) throw new NotFoundError('USER_NOT_FOUND');
}

// A person's record, projected to what the viewer may read, plus its version (ETag).
export async function getEmployeeProfile(
  ctx: AuthContext,
  userId: string
): Promise<{ profile: Record<string, unknown>; version: number }> {
  await assertInOrg(ctx, userId);
  const rel = await resolveRelationship(ctx, userId);
  const row = await loadOrSynth(ctx.orgId, userId);
  return { profile: projectProfile(row, rel), version: row.version };
}

// One write path for both self-service and HR — the relationship decides what's
// writable; expectedVersion (If-Match) makes the write a compare-and-swap. The row is
// lazily created, so we ensure it exists, then CAS on version.
export async function updateProfile(
  ctx: AuthContext,
  userId: string,
  patch: Record<string, unknown>,
  expectedVersion?: number
): Promise<{ profile: Record<string, unknown>; version: number }> {
  await assertInOrg(ctx, userId);
  const rel = await resolveRelationship(ctx, userId);
  const keys = Object.keys(patch);
  if (keys.length === 0) {
    const cur = await loadOrSynth(ctx.orgId, userId);
    return { profile: projectProfile(cur, rel), version: cur.version };
  }
  assertWritable(keys, rel);
  await db
    .insert(schema.employeeProfile)
    .values({ userId, orgId: ctx.orgId, createdBy: ctx.userId })
    .onConflictDoNothing({ target: schema.employeeProfile.userId });
  const conds = [eq(schema.employeeProfile.userId, userId)];
  if (expectedVersion !== undefined) conds.push(eq(schema.employeeProfile.version, expectedVersion));
  const [row] = await db
    .update(schema.employeeProfile)
    .set({
      ...patch,
      version: sql`${schema.employeeProfile.version} + 1`,
      updatedBy: ctx.userId,
      updatedOn: new Date(),
    })
    .where(and(...conds))
    .returning();
  if (!row) {
    const [cur] = await db
      .select({ version: schema.employeeProfile.version })
      .from(schema.employeeProfile)
      .where(eq(schema.employeeProfile.userId, userId))
      .limit(1);
    throw new PreconditionFailedError('VERSION_CONFLICT', { expected: expectedVersion, current: cur?.version });
  }
  await db.insert(schema.activityLog).values({
    orgId: ctx.orgId,
    tableName: 'EmployeeProfile',
    userId,
    changedColumns: patch,
    changedBy: ctx.userId,
    keyword: 'employee_profile_update',
  });
  return { profile: projectProfile(row, rel), version: row.version };
}

// Roster — identity + org-chart fields, MANAGER+ only. Detailed PII is per-record.
export async function listEmployees(
  ctx: AuthContext,
  opts?: { teamId?: string; departmentId?: string; levelId?: string; status?: string }
): Promise<Record<string, unknown>[]> {
  requireRole(ctx, 'MANAGER');
  const conds = [eq(schema.user.orgId, ctx.orgId)];
  if (opts?.teamId) conds.push(eq(schema.user.teamId, opts.teamId));
  if (opts?.departmentId) conds.push(eq(schema.user.departmentId, opts.departmentId));
  if (opts?.levelId) conds.push(eq(schema.employeeProfile.levelId, opts.levelId));
  const rows = await db
    .select({
      userId: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      role: schema.user.role,
      teamId: schema.user.teamId,
      departmentId: schema.user.departmentId,
      locationId: schema.user.locationId,
      isFloating: schema.user.isFloating,
      employeeCode: schema.employeeProfile.employeeCode,
      designation: schema.employeeProfile.designation,
      employmentType: schema.employeeProfile.employmentType,
      levelId: schema.employeeProfile.levelId,
      employmentStatus: schema.employeeProfile.employmentStatus,
      workLocation: schema.employeeProfile.workLocation,
    })
    .from(schema.user)
    .leftJoin(schema.employeeProfile, eq(schema.employeeProfile.userId, schema.user.id))
    .where(and(...conds))
    .orderBy(schema.user.name);
  return opts?.status ? rows.filter((r) => r.employmentStatus === opts.status) : rows;
}

// Fetch the employee's OrgLevel record (or null if unclassified).
// Callers use .id for policy lookups and .isFloating for routing.
export async function getEmployeeLevel(_orgId: string, userId: string): Promise<OrgLevelInfo | null> {
  const [profile] = await db
    .select({ levelId: schema.employeeProfile.levelId })
    .from(schema.employeeProfile)
    .where(eq(schema.employeeProfile.userId, userId))
    .limit(1);
  if (!profile?.levelId) return null;
  const [level] = await db
    .select({ id: schema.orgLevel.id, name: schema.orgLevel.name, code: schema.orgLevel.code, rank: schema.orgLevel.rank, isFloating: schema.orgLevel.isFloating })
    .from(schema.orgLevel)
    .where(eq(schema.orgLevel.id, profile.levelId))
    .limit(1);
  return level ?? null;
}

// Bulk-assign an OrgLevel to multiple users (ADMIN only). Idempotent.
// Auto-syncs user.isFloating from the level's isFloating flag.
export async function bulkSetLevel(
  ctx: AuthContext,
  userIds: string[],
  levelId: string
): Promise<void> {
  requireRole(ctx, 'ADMIN');
  if (userIds.length === 0) return;
  // Look up the OrgLevel to determine isFloating.
  const [lvl] = await db
    .select({ isFloating: schema.orgLevel.isFloating })
    .from(schema.orgLevel)
    .where(and(eq(schema.orgLevel.id, levelId), eq(schema.orgLevel.orgId, ctx.orgId)))
    .limit(1);
  const isFloating = lvl?.isFloating ?? false;
  // Ensure profile rows exist for all targets, then bulk-update.
  const existing = await db
    .select({ userId: schema.employeeProfile.userId })
    .from(schema.employeeProfile)
    .where(inArray(schema.employeeProfile.userId, userIds));
  const existingIds = new Set(existing.map((r) => r.userId));
  const missing = userIds.filter((id) => !existingIds.has(id));
  if (missing.length > 0) {
    await db.insert(schema.employeeProfile).values(
      missing.map((id) => ({ userId: id, orgId: ctx.orgId, createdBy: ctx.userId }))
    );
  }
  await db
    .update(schema.employeeProfile)
    .set({ levelId, updatedBy: ctx.userId, updatedOn: new Date() })
    .where(inArray(schema.employeeProfile.userId, userIds));
  await db
    .update(schema.user)
    .set({ isFloating, updatedBy: ctx.userId })
    .where(and(eq(schema.user.orgId, ctx.orgId), inArray(schema.user.id, userIds)));
  await db.insert(schema.activityLog).values({
    orgId: ctx.orgId,
    tableName: 'EmployeeProfile',
    userId: ctx.userId,
    changedColumns: { levelId, userIds },
    changedBy: ctx.userId,
    keyword: 'bulk_level_update',
  });
}

// Set or clear the floating-manager flag explicitly (ADMIN). The flag is also
// auto-set to true when employmentLevel is promoted to MANAGEMENT via bulkSetLevel.
export async function setFloating(ctx: AuthContext, userId: string, isFloating: boolean): Promise<void> {
  requireRole(ctx, 'ADMIN');
  await db
    .update(schema.user)
    .set({ isFloating, updatedBy: ctx.userId })
    .where(and(eq(schema.user.id, userId), eq(schema.user.orgId, ctx.orgId)));
}

// Set a user's department (structural assignment — does not affect team/leave routing).
export async function setUserDepartment(
  ctx: AuthContext,
  userId: string,
  departmentId: string | null
): Promise<void> {
  requireRole(ctx, 'ADMIN');
  await db
    .update(schema.user)
    .set({ departmentId, updatedBy: ctx.userId })
    .where(and(eq(schema.user.id, userId), eq(schema.user.orgId, ctx.orgId)));
  await db.insert(schema.activityLog).values({
    orgId: ctx.orgId,
    tableName: 'User',
    userId,
    changedColumns: { departmentId },
    changedBy: ctx.userId,
    keyword: 'user_department_update',
  });
}
