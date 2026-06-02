import { randomUUID } from 'node:crypto'
import { and, eq, count } from 'drizzle-orm'
import { db, schema, type Invitation } from '@avkash/db'
import { type AuthContext, hasRank, ForbiddenError, NotFoundError, ConflictError, BusinessRuleError } from '@avkash/shared'
import { requireRole } from '@avkash/auth'
import { sendEmail } from '@avkash/notifications'
import { PROVISIONAL_INVITE_CAP } from './organization'

const INVITE_TTL_DAYS = 7

// OWNER can invite ADMIN/MANAGER/USER; MANAGER can invite MANAGER/USER. Never OWNER
// (transfer-ownership is a separate sensitive action).
export type InvitableRole = 'ADMIN' | 'MANAGER' | 'USER'

export interface InviteTeammateInput {
  email: string
  role?: InvitableRole
  teamId?: string | null
}

export async function inviteTeammate(ctx: AuthContext, input: InviteTeammateInput): Promise<Invitation> {
  requireRole(ctx, 'MANAGER')
  const role: InvitableRole = input.role ?? 'USER'
  // No privilege escalation: you can only invite at or below your own rank.
  if (!hasRank(ctx.role, role)) throw new ForbiddenError('INVITE_ROLE_TOO_HIGH', { role })

  const email = input.email.trim().toLowerCase()

  const [org] = await db.select().from(schema.organisation).where(eq(schema.organisation.orgId, ctx.orgId)).limit(1)
  if (!org) throw new NotFoundError('ORG_NOT_FOUND')
  if (org.status === 'RESTRICTED') {
    throw new BusinessRuleError('ORG_RESTRICTED')
  }

  // Already a member?
  const [member] = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(and(eq(schema.user.orgId, ctx.orgId), eq(schema.user.email, email)))
    .limit(1)
  if (member) throw new ConflictError('ALREADY_MEMBER')

  // Already invited (pending)?
  const [dupe] = await db
    .select({ id: schema.invitation.id })
    .from(schema.invitation)
    .where(
      and(
        eq(schema.invitation.orgId, ctx.orgId),
        eq(schema.invitation.email, email),
        eq(schema.invitation.status, 'PENDING'),
      ),
    )
    .limit(1)
  if (dupe) throw new ConflictError('INVITATION_EXISTS')

  // Seat cap while PROVISIONAL: members + pending invites < cap. Lifts on VERIFIED.
  if (org.status === 'PROVISIONAL') {
    const [{ members }] = await db.select({ members: count() }).from(schema.user).where(eq(schema.user.orgId, ctx.orgId))
    const [{ pending }] = await db
      .select({ pending: count() })
      .from(schema.invitation)
      .where(and(eq(schema.invitation.orgId, ctx.orgId), eq(schema.invitation.status, 'PENDING')))
    if (Number(members) + Number(pending) >= PROVISIONAL_INVITE_CAP) {
      throw new BusinessRuleError('SEAT_CAP_REACHED', { cap: PROVISIONAL_INVITE_CAP })
    }
  }

  const [invite] = await db
    .insert(schema.invitation)
    .values({
      email,
      orgId: ctx.orgId,
      role,
      teamId: input.teamId ?? null,
      token: randomUUID(),
      status: 'PENDING',
      invitedBy: ctx.userId,
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
    })
    .returning()

  // Notify (console stub). Accept = sign up with this email; the auth create-hook
  // provisions the role/org from this invitation.
  void sendEmail({
    to: email,
    subject: `You're invited to ${org.name ?? 'a team'} on Avkash`,
    text: `You've been invited as ${role}. Sign up with ${email} to join.`,
  })

  return invite
}

export async function listInvitations(ctx: AuthContext): Promise<Invitation[]> {
  requireRole(ctx, 'MANAGER')
  return db
    .select()
    .from(schema.invitation)
    .where(and(eq(schema.invitation.orgId, ctx.orgId), eq(schema.invitation.status, 'PENDING')))
}

export async function revokeInvitation(ctx: AuthContext, invitationId: string): Promise<void> {
  requireRole(ctx, 'MANAGER')
  const revoked = await db
    .update(schema.invitation)
    .set({ status: 'REVOKED', updatedAt: new Date() })
    .where(
      and(
        eq(schema.invitation.id, invitationId),
        eq(schema.invitation.orgId, ctx.orgId),
        eq(schema.invitation.status, 'PENDING'),
      ),
    )
    .returning({ id: schema.invitation.id })
  if (revoked.length === 0) throw new NotFoundError('Pending invitation not found')
}
