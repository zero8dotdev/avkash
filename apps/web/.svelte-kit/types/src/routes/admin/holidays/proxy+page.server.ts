// @ts-nocheck
import type { PageServerLoad } from './$types';
import { apiFetchData } from '$lib/server/api';

interface Holiday {
  holidayId: string;
  name: string;
  date: string;
  location: string | null;
  isRecurring: boolean;
  isCustom: boolean;
}

interface Location {
  id: string;
  name: string;
  timezone: string;
  address: string | null;
  laborRegime: string;
  isActive: boolean;
}

export const load = async ({ request, parent }: Parameters<PageServerLoad>[0]) => {
  const { notAuthorized } = await parent();
  if (notAuthorized) return { allHolidays: [], locations: [], locationHolidays: {} };

  const cookie = request.headers.get('cookie') ?? '';
  const year = new Date().getFullYear();

  // Fetch locations and org-wide holidays in parallel
  const [locations, allHolidays] = await Promise.all([
    apiFetchData<Location[]>('/locations', cookie),
    apiFetchData<Holiday[]>(`/holidays?year=${year}`, cookie),
  ]);

  const locationList = locations ?? [];
  const allH = allHolidays ?? [];

  // For each location, fetch location-specific holidays.
  // W1 note: location-scoped query returns ONLY location rows (not national).
  // We union them in the UI: national (location=null) + per-location rows.
  const locationHolidayMap: Record<string, Holiday[]> = {};
  await Promise.all(
    locationList.map(async (loc) => {
      const locHolidays = await apiFetchData<Holiday[]>(
        `/holidays?location=${loc.id}&year=${year}`,
        cookie
      );
      locationHolidayMap[loc.id] = locHolidays ?? [];
    })
  );

  return {
    allHolidays: allH,
    locations: locationList,
    locationHolidays: locationHolidayMap,
    year,
  };
};
