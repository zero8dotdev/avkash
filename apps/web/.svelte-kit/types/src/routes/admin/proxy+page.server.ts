// @ts-nocheck
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = async ({ parent }: Parameters<PageServerLoad>[0]) => {
  const { notAuthorized } = await parent();
  if (!notAuthorized) {
    throw redirect(302, '/admin/leave-types');
  }
  return {};
};
