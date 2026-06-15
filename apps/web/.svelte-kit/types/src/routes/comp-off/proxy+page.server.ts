// @ts-nocheck
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { apiFetchData, apiFetch } from '$lib/server/api';

export interface CompOff {
  id: string;
  userId: string;
  leaveTypeId: string;
  workedOn: string;
  days: string;
  status: string;
  expiresOn: string | null;
  approvedBy: string | null;
  createdAt: string;
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

interface LeaveType {
  leaveTypeId: string;
  name: string;
  kind: string;
  color: string | null;
  isPaid: boolean;
  isActive: boolean;
}

export const load = async ({ locals, request, url }: Parameters<PageServerLoad>[0]) => {
  const cookie = request.headers.get('cookie') ?? '';
  const user = locals.user!;
  const tab = url.searchParams.get('tab') ?? 'my';

  const [myCompOffs, leaveTypes, balances] = await Promise.all([
    apiFetchData<CompOff[]>('/comp-off', cookie),
    apiFetchData<LeaveType[]>('/leave-types', cookie),
    apiFetchData<LeaveBalance[]>(`/balances/${user.id}`, cookie),
  ]);

  // For MANAGER+: fetch all pending comp-offs (includes team members)
  let pendingQueue: CompOff[] = [];
  if (user.role === 'MANAGER' || user.role === 'ADMIN') {
    const all = await apiFetchData<CompOff[]>('/comp-off', cookie);
    pendingQueue = (all ?? []).filter((c) => c.status === 'PENDING' && c.userId !== user.id);
  }

  // Find the comp-off leave type for balance display
  const compOffType = (leaveTypes ?? []).find((lt) => lt.kind === 'COMP_OFF') ?? null;
  const compOffBalance = compOffType
    ? (balances ?? []).find((b) => b.leaveTypeId === compOffType.leaveTypeId) ?? null
    : null;

  return {
    user,
    tab,
    myCompOffs: myCompOffs ?? [],
    leaveTypes: leaveTypes ?? [],
    compOffType,
    compOffBalance,
    pendingQueue,
  };
};

export const actions = {
  // Request a comp-off (earn)
  earn: async ({ request, locals }: import('./$types').RequestEvent) => {
    const cookie = request.headers.get('cookie') ?? '';
    const data = await request.formData();

    const workedOn = data.get('workedOn') as string;
    const leaveTypeId = data.get('leaveTypeId') as string;
    const days = parseFloat((data.get('days') as string) || '1');

    if (!workedOn || !leaveTypeId) {
      return fail(400, { earnError: { code: 'VALIDATION', message: 'Worked date and leave type are required' } });
    }

    const idempotencyKey = `comp-off-earn-${locals.user!.id}-${workedOn}-${Date.now()}`;

    const result = await apiFetch('/comp-off', cookie, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ workedOn, leaveTypeId, days }),
    });

    if (result.error) {
      return fail(result.status || 400, { earnError: result.error });
    }
    return { earnSuccess: true };
  },

  // Approve a comp-off (MANAGER+)
  approve: async ({ request }: import('./$types').RequestEvent) => {
    const cookie = request.headers.get('cookie') ?? '';
    const data = await request.formData();
    const compOffId = data.get('compOffId') as string;

    if (!compOffId) {
      return fail(400, { decisionError: { code: 'VALIDATION', message: 'compOffId required' } });
    }

    const result = await apiFetch(`/comp-off/${compOffId}/approve`, cookie, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    if (result.error) {
      return fail(result.status || 400, { decisionError: result.error });
    }
    return { decisionSuccess: true, action: 'approved', approved: result.data };
  },

  // Reject a comp-off (MANAGER+)
  reject: async ({ request }: import('./$types').RequestEvent) => {
    const cookie = request.headers.get('cookie') ?? '';
    const data = await request.formData();
    const compOffId = data.get('compOffId') as string;

    if (!compOffId) {
      return fail(400, { decisionError: { code: 'VALIDATION', message: 'compOffId required' } });
    }

    const result = await apiFetch(`/comp-off/${compOffId}/reject`, cookie, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    if (result.error) {
      return fail(result.status || 400, { decisionError: result.error });
    }
    return { decisionSuccess: true, action: 'rejected' };
  },

  // Request encashment against EL balance
  requestEncashment: async ({ request, locals }: import('./$types').RequestEvent) => {
    const cookie = request.headers.get('cookie') ?? '';
    const data = await request.formData();

    const leaveTypeId = data.get('leaveTypeId') as string;
    const days = parseFloat((data.get('days') as string) || '0');

    if (!leaveTypeId || !days || days <= 0) {
      return fail(400, { encashError: { code: 'VALIDATION', message: 'Leave type and valid days are required' } });
    }

    const idempotencyKey = `encash-${locals.user!.id}-${leaveTypeId}-${Date.now()}`;

    const result = await apiFetch('/encashments', cookie, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ leaveTypeId, days }),
    });

    if (result.error) {
      return fail(result.status || 400, { encashError: result.error });
    }
    return { encashSuccess: true };
  },
};
;null as any as Actions;