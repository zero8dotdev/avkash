import { randomUUID } from 'node:crypto';
import { and, eq, lt, sql } from 'drizzle-orm';
import { db, schema, type Organisation, type Invitation } from '@avkash/db';
import { type AuthContext, NotFoundError, PreconditionFailedError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

export const GRACE_DAYS = 14;
export const PROVISIONAL_INVITE_CAP = 10;

export interface CreateOrganizationInput {
  orgName: string;
  ownerEmail: string;
}

// Bootstrap an organisation: PROVISIONAL org (14-day verify window) + a
// self-issued OWNER invitation. The founder then signs up and the auth
// create-hook provisions them as OWNER.
export async function createOrganization(
  input: CreateOrganizationInput
): Promise<{ org: Organisation; invite: Invitation }> {
  const email = input.ownerEmail.trim().toLowerCase();
  const verifyBy = new Date(Date.now() + GRACE_DAYS * 24 * 60 * 60 * 1000);
  return db.transaction(async (tx) => {
    const [org] = await tx
      .insert(schema.organisation)
      .values({ name: input.orgName, status: 'PROVISIONAL', verifyBy })
      .returning();
    // A default team so the founder is functional from day one (no USER_NO_TEAM).
    const [team] = await tx.insert(schema.team).values({ name: 'General', orgId: org.orgId, managers: [] }).returning();
    const [invite] = await tx
      .insert(schema.invitation)
      .values({
        email,
        orgId: org.orgId,
        role: 'OWNER',
        teamId: team.teamId,
        token: randomUUID(),
        status: 'PENDING',
        expiresAt: verifyBy,
      })
      .returning();
    return { org, invite };
  });
}

// Grace sweep: provisional orgs past their verify deadline become RESTRICTED.
// Triggered by a scheduler (cron → POST /internal/grace-sweep, or @avkash/jobs).
export async function restrictExpiredOrgs(now = new Date()): Promise<number> {
  const rows = await db
    .update(schema.organisation)
    .set({ status: 'RESTRICTED', updatedOn: now })
    .where(and(eq(schema.organisation.status, 'PROVISIONAL'), lt(schema.organisation.verifyBy, now)))
    .returning({ id: schema.organisation.orgId });
  return rows.length;
}

// Capability: a RESTRICTED org (grace lapsed) cannot invite. PROVISIONAL and
// VERIFIED can — the per-seat cap is enforced by the invite endpoint.
export function canInvite(org: Pick<Organisation, 'status'>): boolean {
  return org.status !== 'RESTRICTED';
}

// The caller's own org (the API is org-scoped — you only ever see yours).
export async function getOrg(ctx: AuthContext): Promise<Organisation> {
  const [row] = await db.select().from(schema.organisation).where(eq(schema.organisation.orgId, ctx.orgId)).limit(1);
  if (!row) throw new NotFoundError('ORG_NOT_FOUND');
  return row;
}

export interface UpdateOrgInput {
  name?: string;
  dateformat?: string;
  timeformat?: string;
  halfDayLeave?: boolean;
  visibility?: 'ORG' | 'TEAM' | 'SELF';
  initialSetup?: string; // onboarding wizard step
  isSetupCompleted?: boolean;
}

// Org settings + onboarding state. HR (ADMIN) only.
export async function updateOrg(
  ctx: AuthContext,
  patch: UpdateOrgInput,
  expectedVersion?: number
): Promise<Organisation> {
  requireRole(ctx, 'ADMIN');
  const conds = [eq(schema.organisation.orgId, ctx.orgId)];
  if (expectedVersion !== undefined) conds.push(eq(schema.organisation.version, expectedVersion));
  const [row] = await db
    .update(schema.organisation)
    .set({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.dateformat !== undefined && { dateformat: patch.dateformat }),
      ...(patch.timeformat !== undefined && { timeformat: patch.timeformat }),
      ...(patch.halfDayLeave !== undefined && { halfDayLeave: patch.halfDayLeave }),
      ...(patch.visibility !== undefined && { visibility: patch.visibility }),
      ...(patch.initialSetup !== undefined && { initialSetup: patch.initialSetup }),
      ...(patch.isSetupCompleted !== undefined && { isSetupCompleted: patch.isSetupCompleted }),
      version: sql`${schema.organisation.version} + 1`,
      updatedBy: ctx.userId,
      updatedOn: new Date(),
    })
    .where(and(...conds))
    .returning();
  if (!row) {
    if (expectedVersion !== undefined) {
      const [cur] = await db
        .select({ version: schema.organisation.version })
        .from(schema.organisation)
        .where(eq(schema.organisation.orgId, ctx.orgId))
        .limit(1);
      if (cur)
        throw new PreconditionFailedError('VERSION_CONFLICT', { expected: expectedVersion, current: cur.version });
    }
    throw new NotFoundError('ORG_NOT_FOUND');
  }
  return row;
}
