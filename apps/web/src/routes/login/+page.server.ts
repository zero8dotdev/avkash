import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

// If the user is already authenticated, bounce them to the dashboard.
export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(302, '/dashboard');
  }
  return {};
};
