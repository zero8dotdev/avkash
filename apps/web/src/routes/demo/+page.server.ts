// Demo player SSR load — fetches all data needed by the 9-chapter demo from the live API.
// Uses the browser session cookie forwarded by the Hono client pattern.
// Chapter 1: LIVE — org tree (business-units, departments, teams, employees)
// Chapter 7: LIVE — leave-policies + leave-types
// Chapter 8: LIVE — Sara's leave balance
// Others: SCRIPTED (no seed data yet)

import type { PageServerLoad } from './$types';
import { apiFetchData } from '$lib/server/api';

const SARA_ID = 'e208de76-cb76-4b2e-a562-318092def28f';

interface BusinessUnit {
  id: string;
  name: string;
  legalName: string | null;
  isActive: boolean;
}

interface Department {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface Team {
  teamId: string;
  name: string;
  departmentId: string | null;
  memberCount?: number;
}

interface Employee {
  name: string;
  teamId: string;
  role: string;
}

interface LeavePolicy {
  leavePolicyId: string;
  leaveTypeId: string;
  maxLeaves: number;
  accruals: boolean;
  probationMaxLeaves: number | null;
  probationAccruals: boolean | null;
}

interface LeaveType {
  leaveTypeId: string;
  name: string;
  color: string;
}

interface LeaveBalance {
  leaveTypeId: string;
  available: number;
  entitlement: number;
  balance: number;
  taken: number;
}

interface Transfer {
  id?: string;
}

export const load: PageServerLoad = async ({ locals, cookies }) => {
  const cookie = cookies.get('better-auth.session_token')
    ? `better-auth.session_token=${cookies.get('better-auth.session_token')}`
    : '';

  // Fire all SSR requests in parallel
  const [businessUnits, departments, teams, employees, leavePolicies, leaveTypes, transfersRaw, saraBalances] =
    await Promise.all([
      apiFetchData<BusinessUnit[]>('/business-units', cookie),
      apiFetchData<Department[]>('/departments', cookie),
      apiFetchData<Team[]>('/teams', cookie),
      apiFetchData<Employee[]>('/employees', cookie),
      apiFetchData<LeavePolicy[]>('/leave-policies', cookie),
      apiFetchData<LeaveType[]>('/leave-types', cookie),
      apiFetchData<Transfer[]>('/transfers', cookie),
      // Sara's CL balance for Ch8 — requires ADMIN/MANAGER or own user
      apiFetchData<LeaveBalance[]>(`/balances/${SARA_ID}`, cookie),
    ]);

  // Find Sara's CL (Casual Leave) balance for Ch8 demo
  const CL_LEAVE_TYPE_ID = 'c9fcb140-5506-4535-bc82-4c92150e7ed7';
  const saraClBalance = saraBalances?.find(b => b.leaveTypeId === CL_LEAVE_TYPE_ID)?.available ?? 7;

  return {
    user: locals.user,
    orgData: {
      org: { name: 'Meridian Manufacturing Pvt. Ltd.', employeeCount: employees?.length ?? 0 },
      businessUnits: businessUnits ?? [],
      departments: departments ?? [],
      teams: teams ?? [],
      employees: employees ?? [],
    },
    leavePolicies: leavePolicies ?? [],
    leaveTypes: leaveTypes ?? [],
    transferCount: transfersRaw?.length ?? 0,
    saraClBalance,
  };
};
