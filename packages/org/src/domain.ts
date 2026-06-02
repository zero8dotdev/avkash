import { randomUUID } from 'node:crypto';
import { resolveTxt } from 'node:dns/promises';
import { and, eq } from 'drizzle-orm';
import { db, schema, type OrgDomain } from '@avkash/db';
import { type AuthContext, NotFoundError } from '@avkash/shared';
import { requireRole } from '@avkash/auth';

const TXT_PREFIX = 'avkash-verify=';

// Owner adds a domain → we return the TXT record they must publish in DNS.
export async function addOrgDomain(
  ctx: AuthContext,
  domainName: string
): Promise<{ domain: OrgDomain; txtRecord: string }> {
  requireRole(ctx, 'OWNER');
  const token = randomUUID();
  const [row] = await db
    .insert(schema.orgDomain)
    .values({
      orgId: ctx.orgId,
      domain: domainName.trim().toLowerCase(),
      verified: false,
      verificationToken: token,
    })
    .returning();
  return { domain: row, txtRecord: `${TXT_PREFIX}${token}` };
}

// Owner triggers verification → we resolve the domain's TXT records and look for
// our token. On success the domain is verified and the org is promoted to VERIFIED
// (recovers a RESTRICTED org too).
export async function verifyOrgDomain(ctx: AuthContext, domainId: string): Promise<{ verified: boolean }> {
  requireRole(ctx, 'OWNER');
  const [row] = await db
    .select()
    .from(schema.orgDomain)
    .where(and(eq(schema.orgDomain.id, domainId), eq(schema.orgDomain.orgId, ctx.orgId)))
    .limit(1);
  if (!row) throw new NotFoundError('DOMAIN_NOT_FOUND');

  const expected = `${TXT_PREFIX}${row.verificationToken}`;
  let found = false;
  try {
    const records = await resolveTxt(row.domain); // string[][] — TXT values may be chunked
    found = records.some((chunks) => chunks.join('').trim() === expected);
  } catch {
    found = false; // NXDOMAIN / no TXT / lookup failure
  }

  const now = new Date();
  await db
    .update(schema.orgDomain)
    .set({ verified: found, lastCheckedAt: now })
    .where(eq(schema.orgDomain.id, domainId));
  if (found) {
    await db
      .update(schema.organisation)
      .set({ status: 'VERIFIED', verifiedAt: now, updatedOn: now })
      .where(eq(schema.organisation.orgId, ctx.orgId));
  }
  return { verified: found };
}
