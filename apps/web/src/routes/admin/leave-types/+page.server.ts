import type { PageServerLoad } from './$types';
import { apiFetchData } from '$lib/server/api';

interface LeaveType {
  leaveTypeId: string;
  name: string;
  color: string | null;
  kind: string;
  isPaid: boolean;
  isActive: boolean;
  emoji: string | null;
}

interface LeavePolicy {
  leavePolicyId: string;
  leaveTypeId: string;
  teamId: string;
  maxLeaves: number | null;
  unlimited: boolean;
  accruals: boolean;
  accrualFrequency: string | null;
  accrueOn: string | null;
  rollOver: boolean;
  rollOverLimit: number | null;
  rollOverExpiry: string | null;
  autoApprove: boolean;
  isActive: boolean;
  allowNegativeBalance: boolean;
  encashable: boolean;
  encashmentMaxDays: number | null;
  compOffExpiryDays: number | null;
  prorateOnJoin: boolean;
  probationMaxLeaves: number | null;
  probationAccruals: boolean | null;
  probationAccrualRate: string | null;
  probationEncashable: boolean | null;
  version: number;
}

interface Team {
  teamId: string;
  name: string;
  locationId: string | null;
}

export const load: PageServerLoad = async ({ request, parent }) => {
  const { notAuthorized } = await parent();
  if (notAuthorized) return { leaveTypes: [], policies: [], teams: [] };

  const cookie = request.headers.get('cookie') ?? '';

  const [leaveTypes, policies, teams] = await Promise.all([
    apiFetchData<LeaveType[]>('/leave-types', cookie),
    apiFetchData<LeavePolicy[]>('/leave-policies', cookie),
    apiFetchData<Team[]>('/teams', cookie),
  ]);

  return {
    leaveTypes: leaveTypes ?? [],
    policies: policies ?? [],
    teams: teams ?? [],
  };
};
