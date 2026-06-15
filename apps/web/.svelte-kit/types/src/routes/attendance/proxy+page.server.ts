// @ts-nocheck
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { apiFetchData, apiFetch } from '$lib/server/api';

interface AttendanceDay {
  date: string;
  status: string;
  firstIn: string | null;
  lastOut: string | null;
  hours: number;
  overtimeHours: number;
  wfh: boolean;
}

interface Regularization {
  id: string;
  userId: string;
  teamId: string;
  date: string;
  requestedIn: string | null;
  requestedOut: string | null;
  reason: string;
  status: string;
  decisionNote: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  createdAt: string;
}

// Build this week's Monday–Sunday date range
function thisWeekRange(): { from: string; to: string } {
  const now = new Date();
  // Monday of this week
  const dow = now.getDay(); // 0=Sun, 1=Mon...
  const diff = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(monday), to: fmt(sunday) };
}

export const load = async ({ locals, request, url }: Parameters<PageServerLoad>[0]) => {
  const cookie = request.headers.get('cookie') ?? '';
  const user = locals.user!;
  const tab = url.searchParams.get('tab') ?? 'today';

  const today = new Date().toISOString().slice(0, 10);
  const week = thisWeekRange();

  // Fetch this week's attendance and today's attendance in parallel
  // API wraps list responses in { data: [...] } — apiFetchData unwraps to inner type.
  const [weekAttendance, regularizations] = await Promise.all([
    apiFetchData<AttendanceDay[]>(
      `/attendance/me?from=${week.from}&to=${week.to}`,
      cookie
    ),
    apiFetchData<Regularization[]>(
      '/attendance/regularizations',
      cookie
    ),
  ]);

  // Today's attendance is derived from week data
  const todayAttendance =
    (weekAttendance ?? []).find((d) => d.date === today) ?? null;

  // Manager regularization queue: all PENDING
  let pendingRegQueue: Regularization[] = [];
  if (user.role === 'MANAGER' || user.role === 'ADMIN') {
    const pending = await apiFetchData<Regularization[]>(
      '/attendance/regularizations?status=PENDING',
      cookie
    );
    // Filter out the current user's own regs for the queue
    pendingRegQueue = (pending ?? []).filter((r) => r.userId !== user.id);
  }

  return {
    user,
    tab,
    today,
    weekRange: week,
    weekAttendance: weekAttendance ?? [],
    todayAttendance,
    regularizations: regularizations ?? [],
    pendingRegQueue,
  };
};

export const actions = {
  // Check-in
  checkIn: async ({ request }: import('./$types').RequestEvent) => {
    const cookie = request.headers.get('cookie') ?? '';
    const result = await apiFetch('/attendance/check-in', cookie, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (result.error) {
      return fail(result.status || 400, { punchError: result.error });
    }
    return { punchSuccess: true, punchType: 'IN' };
  },

  // Check-out
  checkOut: async ({ request }: import('./$types').RequestEvent) => {
    const cookie = request.headers.get('cookie') ?? '';
    const result = await apiFetch('/attendance/check-out', cookie, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (result.error) {
      return fail(result.status || 400, { punchError: result.error });
    }
    return { punchSuccess: true, punchType: 'OUT' };
  },

  // Request regularization
  regularize: async ({ request, locals }: import('./$types').RequestEvent) => {
    const cookie = request.headers.get('cookie') ?? '';
    const data = await request.formData();

    const date = data.get('date') as string;
    const requestedIn = data.get('requestedIn') as string;
    const requestedOut = data.get('requestedOut') as string;
    const reason = data.get('reason') as string;

    if (!date || !reason) {
      return fail(400, { regError: { code: 'VALIDATION', message: 'Date and reason are required' } });
    }

    // Convert time inputs to ISO datetimes (assuming IST = UTC+5:30)
    const toIST = (dateStr: string, timeStr: string): string | null => {
      if (!timeStr) return null;
      // Create date in IST by appending +05:30
      return `${dateStr}T${timeStr}:00+05:30`;
    };

    const idempotencyKey = `reg-${locals.user!.id}-${date}-${Date.now()}`;

    const result = await apiFetch('/attendance/regularizations', cookie, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        date,
        requestedIn: toIST(date, requestedIn),
        requestedOut: toIST(date, requestedOut),
        reason,
      }),
    });

    if (result.error) {
      return fail(result.status || 400, { regError: result.error });
    }
    return { regSuccess: true };
  },

  // Approve regularization
  approveReg: async ({ request }: import('./$types').RequestEvent) => {
    const cookie = request.headers.get('cookie') ?? '';
    const data = await request.formData();
    const regId = data.get('regId') as string;
    const note = (data.get('note') as string) || undefined;

    const result = await apiFetch(`/attendance/regularizations/${regId}/approve`, cookie, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });

    if (result.error) {
      return fail(result.status || 400, { regDecisionError: result.error });
    }
    return { regDecisionSuccess: true, regAction: 'approved' };
  },

  // Reject regularization
  rejectReg: async ({ request }: import('./$types').RequestEvent) => {
    const cookie = request.headers.get('cookie') ?? '';
    const data = await request.formData();
    const regId = data.get('regId') as string;
    const note = (data.get('note') as string) || undefined;

    const result = await apiFetch(`/attendance/regularizations/${regId}/reject`, cookie, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });

    if (result.error) {
      return fail(result.status || 400, { regDecisionError: result.error });
    }
    return { regDecisionSuccess: true, regAction: 'rejected' };
  },
};
;null as any as Actions;