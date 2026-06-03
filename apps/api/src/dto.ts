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
