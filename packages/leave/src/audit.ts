import { db, schema } from '@avkash/db';

// Single writer for ActivityLog rows from the leave domain. Leave requests carry a
// userId+teamId; type/policy/system actions may omit them. changedBy is the actor
// ('system' for scheduled jobs).
export async function writeAudit(input: {
  orgId: string;
  tableName: string;
  keyword: string;
  changed: unknown;
  changedBy?: string | null;
  userId?: string | null;
  teamId?: string | null;
}): Promise<void> {
  await db.insert(schema.activityLog).values({
    orgId: input.orgId,
    tableName: input.tableName,
    keyword: input.keyword,
    changedColumns: input.changed,
    userId: input.userId ?? null,
    teamId: input.teamId ?? null,
    changedBy: input.changedBy ?? null,
  });
}
