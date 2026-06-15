import { createSelectSchema } from 'drizzle-zod';
import { schema } from '@avkash/db';

// Response DTOs — the public projection of each table. createSelectSchema keeps the
// shape in sync with the schema; .omit() drops internal/audit columns (orgId, the
// created/updatedBy bookkeeping, internal flags) so the wire shape is a deliberate
// contract rather than a database dump. Pair with serialize() at the route.
export const leaveTypeDto = createSelectSchema(schema.leaveType).omit({
  orgId: true,
  createdBy: true,
  updatedBy: true,
  setSlackStatus: true,
});

export const leaveDto = createSelectSchema(schema.leave).omit({
  orgId: true,
  createdBy: true,
  updatedBy: true,
});

export const leavePolicyDto = createSelectSchema(schema.leavePolicy).omit({
  createdBy: true,
  updatedBy: true,
});

export const compOffDto = createSelectSchema(schema.compOff).omit({
  orgId: true,
  createdBy: true,
});

export const encashmentDto = createSelectSchema(schema.encashment).omit({
  orgId: true,
  createdBy: true,
});

export const delegationDto = createSelectSchema(schema.approvalDelegation).omit({
  orgId: true,
});

export const commentDto = createSelectSchema(schema.leaveComment).omit({
  orgId: true,
});

export const holidayDto = createSelectSchema(schema.holiday).omit({
  orgId: true,
  createdBy: true,
  updatedBy: true,
});

export const teamDto = createSelectSchema(schema.team).omit({
  orgId: true,
  createdBy: true,
  updatedBy: true,
});

export const locationDto = createSelectSchema(schema.location).omit({
  orgId: true,
  createdBy: true,
  updatedBy: true,
});

export const orgDto = createSelectSchema(schema.organisation).omit({
  createdBy: true,
  updatedBy: true,
  subscriptionId: true,
});

export const punchDto = createSelectSchema(schema.attendancePunch).omit({
  orgId: true,
  createdBy: true,
});

// Device never exposes its secret hash.
export const deviceDto = createSelectSchema(schema.device).omit({
  orgId: true,
  secretHash: true,
  createdBy: true,
  updatedBy: true,
});

export const enrollmentDto = createSelectSchema(schema.deviceEnrollment).omit({
  orgId: true,
  createdBy: true,
});

export const shiftDto = createSelectSchema(schema.shift).omit({
  orgId: true,
  createdBy: true,
  updatedBy: true,
});

export const shiftAssignmentDto = createSelectSchema(schema.shiftAssignment).omit({
  orgId: true,
  createdBy: true,
});

export const regularizationDto = createSelectSchema(schema.attendanceRegularization).omit({
  orgId: true,
  createdBy: true,
});

// User leaks the most, so allowlist via omit of everything internal/sensitive:
// org wiring, audit, and the internal JSON accumulators.
export const userDto = createSelectSchema(schema.user).omit({
  orgId: true,
  createdBy: true,
  updatedBy: true,
  accruedLeave: true,
  usedLeave: true,
  overrides: true,
  keyword: true,
});

export const departmentDto = createSelectSchema(schema.department).omit({
  orgId: true,
  createdBy: true,
  updatedBy: true,
});

export const departmentLocationDto = createSelectSchema(schema.departmentLocation).omit({
  orgId: true,
  createdBy: true,
});

export const orgLevelDto = createSelectSchema(schema.orgLevel).omit({
  orgId: true,
  createdBy: true,
  updatedBy: true,
});

export const businessUnitDto = createSelectSchema(schema.businessUnit).omit({
  orgId: true,
  createdBy: true,
  updatedBy: true,
});

export const workweekPatternDto = createSelectSchema(schema.workweekPattern).omit({
  orgId: true,
  createdBy: true,
  updatedBy: true,
});

export const leaveBlackoutDto = createSelectSchema(schema.leaveBlackout).omit({
  orgId: true,
  createdBy: true,
  updatedBy: true,
});

export const levelLeavePolicyDto = createSelectSchema(schema.levelLeavePolicy).omit({
  orgId: true,
  createdBy: true,
  updatedBy: true,
});

export const transferDto = createSelectSchema(schema.transfer).omit({
  orgId: true,
  createdBy: true,
  updatedBy: true,
});

// Field-policy DTO — drops orgId and audit authors; version is exposed so the
// client can supply If-Match on PATCH. createdAt/updatedAt remain for auditability.
export const fieldPolicyDto = createSelectSchema(schema.fieldPolicy).omit({
  orgId: true,
  createdBy: true,
  updatedBy: true,
});
