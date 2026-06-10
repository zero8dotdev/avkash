import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { apiFetchData, apiFetch } from '$lib/server/api';

interface Transfer {
  id: string;
  userId: string;
  fromLocationId: string;
  toLocationId: string;
  fromDepartmentId: string | null;
  toDepartmentId: string | null;
  type: 'TEMPORARY' | 'PERMANENT';
  startDate: string;
  endDate: string | null;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  authorizedBy: string | null;
  notes: string | null;
  letterUrl: string | null;
  version: number | null;
  createdAt: string;
  updatedAt: string;
}

interface Location {
  id: string;
  name: string;
  isActive: boolean;
}

interface Department {
  id: string;
  name: string;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: string | null;
}

export const load: PageServerLoad = async ({ locals, request, url }) => {
  const cookie = request.headers.get('cookie') ?? '';
  const user = locals.user!;
  const tab = url.searchParams.get('tab') ?? 'list';

  const isManager = user.role === 'MANAGER' || user.role === 'ADMIN' || user.role === 'OWNER';

  const [transfersResult, locationsResult, departmentsResult] = await Promise.all([
    apiFetchData<Transfer[]>('/transfers', cookie),
    apiFetchData<Location[]>('/locations', cookie),
    apiFetchData<Department[]>('/departments', cookie),
  ]);

  // For ADMIN/MANAGER, also fetch users for the request form target selector
  let users: UserRow[] = [];
  if (isManager) {
    users = (await apiFetchData<UserRow[]>('/users', cookie)) ?? [];
  }

  return {
    user,
    transfers: transfersResult ?? [],
    locations: locationsResult ?? [],
    departments: departmentsResult ?? [],
    users,
    tab,
    isManager,
  };
};

export const actions: Actions = {
  // Initiate a transfer (ADMIN+)
  request: async ({ request, locals }) => {
    const cookie = request.headers.get('cookie') ?? '';
    const user = locals.user!;

    if (user.role !== 'ADMIN' && user.role !== 'OWNER' && user.role !== 'MANAGER') {
      return fail(403, { requestError: { code: 'FORBIDDEN', message: 'Only MANAGER+ can initiate transfers' } });
    }

    const data = await request.formData();
    const userId = data.get('userId') as string;
    const fromLocationId = data.get('fromLocationId') as string;
    const toLocationId = data.get('toLocationId') as string;
    const type = data.get('type') as string;
    const startDate = data.get('startDate') as string;
    const endDate = (data.get('endDate') as string) || null;
    const notes = (data.get('notes') as string) || null;
    const fromDepartmentId = (data.get('fromDepartmentId') as string) || null;
    const toDepartmentId = (data.get('toDepartmentId') as string) || null;

    if (!userId || !fromLocationId || !toLocationId || !type || !startDate) {
      return fail(400, {
        requestError: { code: 'VALIDATION', message: 'User, from/to locations, type, and start date are required' },
      });
    }

    const idempotencyKey = `transfer-${user.id}-${userId}-${startDate}-${Date.now()}`;

    const result = await apiFetch('/transfers', cookie, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        userId,
        fromLocationId,
        toLocationId,
        fromDepartmentId: fromDepartmentId || undefined,
        toDepartmentId: toDepartmentId || undefined,
        type,
        startDate,
        endDate: endDate || undefined,
        notes: notes || undefined,
      }),
    });

    if (result.error) {
      return fail(result.status || 400, { requestError: result.error });
    }
    return { requestSuccess: true, transferId: (result.data as Transfer)?.id };
  },

  // Approve a transfer (ADMIN+)
  // NOTE: Approval triggers fast-lane FGA revoke + relay propagation.
  // The old manager will lose /employees visibility after syncOrgTuples runs.
  approve: async ({ request, locals }) => {
    const cookie = request.headers.get('cookie') ?? '';
    const user = locals.user!;

    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return fail(403, { approveError: { code: 'FORBIDDEN', message: 'Only ADMIN can approve transfers' } });
    }

    const data = await request.formData();
    const transferId = data.get('transferId') as string;
    if (!transferId) return fail(400, { approveError: { code: 'VALIDATION', message: 'transferId required' } });

    const result = await apiFetch(`/transfers/${transferId}/approve`, cookie, { method: 'POST' });
    if (result.error) {
      return fail(result.status || 400, { approveError: result.error });
    }
    return { approveSuccess: true, approvedTransferId: transferId };
  },

  // Cancel a transfer
  cancel: async ({ request, locals }) => {
    const cookie = request.headers.get('cookie') ?? '';
    const user = locals.user!;

    if (user.role !== 'ADMIN' && user.role !== 'OWNER') {
      return fail(403, { cancelError: { code: 'FORBIDDEN', message: 'Only ADMIN can cancel transfers' } });
    }

    const data = await request.formData();
    const transferId = data.get('transferId') as string;
    if (!transferId) return fail(400, { cancelError: { code: 'VALIDATION', message: 'transferId required' } });

    const result = await apiFetch(`/transfers/${transferId}/cancel`, cookie, { method: 'POST' });
    if (result.error) {
      return fail(result.status || 400, { cancelError: result.error });
    }
    return { cancelSuccess: true };
  },
};
