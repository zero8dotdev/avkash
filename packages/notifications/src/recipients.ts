import { and, eq, inArray } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import type { NotificationRecipient } from './dispatch';

// A resolved user: a notification recipient plus their display name (for payloads).
// Convenience for callers that have user ids and need contact + locale. notifications
// already owns @avkash/db; this maps ids → contact info without any domain knowledge.
export interface ResolvedUser extends NotificationRecipient {
  userId: string;
  name: string | null;
}

export async function resolveUsers(orgId: string, userIds: Array<string | null | undefined>): Promise<ResolvedUser[]> {
  const unique = [...new Set(userIds.filter((id): id is string => !!id))];
  if (!unique.length) return [];
  const rows = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      language: schema.user.language,
      phone: schema.user.phoneNumber,
      phoneVerified: schema.user.phoneNumberVerified,
    })
    .from(schema.user)
    .where(inArray(schema.user.id, unique));
  return rows.map((u) => ({
    orgId,
    userId: u.id,
    name: u.name,
    email: u.email,
    phone: u.phoneVerified ? u.phone : null,
    locale: u.language,
  }));
}

// The org's owner + admins — the audience for org-lifecycle notices.
export async function resolveOrgAdmins(orgId: string): Promise<ResolvedUser[]> {
  const rows = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(and(eq(schema.user.orgId, orgId), inArray(schema.user.role, ['OWNER', 'ADMIN'])));
  return resolveUsers(
    orgId,
    rows.map((r) => r.id)
  );
}
