import type { LayoutServerLoad } from './$types';

// Surface the session user to all layout/page components via `data.user`.
export const load: LayoutServerLoad = async ({ locals }) => {
  return { user: locals.user };
};
