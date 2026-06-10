import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { apiFetchData, apiFetch } from '$lib/server/api';

interface LeaveBlackout {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  leaveTypeId: string | null;
  locationId: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Location {
  id: string;
  name: string;
  timezone: string;
  isActive: boolean;
}

interface LeaveType {
  leaveTypeId: string;
  name: string;
  kind: string;
  isActive: boolean;
}

export const load: PageServerLoad = async ({ request, parent }) => {
  const { notAuthorized } = await parent();
  if (notAuthorized) return { blackouts: [], locations: [], leaveTypes: [] };

  const cookie = request.headers.get('cookie') ?? '';

  const [blackouts, locations, leaveTypes] = await Promise.all([
    apiFetchData<LeaveBlackout[]>('/blackouts', cookie),
    apiFetchData<Location[]>('/locations', cookie),
    apiFetchData<LeaveType[]>('/leave-types', cookie),
  ]);

  return {
    blackouts: blackouts ?? [],
    locations: locations ?? [],
    leaveTypes: leaveTypes ?? [],
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const cookie = request.headers.get('cookie') ?? '';
    const data = await request.formData();

    const name = (data.get('name') as string)?.trim();
    const startDate = data.get('startDate') as string;
    const endDate = data.get('endDate') as string;
    const leaveTypeId = (data.get('leaveTypeId') as string) || null;
    const locationId = (data.get('locationId') as string) || null;

    if (!name || !startDate || !endDate) {
      return fail(400, { createError: { code: 'VALIDATION', message: 'Name, start date, and end date are required' } });
    }

    const idempotencyKey = `blackout-create-${locals.user!.id}-${startDate}-${endDate}-${Date.now()}`;

    const result = await apiFetch('/blackouts', cookie, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        name,
        startDate,
        endDate,
        leaveTypeId: leaveTypeId || undefined,
        locationId: locationId || undefined,
      }),
    });

    if (result.error) {
      return fail(result.status || 400, { createError: result.error });
    }
    return { createSuccess: true };
  },

  delete: async ({ request }) => {
    const cookie = request.headers.get('cookie') ?? '';
    const data = await request.formData();
    const id = data.get('id') as string;

    if (!id) return fail(400, { deleteError: { code: 'VALIDATION', message: 'id required' } });

    const result = await apiFetch(`/blackouts/${id}`, cookie, { method: 'DELETE' });
    if (result.error) {
      return fail(result.status || 400, { deleteError: result.error });
    }
    return { deleteSuccess: true };
  },
};
