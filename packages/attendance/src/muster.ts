import { and, eq } from 'drizzle-orm';
import { db, schema } from '@avkash/db';
import { type AuthContext } from '@avkash/shared';
import { requireRole } from '@avkash/auth';
import { listAttendance, type DayAttendance } from './attendance';
import { summarize, type AttendanceSummary } from './summary';

export interface MusterMember {
  userId: string;
  name: string | null;
  days: DayAttendance[];
  summary: AttendanceSummary;
}

// The muster register: each team member's resolved day grid + their summary, over
// [from,to]. MANAGER+ (org-scoped). Read-only rollup of the resolver — no payroll, no
// money; the payroll feed is a separate, later build (plan 25).
export async function muster(ctx: AuthContext, teamId: string, from: string, to: string): Promise<MusterMember[]> {
  requireRole(ctx, 'MANAGER');
  const members = await db
    .select({ id: schema.user.id, name: schema.user.name })
    .from(schema.user)
    .where(and(eq(schema.user.orgId, ctx.orgId), eq(schema.user.teamId, teamId)));
  return Promise.all(
    members.map(async (m) => {
      const days = await listAttendance(ctx, m.id, from, to);
      return { userId: m.id, name: m.name, days, summary: summarize(days) };
    })
  );
}
