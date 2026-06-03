import { eq } from 'drizzle-orm';
import { db, schema, type Organisation } from '@avkash/db';
import { type AuthContext, NotFoundError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

// The countries an org operates in. Drives which holiday set applies to its teams
// (working-days falls back to the org's first location when a team has none).
export async function setOrgLocations(ctx: AuthContext, locations: string[]): Promise<Organisation> {
  requireRole(ctx, 'ADMIN');
  const [row] = await db
    .update(schema.organisation)
    .set({ location: locations })
    .where(eq(schema.organisation.orgId, ctx.orgId))
    .returning();
  if (!row) throw new NotFoundError('ORG_NOT_FOUND');
  return row;
}
