import type { PageServerLoad } from './$types';
import { apiFetchData } from '$lib/server/api';

interface WorkweekPattern {
  id: string;
  name: string;
  cycleLength: number;
  weeks: string[][];
  referenceDate: string;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface Team {
  teamId: string;
  name: string;
  locationId: string | null;
  workweekPatternId: string | null;
}

export const load: PageServerLoad = async ({ request, parent }) => {
  const { notAuthorized } = await parent();
  if (notAuthorized) return { patterns: [], teams: [] };

  const cookie = request.headers.get('cookie') ?? '';

  const [patterns, teams] = await Promise.all([
    apiFetchData<WorkweekPattern[]>('/workweek-patterns', cookie),
    apiFetchData<Team[]>('/teams', cookie),
  ]);

  return {
    patterns: patterns ?? [],
    teams: teams ?? [],
  };
};
