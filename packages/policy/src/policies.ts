import { and, eq } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { type AuthContext, NotFoundError, ConflictError, ForbiddenError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

type PolicyStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface CreatePolicyInput {
  title: string;
  slug: string;
  body?: string;
  effectiveFrom?: string | null;
  locationIds?: string[] | null;
  departmentIds?: string[] | null;
  levelIds?: string[] | null;
  requiresAck?: boolean;
  ackDeadlineDays?: number | null;
}

export interface UpdatePolicyInput extends Partial<CreatePolicyInput> {
  body?: string;
}

async function getOrThrow(orgId: string, id: string) {
  const [p] = await db
    .select()
    .from(schema.policy)
    .where(and(eq(schema.policy.id, id), eq(schema.policy.orgId, orgId)))
    .limit(1);
  if (!p) throw new NotFoundError('POLICY_NOT_FOUND');
  return p;
}

export async function createPolicy(ctx: AuthContext, input: CreatePolicyInput) {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .insert(schema.policy)
    .values({
      orgId: ctx.orgId,
      title: input.title,
      slug: input.slug,
      body: input.body ?? null,
      effectiveFrom: input.effectiveFrom ?? null,
      locationIds: input.locationIds ?? null,
      departmentIds: input.departmentIds ?? null,
      levelIds: input.levelIds ?? null,
      requiresAck: input.requiresAck ?? true,
      ackDeadlineDays: input.ackDeadlineDays ?? null,
      createdBy: ctx.userId,
      updatedBy: ctx.userId,
    })
    .returning();
  return row;
}

export async function getPolicy(ctx: AuthContext, id: string) {
  const p = await getOrThrow(ctx.orgId, id);
  // Users can only read ACTIVE policies; admins/managers see all.
  try {
    requireRole(ctx, 'MANAGER');
  } catch {
    if (p.status !== 'ACTIVE') throw new ForbiddenError('POLICY_NOT_PUBLISHED');
  }
  return p;
}

export async function listPolicies(ctx: AuthContext, opts?: { status?: PolicyStatus }) {
  const conds = [eq(schema.policy.orgId, ctx.orgId)];
  let userOnly = false;
  try {
    requireRole(ctx, 'MANAGER');
  } catch {
    // Regular users see only ACTIVE policies.
    conds.push(eq(schema.policy.status, 'ACTIVE'));
    userOnly = true;
  }
  if (!userOnly && opts?.status) conds.push(eq(schema.policy.status, opts.status));
  return db
    .select()
    .from(schema.policy)
    .where(and(...conds));
}

export async function updatePolicy(ctx: AuthContext, id: string, patch: UpdatePolicyInput, expectedVersion?: number) {
  requireRole(ctx, 'ADMIN');
  const existing = await getOrThrow(ctx.orgId, id);
  if (existing.status === 'ARCHIVED') throw new ConflictError('POLICY_ARCHIVED');
  if (expectedVersion !== undefined && existing.dbVersion !== expectedVersion) {
    const { PreconditionFailedError } = await import('@avkash/shared');
    throw new PreconditionFailedError('VERSION_MISMATCH');
  }
  const [updated] = await db
    .update(schema.policy)
    .set({
      ...patch,
      effectiveFrom: patch.effectiveFrom ?? existing.effectiveFrom,
      dbVersion: existing.dbVersion + 1,
      updatedAt: new Date(),
      updatedBy: ctx.userId,
    })
    .where(eq(schema.policy.id, id))
    .returning();
  return updated;
}

export async function publishPolicy(ctx: AuthContext, id: string) {
  requireRole(ctx, 'ADMIN');
  const p = await getOrThrow(ctx.orgId, id);
  if (p.status === 'ACTIVE') throw new ConflictError('POLICY_ALREADY_ACTIVE');
  if (p.status === 'ARCHIVED') throw new ConflictError('POLICY_ARCHIVED');
  const now = new Date();
  // Snapshot current body to version history.
  await db.insert(schema.policyVersionHistory).values({
    policyId: p.id,
    policyVersion: p.policyVersion,
    body: p.body ?? null,
    publishedAt: now,
    publishedBy: ctx.userId ?? '',
  });
  const [updated] = await db
    .update(schema.policy)
    .set({ status: 'ACTIVE', publishedAt: now, publishedBy: ctx.userId, updatedAt: now, updatedBy: ctx.userId })
    .where(eq(schema.policy.id, id))
    .returning();
  return updated;
}

export async function unpublishPolicy(ctx: AuthContext, id: string) {
  requireRole(ctx, 'ADMIN');
  const p = await getOrThrow(ctx.orgId, id);
  if (p.status !== 'ACTIVE') throw new ConflictError('POLICY_NOT_ACTIVE');
  const [updated] = await db
    .update(schema.policy)
    .set({ status: 'DRAFT', updatedAt: new Date(), updatedBy: ctx.userId })
    .where(eq(schema.policy.id, id))
    .returning();
  return updated;
}

export async function archivePolicy(ctx: AuthContext, id: string) {
  requireRole(ctx, 'ADMIN');
  const p = await getOrThrow(ctx.orgId, id);
  if (p.status !== 'ACTIVE') throw new ConflictError('POLICY_NOT_ACTIVE');
  const now = new Date();
  const [updated] = await db
    .update(schema.policy)
    .set({ status: 'ARCHIVED', archivedAt: now, archivedBy: ctx.userId, updatedAt: now, updatedBy: ctx.userId })
    .where(eq(schema.policy.id, id))
    .returning();
  return updated;
}

export async function getPolicyVersionHistory(ctx: AuthContext, id: string) {
  requireRole(ctx, 'ADMIN');
  await getOrThrow(ctx.orgId, id); // ensure belongs to org
  return db.select().from(schema.policyVersionHistory).where(eq(schema.policyVersionHistory.policyId, id));
}
