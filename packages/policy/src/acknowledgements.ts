import { and, eq } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { type AuthContext, NotFoundError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

async function getPolicyOrThrow(orgId: string, policyId: string) {
  const [p] = await db
    .select()
    .from(schema.policy)
    .where(and(eq(schema.policy.id, policyId), eq(schema.policy.orgId, orgId)))
    .limit(1);
  if (!p) throw new NotFoundError('POLICY_NOT_FOUND');
  return p;
}

// Record the calling user's acknowledgement for the current policy version. Idempotent.
export async function acknowledgePolicy(ctx: AuthContext, policyId: string) {
  const p = await getPolicyOrThrow(ctx.orgId, policyId);
  const [row] = await db
    .insert(schema.policyAcknowledgement)
    .values({
      orgId: ctx.orgId,
      policyId: p.id,
      policyVersion: p.policyVersion,
      userId: ctx.userId ?? '',
    })
    .onConflictDoNothing({
      target: [
        schema.policyAcknowledgement.policyId,
        schema.policyAcknowledgement.userId,
        schema.policyAcknowledgement.policyVersion,
      ],
    })
    .returning();
  return row ?? null; // null = already acknowledged
}

// Compliance report: who has and has not acknowledged the current version.
export async function listAcknowledgements(ctx: AuthContext, policyId: string) {
  requireRole(ctx, 'ADMIN');
  await getPolicyOrThrow(ctx.orgId, policyId);
  return db
    .select()
    .from(schema.policyAcknowledgement)
    .where(eq(schema.policyAcknowledgement.policyId, policyId));
}

// Policies the calling user has not yet acknowledged (ACTIVE, requiresAck=true).
export async function pendingAcknowledgements(ctx: AuthContext, userId?: string) {
  const targetUserId = userId ?? ctx.userId ?? '';
  if (targetUserId !== ctx.userId) requireRole(ctx, 'ADMIN');
  // All active, requiresAck policies in the org.
  const activePolicies = await db
    .select()
    .from(schema.policy)
    .where(
      and(
        eq(schema.policy.orgId, ctx.orgId),
        eq(schema.policy.status, 'ACTIVE'),
        eq(schema.policy.requiresAck, true)
      )
    );
  if (!activePolicies.length) return [];
  // Find which ones this user has already acknowledged at the current version.
  const acked = await db
    .select({ policyId: schema.policyAcknowledgement.policyId, policyVersion: schema.policyAcknowledgement.policyVersion })
    .from(schema.policyAcknowledgement)
    .where(
      and(
        eq(schema.policyAcknowledgement.userId, targetUserId),
        eq(schema.policyAcknowledgement.orgId, ctx.orgId)
      )
    );
  const ackedMap = new Set(acked.map((a) => `${a.policyId}:${a.policyVersion}`));
  return activePolicies.filter((p) => !ackedMap.has(`${p.id}:${p.policyVersion}`));
}
