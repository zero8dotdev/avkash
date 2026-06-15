import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { type AuthContext, ForbiddenError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

export type ConfirmAction = 'CONFIRM' | 'REJECT';

// Resolve team IDs a caller may act as manager on (OWNER/ADMIN = all, else their teams).
async function managedTeamIds(ctx: AuthContext): Promise<Set<string>> {
  const teams = await db
    .select({ teamId: schema.team.teamId, managers: schema.team.managers })
    .from(schema.team)
    .where(eq(schema.team.orgId, ctx.orgId));
  if (ctx.role === 'OWNER' || ctx.role === 'ADMIN') return new Set(teams.map((t) => t.teamId));
  const userId = ctx.userId ?? '';
  const managed = new Set(teams.filter((t) => (t.managers ?? []).includes(userId)).map((t) => t.teamId));
  const today = new Date().toISOString().slice(0, 10);
  const dels = await db
    .select({ teamId: schema.approvalDelegation.teamId, fromManagerId: schema.approvalDelegation.fromManagerId })
    .from(schema.approvalDelegation)
    .where(
      and(
        eq(schema.approvalDelegation.orgId, ctx.orgId),
        eq(schema.approvalDelegation.toUserId, userId),
        lte(schema.approvalDelegation.startsOn, today),
        gte(schema.approvalDelegation.endsOn, today)
      )
    );
  for (const d of dels) {
    if (d.teamId) managed.add(d.teamId);
    else for (const t of teams.filter((t) => (t.managers ?? []).includes(d.fromManagerId))) managed.add(t.teamId);
  }
  return managed;
}

// Bulk confirm or reject pending punches. Manager must manage the team the punch owner
// belongs to (same guard used by leave approval).
export async function confirmPunches(
  ctx: AuthContext,
  punchIds: string[],
  action: ConfirmAction
): Promise<{ updated: number }> {
  requireRole(ctx, 'MANAGER');
  if (!punchIds.length) return { updated: 0 };

  const punches = await db
    .select({
      id: schema.attendancePunch.id,
      userId: schema.attendancePunch.userId,
      confirmationStatus: schema.attendancePunch.confirmationStatus,
    })
    .from(schema.attendancePunch)
    .where(and(eq(schema.attendancePunch.orgId, ctx.orgId), inArray(schema.attendancePunch.id, punchIds)));

  const pending = punches.filter((p) => p.confirmationStatus === 'PENDING_CONFIRMATION');
  if (!pending.length) return { updated: 0 };

  const managed = await managedTeamIds(ctx);
  // Verify manager covers all affected employees.
  for (const punch of pending) {
    const [u] = await db
      .select({ teamId: schema.user.teamId })
      .from(schema.user)
      .where(eq(schema.user.id, punch.userId))
      .limit(1);
    if (!u?.teamId || !managed.has(u.teamId)) throw new ForbiddenError('NOT_PUNCH_MANAGER');
  }

  const ids = pending.map((p) => p.id);
  await db
    .update(schema.attendancePunch)
    .set({
      confirmationStatus: action === 'CONFIRM' ? 'CONFIRMED' : 'REJECTED',
      confirmedBy: ctx.userId,
      confirmedAt: new Date(),
    })
    .where(inArray(schema.attendancePunch.id, ids));

  return { updated: ids.length };
}

// Pending punches for a team the caller manages (used by the manager review dashboard).
export async function listPendingConfirmations(
  ctx: AuthContext,
  teamId: string
): Promise<(typeof schema.attendancePunch.$inferSelect)[]> {
  requireRole(ctx, 'MANAGER');
  const managed = await managedTeamIds(ctx);
  if (!managed.has(teamId)) throw new ForbiddenError('NOT_PUNCH_MANAGER');

  const members = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(and(eq(schema.user.orgId, ctx.orgId), eq(schema.user.teamId, teamId)));
  if (!members.length) return [];

  return db
    .select()
    .from(schema.attendancePunch)
    .where(
      and(
        eq(schema.attendancePunch.orgId, ctx.orgId),
        eq(schema.attendancePunch.confirmationStatus, 'PENDING_CONFIRMATION'),
        inArray(
          schema.attendancePunch.userId,
          members.map((m) => m.id)
        )
      )
    )
    .orderBy(schema.attendancePunch.ts);
}
