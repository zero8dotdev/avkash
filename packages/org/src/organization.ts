import { randomUUID } from 'node:crypto'
import { and, eq, lt } from 'drizzle-orm'
import { db, schema, type Organisation, type Invitation } from '@avkash/db'

export const GRACE_DAYS = 14
export const PROVISIONAL_INVITE_CAP = 10

export interface CreateOrganizationInput {
  orgName: string
  ownerEmail: string
}

// Bootstrap an organisation: PROVISIONAL org (14-day verify window) + a
// self-issued OWNER invitation. The founder then signs up and the auth
// create-hook provisions them as OWNER.
export async function createOrganization(
  input: CreateOrganizationInput,
): Promise<{ org: Organisation; invite: Invitation }> {
  const email = input.ownerEmail.trim().toLowerCase()
  const verifyBy = new Date(Date.now() + GRACE_DAYS * 24 * 60 * 60 * 1000)
  return db.transaction(async (tx) => {
    const [org] = await tx
      .insert(schema.organisation)
      .values({ name: input.orgName, status: 'PROVISIONAL', verifyBy })
      .returning()
    const [invite] = await tx
      .insert(schema.invitation)
      .values({
        email,
        orgId: org.orgId,
        role: 'OWNER',
        token: randomUUID(),
        status: 'PENDING',
        expiresAt: verifyBy,
      })
      .returning()
    return { org, invite }
  })
}

// Grace sweep: provisional orgs past their verify deadline become RESTRICTED.
// Triggered by a scheduler (cron → POST /internal/grace-sweep, or @avkash/jobs).
export async function restrictExpiredOrgs(now = new Date()): Promise<number> {
  const rows = await db
    .update(schema.organisation)
    .set({ status: 'RESTRICTED', updatedOn: now })
    .where(and(eq(schema.organisation.status, 'PROVISIONAL'), lt(schema.organisation.verifyBy, now)))
    .returning({ id: schema.organisation.orgId })
  return rows.length
}

// Capability: a RESTRICTED org (grace lapsed) cannot invite. PROVISIONAL and
// VERIFIED can — the per-seat cap is enforced by the invite endpoint.
export function canInvite(org: Pick<Organisation, 'status'>): boolean {
  return org.status !== 'RESTRICTED'
}
