import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const { notAuthorized } = await parent();
  if (!notAuthorized) {
    throw redirect(302, '/admin/leave-types');
  }
  return {};
};
