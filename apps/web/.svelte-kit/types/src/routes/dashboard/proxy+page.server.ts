// @ts-nocheck
import type { PageServerLoad } from './$types';
import { apiFetchData } from '$lib/server/api';

interface LeaveType {
  leaveTypeId: string;
  name: string;
  color: string | null;
  kind: string;
  isPaid: boolean;
}

interface LeaveBalance {
  leaveTypeId: string;
  year: number;
  entitlement: number;
  balance: number;
  available: number;
  taken: number;
  planned: number;
}

interface Holiday {
  holidayId: string;
  name: string;
  date: string;
  location: string | null;
  isRecurring: boolean;
}

interface LeaveRequest {
  leaveId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  isApproved: string;
  workingDays: string;
  reason: string | null;
}

interface CompOff {
  id: string;
  workedOn: string;
  days: string;
  status: string;
}

interface Regularization {
  id: string;
  date: string;
  reason: string;
  status: string;
}

interface AttendanceDay {
  date: string;
  status: string;
  firstIn: string | null;
  lastOut: string | null;
  hours: number;
}

interface MeData {
  user: {
    id: string;
    name: string;
    role: string;
    teamId: string | null;
    locationId: string | null;
  };
  team: { teamId: string; name: string } | null;
}



export const load = async ({ locals, request }: Parameters<PageServerLoad>[0]) => {
  const cookie = request.headers.get('cookie') ?? '';
  const user = locals.user!;

  // Parallel fetch of everything we need for the dashboard.
  // Note: API wraps list responses in { data: [...] } — apiFetchData unwraps the
  // outer envelope's .data field, so T should be the inner type.
  // /me returns { data: { user, org, team } }  → T = MeData
  // /leave-types returns { data: [...] }        → T = LeaveType[]  (inner array)
  const [me, leaveTypes, leaveRequests, compOffs, regularizations] = await Promise.all([
    apiFetchData<MeData>('/me', cookie),
    apiFetchData<LeaveType[]>('/leave-types', cookie),
    apiFetchData<LeaveRequest[]>('/leaves', cookie),
    apiFetchData<CompOff[]>('/comp-off', cookie),
    apiFetchData<Regularization[]>('/attendance/regularizations?status=PENDING', cookie),
  ]);

  // Fetch leave balances for this user
  const balances = await apiFetchData<LeaveBalance[]>(
    `/balances/${user.id}`,
    cookie
  );

  // Resolve the team's locationId to fetch the right holiday calendar.
  // For ADMIN users (Priya), use their teamId's location; for others, same.
  // We use the /teams endpoint (MANAGER+) with graceful fallback.
  let locationId: string | null = null;

  const teamId = me?.user?.teamId ?? null;
  if (teamId) {
    // Try /teams to get location — only works for MANAGER+
    // API returns { data: [...] }, so T = the inner array type
    const teamsData = await apiFetchData<Array<{ teamId: string; name: string; locationId: string | null }>>('/teams', cookie);
    if (teamsData) {
      const team = teamsData.find((t) => t.teamId === teamId);
      locationId = team?.locationId ?? null;
    }
  }

  // Known stable location IDs from the seed (fallback for USER role who can't list teams)
  const KNOWN_LOCATIONS: Record<string, string> = {
    '9829047a-23a6-4e8d-b431-1b516190a60e': '4990b22b-3693-4bb5-8c22-2894d569b4a8', // Assembly → Coimbatore
    'bab83141-8519-48df-a578-7738e8a52279': '9d87c34d-280d-4161-9616-a7c68fec052e',  // General → Bengaluru
    'd5715c44-1e43-4f67-8b75-7ef60a37e51d': '4990b22b-3693-4bb5-8c22-2894d569b4a8', // Logistics → Coimbatore
  };
  if (!locationId && teamId) {
    locationId = KNOWN_LOCATIONS[teamId] ?? null;
  }

  // Fetch holidays for this location + national holidays
  const currentYear = new Date().getFullYear();
  const holidayUrl = locationId
    ? `/holidays?location=${locationId}&year=${currentYear}`
    : `/holidays?year=${currentYear}`;
  const holidays = await apiFetchData<Holiday[]>(holidayUrl, cookie);

  // Today's attendance — API returns { data: [...] }
  const today = new Date().toISOString().slice(0, 10);
  const attendanceToday = await apiFetchData<AttendanceDay[]>(
    `/attendance/me?from=${today}&to=${today}`,
    cookie
  );

  return {
    user,
    me: me ?? null,
    leaveTypes: leaveTypes ?? [],
    balances: balances ?? [],
    leaveRequests: leaveRequests ?? [],
    compOffs: compOffs ?? [],
    regularizations: regularizations ?? [],
    holidays: holidays ?? [],
    attendanceToday: attendanceToday?.[0] ?? null,
    locationId,
  };
};
