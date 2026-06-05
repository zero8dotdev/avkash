import { and, eq, sql } from 'drizzle-orm';
import { db, schema, type Team } from '@avkash/db';
import { type AuthContext, ValidationError, NotFoundError, PreconditionFailedError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

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
    })
    .returning();
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
  return row;
}
