// Row types inferred straight from the schema. `Select` = a row read from the
// DB; `Insert` = the shape accepted by .insert() (optional/defaulted columns
// become optional). Import these in domain packages instead of re-declaring.
import type { organisation, team, user, orgAccessData, location } from './core';
import type { session, account, verification } from './auth';
import type { invitation, orgDomain } from './membership';
import type {
  leaveType,
  leave,
  leavePolicy,
  leaveLedger,
  compOff,
  encashment,
  approvalDelegation,
  leaveComment,
} from './leave';
import type { holiday, publicHolidays } from './holiday';
import type { activityLog } from './audit';
import type { subscription, paySubMap } from './billing';
import type { contactEmail } from './contact';

export type Organisation = typeof organisation.$inferSelect;
export type NewOrganisation = typeof organisation.$inferInsert;
export type Team = typeof team.$inferSelect;
export type NewTeam = typeof team.$inferInsert;
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Location = typeof location.$inferSelect;
export type NewLocation = typeof location.$inferInsert;
export type OrgAccessData = typeof orgAccessData.$inferSelect;
export type NewOrgAccessData = typeof orgAccessData.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;
export type Invitation = typeof invitation.$inferSelect;
export type NewInvitation = typeof invitation.$inferInsert;
export type OrgDomain = typeof orgDomain.$inferSelect;
export type NewOrgDomain = typeof orgDomain.$inferInsert;

export type LeaveType = typeof leaveType.$inferSelect;
export type NewLeaveType = typeof leaveType.$inferInsert;
export type Leave = typeof leave.$inferSelect;
export type NewLeave = typeof leave.$inferInsert;
export type LeavePolicy = typeof leavePolicy.$inferSelect;
export type NewLeavePolicy = typeof leavePolicy.$inferInsert;
export type LeaveLedger = typeof leaveLedger.$inferSelect;
export type NewLeaveLedger = typeof leaveLedger.$inferInsert;
export type CompOff = typeof compOff.$inferSelect;
export type NewCompOff = typeof compOff.$inferInsert;
export type Encashment = typeof encashment.$inferSelect;
export type NewEncashment = typeof encashment.$inferInsert;
export type ApprovalDelegation = typeof approvalDelegation.$inferSelect;
export type NewApprovalDelegation = typeof approvalDelegation.$inferInsert;
export type LeaveComment = typeof leaveComment.$inferSelect;
export type NewLeaveComment = typeof leaveComment.$inferInsert;

export type Holiday = typeof holiday.$inferSelect;
export type NewHoliday = typeof holiday.$inferInsert;
export type PublicHoliday = typeof publicHolidays.$inferSelect;
export type NewPublicHoliday = typeof publicHolidays.$inferInsert;

export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;

export type Subscription = typeof subscription.$inferSelect;
export type NewSubscription = typeof subscription.$inferInsert;
export type PaySubMap = typeof paySubMap.$inferSelect;
export type NewPaySubMap = typeof paySubMap.$inferInsert;

export type ContactEmail = typeof contactEmail.$inferSelect;
export type NewContactEmail = typeof contactEmail.$inferInsert;
