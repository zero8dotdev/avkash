import { and, desc, eq } from 'drizzle-orm';
import { db, schema, type AttendanceRegularization } from '@avkash/db';
import { type AuthContext, NotFoundError, ForbiddenError, ConflictError, ValidationError } from '@avkash/shared';
import { dispatch, resolveUsers } from '@avkash/notifications';

// Local team-manager check (OWNER/ADMIN, or a listed manager of the team). The leave
// engine's canApprove adds delegation; we keep attendance self-contained here and note
// delegation as a future extension.
async function canApproveTeam(ctx: AuthContext, teamId: string | null): Promise<boolean> {
  if (ctx.role === 'OWNER' || ctx.role === 'ADMIN') return true;
  if (!teamId) return false;
  const [t] = await db
    .select({ managers: schema.team.managers })
    .from(schema.team)
    .where(eq(schema.team.teamId, teamId))
    .limit(1);
  return !!t && (t.managers ?? []).includes(ctx.userId ?? '');
}

// best-effort: a regularization notification never blocks the request/decision.
async function notify(
  orgId: string,
  userId: string,
  event: string,
  dedupeKey: string,
  payload: Record<string, unknown>
) {
  const [recipient] = await resolveUsers(orgId, [userId]);
  if (!recipient) return;
  try {
    await dispatch([{ event, recipient, dedupeKey, payload: { name: recipient.name, ...payload } }]);
  } catch (err) {
    console.error(`notify ${event} failed:`, err instanceof Error ? err.message : err);
  }
}

export interface RequestRegularizationInput {
  date: string;
  requestedIn?: string | null; // ISO
  requestedOut?: string | null;
  reason: string;
}

// An employee asks to fix their own day. Must propose at least one punch.
export async function requestRegularization(
  ctx: AuthContext,
  input: RequestRegularizationInput
): Promise<AttendanceRegularization> {
  if (!input.requestedIn && !input.requestedOut) throw new ValidationError('REGULARIZATION_EMPTY');
  const [u] = await db
    .select({ teamId: schema.user.teamId })
    .from(schema.user)
    .where(eq(schema.user.id, ctx.userId ?? ''))
    .limit(1);
  const [row] = await db
    .insert(schema.attendanceRegularization)
    .values({
      orgId: ctx.orgId,
      userId: ctx.userId ?? '',
      teamId: u?.teamId ?? null,
      date: input.date,
      requestedIn: input.requestedIn ? new Date(input.requestedIn) : null,
      requestedOut: input.requestedOut ? new Date(input.requestedOut) : null,
      reason: input.reason,
      createdBy: ctx.userId,
    })
    .returning();

  // Notify the approvers (team managers).
  if (u?.teamId) {
    const [team] = await db
      .select({ managers: schema.team.managers })
      .from(schema.team)
      .where(eq(schema.team.teamId, u.teamId))
      .limit(1);
    const [requester] = await resolveUsers(ctx.orgId, [ctx.userId ?? '']);
    const managerIds = (team?.managers ?? []).filter((id): id is string => !!id && id !== ctx.userId);
    if (managerIds.length) {
      const recipients = await resolveUsers(ctx.orgId, managerIds);
      try {
        await dispatch(
          recipients.map((r) => ({
            event: 'attendance.regularization.requested',
            recipient: r,
            dedupeKey: `attendance.regularization.requested:${row.id}:${r.userId}`,
            payload: { requester: requester?.name ?? 'A teammate', date: input.date, reason: input.reason },
          }))
        );
      } catch (err) {
        console.error('notify regularization.requested failed:', err instanceof Error ? err.message : err);
      }
    }
  }
  return row;
}

// Owners/admins see all; everyone else sees their own + any team they can approve for.
export async function listRegularizations(
  ctx: AuthContext,
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
): Promise<AttendanceRegularization[]> {
  const conds = [eq(schema.attendanceRegularization.orgId, ctx.orgId)];
  if (status) conds.push(eq(schema.attendanceRegularization.status, status));
  const rows = await db
    .select()
    .from(schema.attendanceRegularization)
    .where(and(...conds))
    .orderBy(desc(schema.attendanceRegularization.createdAt));
  if (ctx.role === 'OWNER' || ctx.role === 'ADMIN') return rows;
  // Keep one's own always; keep others only where the viewer manages the team.
  const out: AttendanceRegularization[] = [];
  const decided = new Map<string, boolean>();
  for (const r of rows) {
    if (r.userId === ctx.userId) {
      out.push(r);
      continue;
    }
    const key = r.teamId ?? '';
    if (!decided.has(key)) decided.set(key, await canApproveTeam(ctx, r.teamId));
    if (decided.get(key)) out.push(r);
  }
  return out;
}

async function decide(
  ctx: AuthContext,
  id: string,
  status: 'APPROVED' | 'REJECTED',
  note: string | undefined
): Promise<AttendanceRegularization> {
  const [reg] = await db
    .select()
    .from(schema.attendanceRegularization)
    .where(and(eq(schema.attendanceRegularization.id, id), eq(schema.attendanceRegularization.orgId, ctx.orgId)))
    .limit(1);
  if (!reg) throw new NotFoundError('REGULARIZATION_NOT_FOUND');
  if (!(await canApproveTeam(ctx, reg.teamId))) throw new ForbiddenError('FORBIDDEN');
  if (reg.status !== 'PENDING') throw new ConflictError('REGULARIZATION_NOT_PENDING');

  const [updated] = await db
    .update(schema.attendanceRegularization)
    .set({ status, decisionNote: note ?? null, decidedBy: ctx.userId, decidedAt: new Date() })
    .where(eq(schema.attendanceRegularization.id, id))
    .returning();

  // On approval, write the proposed punches as REGULARIZATION-source — the resolver picks them up.
  if (status === 'APPROVED') {
    const punches: (typeof schema.attendancePunch.$inferInsert)[] = [];
    if (reg.requestedIn)
      punches.push({
        orgId: ctx.orgId,
        userId: reg.userId,
        ts: reg.requestedIn,
        type: 'IN',
        source: 'REGULARIZATION',
        createdBy: `reg:${id}`,
      });
    if (reg.requestedOut)
      punches.push({
        orgId: ctx.orgId,
        userId: reg.userId,
        ts: reg.requestedOut,
        type: 'OUT',
        source: 'REGULARIZATION',
        createdBy: `reg:${id}`,
      });
    if (punches.length) await db.insert(schema.attendancePunch).values(punches);
  }

  await notify(
    ctx.orgId,
    reg.userId,
    'attendance.regularization.resolved',
    `attendance.regularization.resolved:${id}`,
    {
      date: reg.date,
      decision: status === 'APPROVED' ? 'approved' : 'declined',
      note: note ?? '',
    }
  );
  return updated;
}

export const approveRegularization = (ctx: AuthContext, id: string, note?: string) => decide(ctx, id, 'APPROVED', note);
export const rejectRegularization = (ctx: AuthContext, id: string, note?: string) => decide(ctx, id, 'REJECTED', note);
