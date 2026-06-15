// @ts-nocheck
import type { LayoutServerLoad } from './$types';

// Surface the session user to all layout/page components via `data.user`.
export const load = async ({ locals }: Parameters<LayoutServerLoad>[0]) => {
  return { user: locals.user };
};
