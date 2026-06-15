import { eq } from 'drizzle-orm';
import { db, schema } from '@avkash/db';

// The effective timezone for a user, resolved down the cascade (the null-means-inherit
// pattern): user's location → team's location → team's legacy timeZone string → UTC.
// All shift/window/"today" math runs in this zone — never server-local.

// Pure pick: first non-empty candidate, else UTC. Unit-tested.
export function pickTimezone(...candidates: Array<string | null | undefined>): string {
  return candidates.find((c): c is string => !!c && c.length > 0) ?? 'UTC';
}

export async function effectiveTimezone(userId: string): Promise<string> {
  const [u] = await db
    .select({ locationId: schema.user.locationId, teamId: schema.user.teamId })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  let userTz: string | null = null;
  if (u?.locationId) {
    const [l] = await db
      .select({ tz: schema.location.timezone })
      .from(schema.location)
      .where(eq(schema.location.id, u.locationId))
      .limit(1);
    userTz = l?.tz ?? null;
  }

  let teamTz: string | null = null;
  let teamLegacyTz: string | null = null;
  if (!userTz && u?.teamId) {
    const [t] = await db
      .select({ locationId: schema.team.locationId, timeZone: schema.team.timeZone })
      .from(schema.team)
      .where(eq(schema.team.teamId, u.teamId))
      .limit(1);
    teamLegacyTz = t?.timeZone ?? null;
    if (t?.locationId) {
      const [l] = await db
        .select({ tz: schema.location.timezone })
        .from(schema.location)
        .where(eq(schema.location.id, t.locationId))
        .limit(1);
      teamTz = l?.tz ?? null;
    }
  }

  return pickTimezone(userTz, teamTz, teamLegacyTz);
}
