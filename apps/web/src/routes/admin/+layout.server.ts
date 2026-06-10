import type { LayoutServerLoad } from './$types';

// Guard the entire /admin segment to ADMIN and OWNER roles only.
export const load: LayoutServerLoad = async ({ locals }) => {
  const user = locals.user;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'OWNER')) {
    // Return a clean "not authorized" result instead of throwing — the layout handles display.
    return { user, notAuthorized: true };
  }
  return { user, notAuthorized: false };
};
