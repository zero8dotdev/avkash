import { and, count, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema, type Team } from '@avkash/db';
import {
  type AuthContext,
  ValidationError,
  NotFoundError,
  PreconditionFailedError,
  ORG_GRAPH_EVENTS,
} from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { publish, defineEvent } from '@avkash/events';

// ── Event definitions ─────────────────────────────────────────────────────────
const teamChangedDef = defineEvent(
  ORG_GRAPH_EVENTS.TEAM_CHANGED,
  z.object({ orgId: z.string().uuid(), teamId: z.string().uuid() })
);

type Day = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
const VALID: ReadonlySet<string> = new Set<Day>([
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
]);

function normaliseWeek(days: string[] | undefined): Day[] | undefined {
  if (days === undefined) return undefined;
  const week = [...new Set(days.map((d) => String(d).toUpperCase()))];
  if (week.some((d) => !VALID.has(d))) throw new ValidationError('WORKWEEK_INVALID_DAY');
  return week as Day[];
}

export interface CreateTeamInput {
  name: string;
  managers?: string[];
  location?: string;
  workweek?: string[];
  departmentId?: string | null;
}

// Teams = the org's structure (branches/departments). HR (ADMIN) only. Everything
// downstream hangs off a team: policies, invites, escalation, holiday + workweek
// resolution. workweek defaults to the column default when omitted.
export async function createTeam(ctx: AuthContext, input: CreateTeamInput): Promise<Team> {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .insert(schema.team)
    .values({
      name: input.name,
      orgId: ctx.orgId,
      managers: input.managers ?? [],
      location: input.location ?? null,
      workweek: normaliseWeek(input.workweek),
      departmentId: input.departmentId ?? null,
    })
    .returning();
  // Emit team changed event. No transaction here — best-effort post-write.
  try {
    await publish(db, ctx, teamChangedDef, { orgId: ctx.orgId, teamId: row.teamId });
  } catch (err) {
    console.error('[authz-sync] publish team.team.changed (create) failed:', err instanceof Error ? err.message : err);
  }
  return row;
}

export async function listTeams(ctx: AuthContext): Promise<Team[]> {
  requireRole(ctx, 'MANAGER');
  return db.select().from(schema.team).where(eq(schema.team.orgId, ctx.orgId)).orderBy(schema.team.name);
}

export async function getTeam(ctx: AuthContext, teamId: string): Promise<Team> {
  requireRole(ctx, 'MANAGER');
  const [row] = await db
    .select()
    .from(schema.team)
    .where(and(eq(schema.team.teamId, teamId), eq(schema.team.orgId, ctx.orgId)))
    .limit(1);
  if (!row) throw new NotFoundError('TEAM_NOT_FOUND');
  return row;
}

export interface UpdateTeamInput {
  name?: string;
  managers?: string[];
  location?: string | null;
  locationId?: string | null;
  workweek?: string[];
  isActive?: boolean;
  departmentId?: string | null;
}

export async function updateTeam(
  ctx: AuthContext,
  teamId: string,
  patch: UpdateTeamInput,
  expectedVersion?: number
): Promise<Team> {
  requireRole(ctx, 'ADMIN');
  const conds = [eq(schema.team.teamId, teamId), eq(schema.team.orgId, ctx.orgId)];
  if (expectedVersion !== undefined) conds.push(eq(schema.team.version, expectedVersion));
  const [row] = await db
    .update(schema.team)
    .set({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.managers !== undefined && { managers: patch.managers }),
      ...(patch.location !== undefined && { location: patch.location }),
      ...(patch.locationId !== undefined && { locationId: patch.locationId }),
      ...(patch.workweek !== undefined && { workweek: normaliseWeek(patch.workweek) }),
      ...(patch.isActive !== undefined && { isActive: patch.isActive }),
      ...(patch.departmentId !== undefined && { departmentId: patch.departmentId }),
      version: sql`${schema.team.version} + 1`,
      updatedBy: ctx.userId,
      updatedOn: new Date(),
    })
    .where(and(...conds))
    .returning();
  if (!row) {
    if (expectedVersion !== undefined) {
      const [cur] = await db
        .select({ version: schema.team.version })
        .from(schema.team)
        .where(and(eq(schema.team.teamId, teamId), eq(schema.team.orgId, ctx.orgId)))
        .limit(1);
      if (cur)
        throw new PreconditionFailedError('VERSION_CONFLICT', { expected: expectedVersion, current: cur.version });
    }
    throw new NotFoundError('TEAM_NOT_FOUND');
  }
  // Emit team changed event. No transaction here — best-effort post-write.
  try {
    await publish(db, ctx, teamChangedDef, { orgId: ctx.orgId, teamId });
  } catch (err) {
    console.error('[authz-sync] publish team.team.changed (update) failed:', err instanceof Error ? err.message : err);
  }
  return row;
}

export interface TeamWithMemberCount extends Team {
  memberCount: number;
}

// Org-chart query: all teams in a department with their member headcount.
export async function listTeamsByDepartment(ctx: AuthContext, departmentId: string): Promise<TeamWithMemberCount[]> {
  requireRole(ctx, 'MANAGER');
  const rows = await db
    .select({
      team: schema.team,
      memberCount: count(schema.user.id),
    })
    .from(schema.team)
    .leftJoin(schema.user, and(eq(schema.user.teamId, schema.team.teamId), eq(schema.user.orgId, ctx.orgId)))
    .where(and(eq(schema.team.departmentId, departmentId), eq(schema.team.orgId, ctx.orgId)))
    .groupBy(schema.team.teamId);
  return rows.map((r) => ({ ...r.team, memberCount: r.memberCount }));
}
