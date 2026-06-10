import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema, type User } from '@avkash/db';
import { type AuthContext, NotFoundError, ForbiddenError, PreconditionFailedError, ORG_GRAPH_EVENTS } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { dispatch, resolveUsers } from '@avkash/notifications';
import { publish, defineEvent } from '@avkash/events';

// ── Event definitions (Plan 51 WS3) ──
const orgRoleChangedDef = defineEvent(
  ORG_GRAPH_EVENTS.ORG_ROLE_CHANGED,
  z.object({ orgId: z.string().uuid(), userId: z.string().uuid() })
);
const teamMemberAddedDef = defineEvent(
  ORG_GRAPH_EVENTS.TEAM_MEMBER_ADDED,
  z.object({ orgId: z.string().uuid(), userId: z.string().uuid(), teamId: z.string().uuid() })
);
const teamMemberRemovedDef = defineEvent(
  ORG_GRAPH_EVENTS.TEAM_MEMBER_REMOVED,
  z.object({ orgId: z.string().uuid(), userId: z.string().uuid(), teamId: z.string().uuid() })
);

// Session context — the web app's first call after login: who am I, my org, my team.
export async function getMe(ctx: AuthContext) {
  const [user] = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.id, ctx.userId ?? ''))
    .limit(1);
  if (!user) throw new NotFoundError('USER_NOT_FOUND');
  const [org] = await db
    .select({
      orgId: schema.organisation.orgId,
      name: schema.organisation.name,
      status: schema.organisation.status,
      isSetupCompleted: schema.organisation.isSetupCompleted,
    })
    .from(schema.organisation)
    .where(eq(schema.organisation.orgId, ctx.orgId))
    .limit(1);
  const team = user.teamId
    ? ((
        await db
          .select({ teamId: schema.team.teamId, name: schema.team.name })
          .from(schema.team)
          .where(eq(schema.team.teamId, user.teamId))
          .limit(1)
      )[0] ?? null)
    : null;
  return { user, org: org ?? null, team };
}

export async function listUsers(ctx: AuthContext, opts?: { teamId?: string }): Promise<User[]> {
  requireRole(ctx, 'MANAGER');
  const conds = [eq(schema.user.orgId, ctx.orgId)];
  if (opts?.teamId) conds.push(eq(schema.user.teamId, opts.teamId));
  return db
    .select()
    .from(schema.user)
    .where(and(...conds))
    .orderBy(schema.user.name);
}

export async function getUser(ctx: AuthContext, userId: string): Promise<User> {
  requireRole(ctx, 'MANAGER');
  const [row] = await db
    .select()
    .from(schema.user)
    .where(and(eq(schema.user.id, userId), eq(schema.user.orgId, ctx.orgId)))
    .limit(1);
  if (!row) throw new NotFoundError('USER_NOT_FOUND');
  return row;
}

export interface UpdateUserInput {
  role?: 'ADMIN' | 'MANAGER' | 'USER';
  teamId?: string | null;
  locationId?: string | null;
}

// HR changes a person's role or team (promote to manager via team.managers separately).
// The OWNER is not reassignable here — that role is set once, at org creation.
export async function updateUserAdmin(
  ctx: AuthContext,
  userId: string,
  patch: UpdateUserInput,
  expectedVersion?: number
): Promise<User> {
  requireRole(ctx, 'ADMIN');
  const [target] = await db
    .select({ role: schema.user.role, orgId: schema.user.orgId, teamId: schema.user.teamId })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);
  if (!target || target.orgId !== ctx.orgId) throw new NotFoundError('USER_NOT_FOUND');
  if (target.role === 'OWNER') throw new ForbiddenError('FORBIDDEN');
  const conds = [eq(schema.user.id, userId)];
  if (expectedVersion !== undefined) conds.push(eq(schema.user.version, expectedVersion));
  const [row] = await db
    .update(schema.user)
    .set({
      ...(patch.role !== undefined && { role: patch.role }),
      ...(patch.teamId !== undefined && { teamId: patch.teamId }),
      ...(patch.locationId !== undefined && { locationId: patch.locationId }),
      version: sql`${schema.user.version} + 1`,
      updatedBy: ctx.userId,
      updatedAt: new Date(),
    })
    .where(and(...conds))
    .returning();
  if (!row) {
    if (expectedVersion !== undefined) {
      const [cur] = await db
        .select({ version: schema.user.version })
        .from(schema.user)
        .where(eq(schema.user.id, userId))
        .limit(1);
      if (cur)
        throw new PreconditionFailedError('VERSION_CONFLICT', { expected: expectedVersion, current: cur.version });
    }
    throw new NotFoundError('USER_NOT_FOUND');
  }
  // Plan 51 WS3: emit org-graph events for the tuple-writer subscriber.
  // NOTE: No transaction here — events are published after the write (not atomic).
  // The outbox event is still the reliability guarantee via the relay.
  if (patch.role !== undefined && patch.role !== target.role) {
    try {
      await publish(db, ctx, orgRoleChangedDef, { orgId: ctx.orgId, userId });
    } catch (err) {
      console.error('[authz-sync] publish org.member.role_changed failed:', err instanceof Error ? err.message : err);
    }
  }
  if (patch.teamId !== undefined && patch.teamId !== target.teamId) {
    // Team membership changed: emit removed (old team) + added (new team) events.
    const oldTeamId = target.teamId;
    const newTeamId = patch.teamId;
    try {
      if (oldTeamId) {
        await publish(db, ctx, teamMemberRemovedDef, { orgId: ctx.orgId, userId, teamId: oldTeamId });
      }
      if (newTeamId) {
        await publish(db, ctx, teamMemberAddedDef, { orgId: ctx.orgId, userId, teamId: newTeamId });
      }
    } catch (err) {
      console.error('[authz-sync] publish team member changed failed:', err instanceof Error ? err.message : err);
    }
  }
  // Tell the member their role changed (best-effort; never blocks the update).
  if (patch.role !== undefined && patch.role !== target.role) {
    const [recipient] = await resolveUsers(ctx.orgId, [userId]);
    const [org] = await db
      .select({ name: schema.organisation.name })
      .from(schema.organisation)
      .where(eq(schema.organisation.orgId, ctx.orgId))
      .limit(1);
    if (recipient) {
      try {
        await dispatch([
          {
            event: 'org.member.role_changed',
            recipient,
            dedupeKey: `org.member.role_changed:${userId}:${target.role}->${patch.role}`,
            payload: {
              name: recipient.name,
              orgName: org?.name ?? 'your organization',
              role: patch.role,
              previousRole: target.role,
            },
          },
        ]);
      } catch (err) {
        console.error('notify role_changed failed:', err instanceof Error ? err.message : err);
      }
    }
  }
  return row;
}
