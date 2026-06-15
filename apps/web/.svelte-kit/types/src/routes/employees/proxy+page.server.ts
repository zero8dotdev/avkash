// @ts-nocheck
import type { PageServerLoad } from './$types';
import { apiFetchData, apiFetch } from '$lib/server/api';

// Employee row from /employees (FGA-filtered, field-group projected)
interface EmployeeRow {
  name?: string;
  email?: string;
  role?: string;
  teamId?: string;
  locationId?: string | null;
  departmentId?: string | null;
  isFloating?: boolean;
  employeeCode?: string | null;
  designation?: string | null;
  employmentType?: string | null;
  employmentStatus?: string | null;
}

// Full user row from /users (has 'id')
interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: string | null;
  locationId: string | null;
  departmentId: string | null;
  businessUnitId: string | null;
  isFloating: boolean;
  joinedOn: string | null;
  version: number;
}

interface Team {
  teamId: string;
  name: string;
  departmentId: string | null;
  locationId: string | null;
}

interface Location {
  id: string;
  name: string;
}

export const load = async ({ locals, request, url }: Parameters<PageServerLoad>[0]) => {
  const cookie = request.headers.get('cookie') ?? '';
  const user = locals.user!;
  const search = url.searchParams.get('search') ?? '';
  const teamFilter = url.searchParams.get('teamId') ?? '';

  // For MANAGER+, fetch FGA-filtered /employees and full /users in parallel
  // For USER, /employees returns 403 — skip it and show own profile only
  const isManager = user.role === 'MANAGER' || user.role === 'ADMIN' || user.role === 'OWNER';

  const [usersResult, teamsResult, locationsResult] = await Promise.all([
    apiFetchData<UserRow[]>('/users', cookie),
    apiFetchData<Team[]>('/teams', cookie),
    apiFetchData<Location[]>('/locations', cookie),
  ]);

  let fgaFilteredEmails: Set<string> | null = null;
  let fgaCount = 0;

  if (isManager) {
    // /employees is FGA-filtered: email is the common key to cross-reference with /users
    const empResult = await apiFetch<EmployeeRow[]>('/employees', cookie);
    if (empResult.data) {
      fgaFilteredEmails = new Set(empResult.data.map((e) => e.email ?? '').filter(Boolean));
      fgaCount = empResult.data.length;
    } else {
      // 403 or error — treat as empty list
      fgaFilteredEmails = new Set();
      fgaCount = 0;
    }
  }

  const allUsers = usersResult ?? [];
  const teams = teamsResult ?? [];
  const locations = locationsResult ?? [];

  // Cross-reference: only show users visible via FGA (for MANAGER+)
  // For USER role: show only self
  let visibleUsers: UserRow[];
  if (!isManager) {
    visibleUsers = allUsers.filter((u) => u.id === user.id);
    fgaCount = visibleUsers.length;
  } else if (fgaFilteredEmails !== null) {
    visibleUsers = allUsers.filter((u) => fgaFilteredEmails!.has(u.email));
  } else {
    visibleUsers = allUsers;
  }

  // Apply search filter
  const lowerSearch = search.toLowerCase();
  let filtered = visibleUsers;
  if (lowerSearch) {
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(lowerSearch) ||
        u.email.toLowerCase().includes(lowerSearch)
    );
  }
  if (teamFilter) {
    filtered = filtered.filter((u) => u.teamId === teamFilter);
  }

  return {
    user,
    employees: filtered,
    totalVisible: visibleUsers.length,
    fgaCount,
    teams,
    locations,
    search,
    teamFilter,
  };
};
