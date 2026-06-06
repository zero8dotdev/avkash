// Pure — no DB imports. Determines whether a policy applies to a given employee.
// All scope arrays use null to mean "applies to everyone" for that dimension.

export interface PolicyScope {
  locationIds: string[] | null;
  departmentIds: string[] | null;
  levelIds: string[] | null;
}

export interface EmployeeContext {
  locationId?: string | null;
  departmentId?: string | null;
  levelId?: string | null;
}

export function isPolicyApplicable(policy: PolicyScope, employee: EmployeeContext): boolean {
  if (policy.locationIds !== null && !policy.locationIds.includes(employee.locationId ?? '')) return false;
  if (policy.departmentIds !== null && !policy.departmentIds.includes(employee.departmentId ?? '')) return false;
  if (policy.levelIds !== null && !policy.levelIds.includes(employee.levelId ?? '')) return false;
  return true;
}
