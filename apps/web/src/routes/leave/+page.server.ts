import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { apiFetchData, apiFetch } from '$lib/server/api';

interface LeaveType {
  leaveTypeId: string;
  name: string;
  color: string | null;
  kind: string;
  isPaid: boolean;
  isActive: boolean;
}

interface LeaveRequest {
  leaveId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  duration: string;
  halfDayPart: string;
  isApproved: string;
  workingDays: string;
  reason: string | null;
  userId: string;
  createdOn: string;
}

interface LeaveBalance {
  leaveTypeId: string;
  year: number;
  entitlement: number;
  balance: number;
  available: number;
  taken: number;
  planned: number;
}

export const load: PageServerLoad = async ({ locals, request, url }) => {
  const cookie = request.headers.get('cookie') ?? '';
  const user = locals.user!;
  const tab = url.searchParams.get('tab') ?? 'my';

  // API wraps list responses in { data: [...] } — apiFetchData unwraps the outer .data,
  // so T should be the *inner* type (the array/object), not { data: T }.
  const [leaveTypes, myLeaves, balances] = await Promise.all([
    apiFetchData<LeaveType[]>('/leave-types', cookie),
    apiFetchData<LeaveRequest[]>('/leaves', cookie),
    apiFetchData<LeaveBalance[]>(`/balances/${user.id}`, cookie),
  ]);

  // Manager approval queue: pending leaves (will include team member leaves if MANAGER+)
  let pendingApprovals: LeaveRequest[] = [];
  if (user.role === 'MANAGER' || user.role === 'ADMIN') {
    const pending = await apiFetchData<LeaveRequest[]>(
      '/leaves?status=PENDING',
      cookie
    );
    // Filter out the current user's own leaves for the approval queue
    pendingApprovals = (pending ?? []).filter((l) => l.userId !== user.id);
  }

  return {
    user,
    leaveTypes: leaveTypes ?? [],
    myLeaves: myLeaves ?? [],
    balances: balances ?? [],
    pendingApprovals,
    tab,
  };
};

export const actions: Actions = {
  // Apply for leave
  apply: async ({ request, locals }) => {
    const cookie = request.headers.get('cookie') ?? '';
    const data = await request.formData();

    const leaveTypeId = data.get('leaveTypeId') as string;
    const startDate = data.get('startDate') as string;
    const endDate = data.get('endDate') as string;
    const duration = (data.get('duration') as string) || 'FULL_DAY';
    const halfDayPart = (data.get('halfDayPart') as string) || 'NONE';
    const reason = (data.get('reason') as string) || undefined;

    if (!leaveTypeId || !startDate || !endDate) {
      return fail(400, { applyError: { code: 'VALIDATION', message: 'Required fields missing' } });
    }

    const idempotencyKey = `leave-apply-${locals.user!.id}-${startDate}-${endDate}-${Date.now()}`;

    const result = await apiFetch('/leaves', cookie, {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        leaveTypeId,
        startDate,
        endDate,
        duration,
        halfDayPart: halfDayPart === 'NONE' ? undefined : halfDayPart,
        reason,
      }),
    });

    if (result.error) {
      return fail(result.status || 400, { applyError: result.error });
    }
    return { applySuccess: true, applied: result.data };
  },

  // Approve a leave
  approve: async ({ request }) => {
    const cookie = request.headers.get('cookie') ?? '';
    const data = await request.formData();
    const leaveId = data.get('leaveId') as string;
    const comment = (data.get('comment') as string) || undefined;

    if (!leaveId) {
      return fail(400, { decisionError: { code: 'VALIDATION', message: 'leaveId required' } });
    }

    const result = await apiFetch(`/leaves/${leaveId}/approve`, cookie, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });

    if (result.error) {
      return fail(result.status || 400, { decisionError: result.error });
    }
    return { decisionSuccess: true, action: 'approved' };
  },

  // Reject a leave
  reject: async ({ request }) => {
    const cookie = request.headers.get('cookie') ?? '';
    const data = await request.formData();
    const leaveId = data.get('leaveId') as string;
    const comment = (data.get('comment') as string) || undefined;

    if (!leaveId) {
      return fail(400, { decisionError: { code: 'VALIDATION', message: 'leaveId required' } });
    }

    const result = await apiFetch(`/leaves/${leaveId}/reject`, cookie, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });

    if (result.error) {
      return fail(result.status || 400, { decisionError: result.error });
    }
    return { decisionSuccess: true, action: 'rejected' };
  },
};
