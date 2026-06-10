import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { phoneNumber } from 'better-auth/plugins';
import { APIError } from 'better-auth/api';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { sendEmail, sendSMS, dispatch, resolveUsers } from '@avkash/notifications';
import { env } from '@avkash/config';

// ── Invite-only gate (shared by every login method) ──────────────────────────
async function pendingInvite(email: string) {
  const [invite] = await db
    .select()
    .from(schema.invitation)
    .where(and(eq(schema.invitation.email, email), eq(schema.invitation.status, 'PENDING')))
    .limit(1);
  return invite ?? null;
}

// hd enforcement: if the org declares verified domains, the user's email domain
// MUST be one of them (covers Google Workspace + any method). No domains → any
// invited email is allowed.
async function domainAllowed(orgId: string, email: string) {
  const domain = email.split('@')[1] ?? '';
  const rows = await db
    .select({ domain: schema.orgDomain.domain })
    .from(schema.orgDomain)
    .where(and(eq(schema.orgDomain.orgId, orgId), eq(schema.orgDomain.verified, true)));
  return rows.length === 0 || rows.some((r) => r.domain === domain);
}

const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  // The web app lives on a different origin (:3000) than the API (:3001). Better
  // Auth trusts only its own baseURL by default, so browser sign-ins arrive with
  // an "untrusted" Origin header and die with "Invalid origin" — list the app.
  trustedOrigins: [env.APP_URL],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  // Postgres owns IDs (gen_random_uuid) so they line up with the domain's uuid FKs.
  advanced: { database: { generateId: false } },

  // 1) Email + password — verified email required. Invite-only is enforced by the
  // user.create.before hook below (NOT disableSignUp, which would also block
  // invited users and the org-founder from ever completing signup).
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({ to: user.email, subject: 'Reset your Avkash password', text: `Reset link: ${url}` });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({ to: user.email, subject: 'Verify your Avkash email', text: `Verify link: ${url}` });
    },
  },

  // 3) Google Workspace — hd enforced server-side in the create hook below.
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID as string,
          clientSecret: env.GOOGLE_CLIENT_SECRET as string,
          accessType: 'offline',
          prompt: 'select_account',
        },
      }
    : {},

  // 2) Phone + OTP.
  plugins: [
    phoneNumber({
      requireVerification: true,
      sendOTP: ({ phoneNumber: phone, code }) => {
        void sendSMS(phone, `Your Avkash verification code is ${code}`);
      },
    }),
  ],

  // Domain fields surfaced on session.user (managed by us, not user-writable).
  user: {
    additionalFields: {
      role: { type: 'string', required: false, input: false },
      orgId: { type: 'string', required: false, input: false },
      teamId: { type: 'string', required: false, input: false },
    },
  },

  // ── The single gate: invite-only + hd-domain + provisioning, for ALL methods ──
  databaseHooks: {
    user: {
      create: {
        before: async (newUser) => {
          const email = (newUser as { email: string }).email;
          const invite = await pendingInvite(email);
          if (!invite) {
            throw new APIError('FORBIDDEN', { message: 'No pending invitation for this email' });
          }
          if (!(await domainAllowed(invite.orgId, email))) {
            throw new APIError('FORBIDDEN', { message: 'Email domain not allowed for this organization' });
          }
          // Provision org membership from the invitation.
          return {
            data: {
              ...newUser,
              role: invite.role,
              orgId: invite.orgId,
              teamId: invite.teamId ?? null,
            },
          };
        },
        after: async (createdUser) => {
          const cu = createdUser as { email: string; name?: string };
          const email = cu.email;
          // Capture the inviter before flipping the invite to ACCEPTED.
          const [invite] = await db
            .select({ invitedBy: schema.invitation.invitedBy, orgId: schema.invitation.orgId })
            .from(schema.invitation)
            .where(and(eq(schema.invitation.email, email), eq(schema.invitation.status, 'PENDING')))
            .limit(1);
          await db
            .update(schema.invitation)
            .set({ status: 'ACCEPTED', updatedAt: new Date() })
            .where(and(eq(schema.invitation.email, email), eq(schema.invitation.status, 'PENDING')));
          // Tell the inviter their invite was accepted (best-effort).
          if (invite?.invitedBy) {
            const [org] = await db
              .select({ name: schema.organisation.name })
              .from(schema.organisation)
              .where(eq(schema.organisation.orgId, invite.orgId))
              .limit(1);
            const [recipient] = await resolveUsers(invite.orgId, [invite.invitedBy]);
            if (recipient) {
              try {
                await dispatch([
                  {
                    event: 'org.invitation.accepted',
                    recipient,
                    dedupeKey: `org.invitation.accepted:${invite.orgId}:${email}`,
                    payload: { newMember: cu.name ?? email, email, orgName: org?.name ?? 'your organization' },
                  },
                ]);
              } catch (err) {
                console.error('notify invitation.accepted failed:', err instanceof Error ? err.message : err);
              }
            }
          }
        },
      },
    },
  },
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
