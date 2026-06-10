import type { PageServerLoad } from './$types';
import { apiFetchData } from '$lib/server/api';

export const load: PageServerLoad = async ({ locals, request }) => {
  const cookie = request.headers.get('cookie') ?? '';
  const compOffs = await apiFetchData<unknown[]>('/comp-off', cookie);
  return { user: locals.user, compOffs: compOffs ?? [] };
};
