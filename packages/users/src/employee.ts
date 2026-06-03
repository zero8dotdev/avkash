import { and, eq } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { type AuthContext, NotFoundError, ForbiddenError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

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
  // No profile yet — synthesise an empty one (ACTIVE) so reads work before first write.
  return { userId, orgId, employmentStatus: 'ACTIVE' } as EmployeeProfile;
}

async function assertInOrg(ctx: AuthContext, userId: string): Promise<void> {
  const [u] = await db
    .select({ orgId: schema.user.orgId })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);
  if (!u || u.orgId !== ctx.orgId) throw new NotFoundError('USER_NOT_FOUND');
}

// A person's record, projected to what the viewer may read.
export async function getEmployeeProfile(ctx: AuthContext, userId: string): Promise<Record<string, unknown>> {
  await assertInOrg(ctx, userId);
  const rel = await resolveRelationship(ctx, userId);
  return projectProfile(await loadOrSynth(ctx.orgId, userId), rel);
}

// One write path for both self-service and HR — the relationship decides what's writable.
export async function updateProfile(
  ctx: AuthContext,
  userId: string,
  patch: Record<string, unknown>
): Promise<Record<string, unknown>> {
  await assertInOrg(ctx, userId);
  const rel = await resolveRelationship(ctx, userId);
  const keys = Object.keys(patch);
  if (keys.length === 0) return projectProfile(await loadOrSynth(ctx.orgId, userId), rel);
  assertWritable(keys, rel);
  const [row] = await db
    .insert(schema.employeeProfile)
    .values({ userId, orgId: ctx.orgId, ...patch, createdBy: ctx.userId })
    .onConflictDoUpdate({
      target: schema.employeeProfile.userId,
      set: { ...patch, updatedBy: ctx.userId, updatedOn: new Date() },
    })
    .returning();
  await db.insert(schema.activityLog).values({
    orgId: ctx.orgId,
    tableName: 'EmployeeProfile',
    userId,
    changedColumns: patch,
    changedBy: ctx.userId,
    keyword: 'employee_profile_update',
  });
  return projectProfile(row, rel);
}

// Roster — identity + the org-chart-ish fields, MANAGER+ only. Detailed PII is per-record.
export async function listEmployees(
  ctx: AuthContext,
  opts?: { teamId?: string; status?: string }
): Promise<Record<string, unknown>[]> {
  requireRole(ctx, 'MANAGER');
  const conds = [eq(schema.user.orgId, ctx.orgId)];
  if (opts?.teamId) conds.push(eq(schema.user.teamId, opts.teamId));
  const rows = await db
    .select({
      userId: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      role: schema.user.role,
      teamId: schema.user.teamId,
      employeeCode: schema.employeeProfile.employeeCode,
      designation: schema.employeeProfile.designation,
      employmentType: schema.employeeProfile.employmentType,
      employmentStatus: schema.employeeProfile.employmentStatus,
      workLocation: schema.employeeProfile.workLocation,
    })
    .from(schema.user)
    .leftJoin(schema.employeeProfile, eq(schema.employeeProfile.userId, schema.user.id))
    .where(and(...conds))
    .orderBy(schema.user.name);
  return opts?.status ? rows.filter((r) => r.employmentStatus === opts.status) : rows;
}
