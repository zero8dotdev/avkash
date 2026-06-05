import { and, eq, gt, inArray, lte } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { dispatch, resolveOrgAdmins, type NotificationIntent } from '@avkash/notifications';
import { env } from '@avkash/config';

// Org-lifecycle notices go to the org's owner + admins. dispatch failures never break
// the lifecycle action — the outbox records them and the sweep retries.
async function notifyAdmins(
  orgId: string,
  orgName: string,
  event: string,
  dedupeSuffix: string,
  extra: Record<string, unknown>
): Promise<void> {
  const admins = await resolveOrgAdmins(orgId);
  if (!admins.length) return;
  const intents: NotificationIntent[] = admins.map((a) => ({
    event,
    recipient: a,
    dedupeKey: `${event}:${orgId}:${a.userId}:${dedupeSuffix}`,
    payload: { orgName, appUrl: env.APP_URL, ...extra },
  }));
  try {
    await dispatch(intents);
  } catch (err) {
    console.error(`notify ${event} failed:`, err instanceof Error ? err.message : err);
  }
}

// Owners/admins of newly-restricted orgs. dedupe is per (org, admin) — a one-time
// PROVISIONAL → RESTRICTED transition.
export async function notifyOrgRestricted(orgIds: string[]): Promise<void> {
  if (!orgIds.length) return;
  const orgs = await db
    .select({ id: schema.organisation.orgId, name: schema.organisation.name })
    .from(schema.organisation)
    .where(inArray(schema.organisation.orgId, orgIds));
  await Promise.all(
    orgs.map((o) => notifyAdmins(o.id, o.name ?? 'your organization', 'org.restricted', 'restricted', {}))
  );
}

// Provisional orgs whose verify window closes within `withinDays` → nudge owners.
// dedupe is per (org, admin, deadline) so a daily run notifies once per deadline.
export async function notifyExpiringOrgs(now: Date = new Date(), withinDays = 3): Promise<number> {
  const cutoff = new Date(now.getTime() + withinDays * 86_400_000);
  const orgs = await db
    .select({ id: schema.organisation.orgId, name: schema.organisation.name, verifyBy: schema.organisation.verifyBy })
    .from(schema.organisation)
    .where(
      and(
        eq(schema.organisation.status, 'PROVISIONAL'),
        gt(schema.organisation.verifyBy, now),
        lte(schema.organisation.verifyBy, cutoff)
      )
    );
  await Promise.all(
    orgs.map((o) => {
      const verifyBy = o.verifyBy ? o.verifyBy.toISOString().slice(0, 10) : '';
      return notifyAdmins(o.id, o.name ?? 'your organization', 'org.grace.expiring', verifyBy, { verifyBy });
    })
  );
  return orgs.length;
}
