import type { PageServerLoad } from './$types';
import { apiFetchData, apiFetch } from '$lib/server/api';
import { redirect } from '@sveltejs/kit';

interface BalanceEntry {
  userId: string;
  name: string;
  balances: {
    leaveTypeId: string;
    year: number;
    entitlement: number;
    balance: number;
    available: number;
    taken: number;
    planned: number;
  }[];
}

interface UtilizationEntry {
  leaveTypeId: string;
  name: string;
  taken: number;
  planned: number;
}

interface MusterRow {
  userId: string;
  name: string;
  days: {
    date: string;
    status: string;
    firstIn: string | null;
    lastOut: string | null;
    hours: number;
    overtimeHours: number;
    wfh: boolean;
  }[];
}

interface LeaveType {
  leaveTypeId: string;
  name: string;
  kind: string;
  isActive: boolean;
}

interface Team {
  teamId: string;
  name: string;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export const load: PageServerLoad = async ({ locals, request, url }) => {
  const cookie = request.headers.get('cookie') ?? '';
  const user = locals.user!;

  // Reports are for MANAGER+
  const isManager = user.role === 'MANAGER' || user.role === 'ADMIN' || user.role === 'OWNER';
  if (!isManager) {
    // Users only see their own leave balance — redirect to dashboard
    throw redirect(302, '/dashboard');
  }

  const report = url.searchParams.get('report') ?? 'balance';
  const teamId = url.searchParams.get('teamId') ?? '';
  const year = url.searchParams.get('year') ?? String(new Date().getFullYear());
  const fromDate = url.searchParams.get('from') ?? monthStartISO();
  const toDate = url.searchParams.get('to') ?? todayISO();

  // Fetch auxiliary data (teams, leave types) always
  const [teamsResult, leaveTypesResult] = await Promise.all([
    apiFetchData<Team[]>('/teams', cookie),
    apiFetchData<LeaveType[]>('/leave-types', cookie),
  ]);

  const teams = teamsResult ?? [];
  const leaveTypes = leaveTypesResult ?? [];

  let balanceReport: BalanceEntry[] = [];
  let utilizationReport: UtilizationEntry[] = [];
  let musterReport: MusterRow[] = [];
  let musterError: string | null = null;

  if (report === 'balance') {
    const path = teamId ? `/reports/leave-balance?teamId=${teamId}` : '/reports/leave-balance';
    balanceReport = (await apiFetchData<BalanceEntry[]>(path, cookie)) ?? [];
  } else if (report === 'utilization') {
    let path = `/reports/leave-utilization?year=${year}`;
    if (teamId) path += `&teamId=${teamId}`;
    utilizationReport = (await apiFetchData<UtilizationEntry[]>(path, cookie)) ?? [];
  } else if (report === 'muster') {
    if (!teamId) {
      musterError = 'Select a team to view the muster report.';
    } else {
      const path = `/reports/muster?teamId=${teamId}&from=${fromDate}&to=${toDate}`;
      const result = await apiFetch<MusterRow[]>(path, cookie);
      if (result.error) {
        musterError = result.error.message ?? 'Failed to load muster';
      } else {
        musterReport = result.data ?? [];
      }
    }
  }

  return {
    user,
    report,
    teamId,
    year,
    fromDate,
    toDate,
    teams,
    leaveTypes,
    balanceReport,
    utilizationReport,
    musterReport,
    musterError,
  };
};
