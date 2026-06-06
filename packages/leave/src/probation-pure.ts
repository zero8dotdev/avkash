// Pure — no DB imports. Applies probation-specific overrides to a leave policy
// when the employee's employmentStatus is 'PROBATION'. null fields mean "inherit
// the base value unchanged". Returns a new object (does not mutate the input).

export type EmploymentStatus =
  | 'ACTIVE'
  | 'PROBATION'
  | 'NOTICE_PERIOD'
  | 'RESIGNED'
  | 'TERMINATED'
  | 'ON_LONG_LEAVE';

export interface ProbationOverlayFields {
  probationMaxLeaves?: number | null;
  probationAccruals?: boolean | null;
  probationAccrualRate?: string | null;
  probationEncashable?: boolean | null;
}

export interface PolicyBase extends ProbationOverlayFields {
  maxLeaves?: number | null;
  accruals?: boolean;
  encashable?: boolean;
}

// Apply probation overrides in-place (returns a new spread).
// Callers invoke this immediately after resolving the effective policy.
export function applyProbationOverlay<T extends PolicyBase>(policy: T, status: EmploymentStatus): T {
  if (status !== 'PROBATION') return policy;
  return {
    ...policy,
    maxLeaves: policy.probationMaxLeaves ?? policy.maxLeaves,
    accruals: policy.probationAccruals ?? policy.accruals,
    encashable: policy.probationEncashable ?? policy.encashable,
    // probationAccrualRate surfaces as a separate field — callers (accrual tick) read it directly.
  };
}

// Whether an employee in probation should accrue leave per the overlaid policy.
export function probationAccrualsEnabled(policy: PolicyBase, status: EmploymentStatus): boolean {
  const effective = applyProbationOverlay(policy, status);
  return effective.accruals ?? false;
}

// Effective accrual rate — probationAccrualRate overrides the base rate only for probationers.
export function effectiveAccrualRate(
  baseRate: string | null | undefined,
  policy: ProbationOverlayFields,
  status: EmploymentStatus
): string | null {
  if (status === 'PROBATION' && policy.probationAccrualRate != null) return policy.probationAccrualRate;
  return baseRate ?? null;
}
