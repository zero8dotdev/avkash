import { and, eq, gte, lte } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import type { AuthContext } from '@avkash/shared';
import { isActiveDelegate } from './delegation';
import { todayStr } from './ledger';

// Can ctx approve leaves for this team? OWNER/ADMIN anywhere, a team manager, or
// an active delegate. Shared by approval-gating AND comment visibility.
export async function canApprove(ctx: AuthContext, teamId: string): Promise<boolean> {
  if (ctx.role === 'OWNER' || ctx.role === 'ADMIN') return true;
  const [t] = await db
    .select({ managers: schema.team.managers })
    .from(schema.team)
    .where(eq(schema.team.teamId, teamId))
    .limit(1);
  if (t && (t.managers ?? []).includes(ctx.userId ?? '')) return true;
  return isActiveDelegate(ctx.orgId, ctx.userId ?? '', teamId);
}

// Every team a manager may act on today — the set form of canApprove. Teams they
// directly manage, plus teams an active delegation routes to them (a specific team,
// or every team the delegator manages for a blanket/null-team delegation). OWNER/ADMIN
// → all org teams. Used to scope what a manager can list, so it matches what they can
// approve.
export async function resolveManagedTeams(ctx: AuthContext): Promise<string[]> {
  const teams = await db
    .select({ teamId: schema.team.teamId, managers: schema.team.managers })
    .from(schema.team)
    .where(eq(schema.team.orgId, ctx.orgId));
  if (ctx.role === 'OWNER' || ctx.role === 'ADMIN') return teams.map((t) => t.teamId);

  const userId = ctx.userId ?? '';
  const managedBy = (uid: string) => teams.filter((t) => (t.managers ?? []).includes(uid)).map((t) => t.teamId);
  const managed = new Set<string>(managedBy(userId));

  const dels = await db
    .select({ teamId: schema.approvalDelegation.teamId, fromManagerId: schema.approvalDelegation.fromManagerId })
    .from(schema.approvalDelegation)
    .where(
      and(
        eq(schema.approvalDelegation.orgId, ctx.orgId),
        eq(schema.approvalDelegation.toUserId, userId),
        lte(schema.approvalDelegation.startsOn, todayStr()),
        gte(schema.approvalDelegation.endsOn, todayStr())
      )
    );
  for (const d of dels) {
    if (d.teamId) managed.add(d.teamId);
    else for (const id of managedBy(d.fromManagerId)) managed.add(id);
  }
  return [...managed];
}
