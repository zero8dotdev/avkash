import { and, eq } from 'drizzle-orm';
import { db, schema, type User } from '@avkash/db';
import { type AuthContext, NotFoundError, ForbiddenError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

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
}

// HR changes a person's role or team (promote to manager via team.managers separately).
// The OWNER is not reassignable here — that role is set once, at org creation.
export async function updateUserAdmin(ctx: AuthContext, userId: string, patch: UpdateUserInput): Promise<User> {
  requireRole(ctx, 'ADMIN');
  const [target] = await db
    .select({ role: schema.user.role, orgId: schema.user.orgId })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);
  if (!target || target.orgId !== ctx.orgId) throw new NotFoundError('USER_NOT_FOUND');
  if (target.role === 'OWNER') throw new ForbiddenError('FORBIDDEN');
  const [row] = await db
    .update(schema.user)
    .set({
      ...(patch.role !== undefined && { role: patch.role }),
      ...(patch.teamId !== undefined && { teamId: patch.teamId }),
      updatedBy: ctx.userId,
      updatedAt: new Date(),
    })
    .where(eq(schema.user.id, userId))
    .returning();
  return row;
}
