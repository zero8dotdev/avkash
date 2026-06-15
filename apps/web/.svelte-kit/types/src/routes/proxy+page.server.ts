// @ts-nocheck
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = async () => {
  throw redirect(302, '/dashboard');
};
;null as any as PageServerLoad;