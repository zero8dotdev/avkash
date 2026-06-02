import type { ErrorParams } from './errors'

// The error-code catalog. Keys are the stable machine codes (the API contract);
// values are English templates with {param} placeholders. Phase 3 moves these into
// @avkash/i18n as the `en` catalog and adds other locales — the codes stay fixed.
const EN: Record<string, string> = {
  // ── auth / authz ──
  UNAUTHENTICATED: 'Not authenticated.',
  FORBIDDEN: 'You do not have permission to do that.',
  FORBIDDEN_ROLE: 'This action requires the {role} role.',
  FORBIDDEN_SCOPE: 'Missing required scope: {scope}.',
  STEP_UP_REQUIRED: 'Additional verification is required.',
  CROSS_ORG: 'Cross-organisation access is not allowed.',
  // ── generic ──
  NOT_FOUND: 'Not found.',
  VALIDATION_FAILED: 'The request is invalid.',
  CONFLICT: 'This conflicts with the current state.',
  INTERNAL: 'Something went wrong.',
  // ── org ──
  ORG_NOT_FOUND: 'Organisation not found.',
  ORG_RESTRICTED: 'Your organisation is restricted — verify your domain to continue.',
  ALREADY_MEMBER: 'That person is already a member.',
  INVITATION_EXISTS: 'An invitation is already pending for that email.',
  INVITE_ROLE_TOO_HIGH: 'You cannot invite someone at the {role} role.',
  SEAT_CAP_REACHED: 'Seat limit ({cap}) reached — verify your domain to add more.',
  DOMAIN_NOT_FOUND: 'Domain not found.',
  // ── leave ──
  LEAVE_NOT_FOUND: 'Leave not found.',
  LEAVE_FORBIDDEN: 'You are not allowed to access this leave.',
  NOT_TEAM_APPROVER: 'You are not authorised to approve for this team.',
  USER_NOT_FOUND: 'User not found.',
  USER_NO_TEAM: 'This user is not assigned to a team.',
  NO_TARGET_USER: 'No target user specified.',
  HALF_DAY_SINGLE_DAY: 'A half-day leave must be a single day.',
  HALF_DAY_NEEDS_SHIFT: 'A half-day leave requires a shift.',
  NO_WORKING_DAYS: 'There are no working days in the selected range.',
  LEAVE_OVERLAP: 'This leave overlaps an existing leave.',
  INSUFFICIENT_BALANCE: 'Insufficient leave balance — {available} available, {requested} requested.',
  LEAVE_NOT_PENDING: 'This leave is not pending.',
  LEAVE_ALREADY_CANCELLED: 'This leave has already been cancelled.',
  LEAVE_TYPE_NOT_FOUND: 'Leave type not found or inactive.',
  LEAVE_POLICY_NOT_FOUND: 'Leave policy not found.',
  // ── comp-off ──
  COMP_OFF_NOT_FOUND: 'Comp-off not found.',
  COMP_OFF_NOT_PENDING: 'This comp-off is not pending.',
  NOT_COMP_OFF_TYPE: 'That leave type is not a comp-off type.',
  // ── encashment ──
  ENCASHMENT_NOT_FOUND: 'Encashment not found.',
  ENCASHMENT_NOT_PENDING: 'This encashment is not pending.',
  NOT_ENCASHABLE: 'This leave type is not encashable.',
  ENCASH_LIMIT: 'At most {max} days can be encashed.',
  DAYS_POSITIVE: 'Days must be a positive number.',
  // ── delegation / comments ──
  DELEGATION_NOT_FOUND: 'Delegation not found.',
  COMMENT_BODY_REQUIRED: 'A comment body is required.',
  INTERNAL_COMMENT_FORBIDDEN: 'Only approvers can add internal comments.',
}

function interpolate(tpl: string, params?: ErrorParams): string {
  if (!params) return tpl
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => (params[k] != null ? String(params[k]) : `{${k}}`))
}

// Resolve a human message for a code (English). Phase 3 replaces this with a
// locale-aware lookup; the call sites in onError stay the same.
export function defaultMessage(code: string, params?: ErrorParams): string {
  return interpolate(EN[code] ?? code, params)
}
