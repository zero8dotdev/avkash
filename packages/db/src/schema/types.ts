// Row types inferred straight from the schema. `Select` = a row read from the
// DB; `Insert` = the shape accepted by .insert() (optional/defaulted columns
// become optional). Import these in domain packages instead of re-declaring.
import type { organisation, team, user, orgAccessData, location } from './core';
import type { businessUnit } from './business-unit';
import type { department, departmentLocation } from './department';
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
  leaveBlackout,
  levelLeavePolicy,
} from './leave';
import type { workweekPattern } from './workweek-pattern';
import type { transfer } from './transfer';
import type { device, deviceEnrollment } from './device';
import type { shift, shiftAssignment } from './shift';
import type { attendanceRegularization } from './regularization';
import type { attendanceSourcePolicy, shiftSupervisor } from './attendance';
import type { policy, policyVersionHistory, policyAcknowledgement } from './policy';
import type { holiday, publicHolidays } from './holiday';
import type { orgLevel } from './org-level';
import type { shiftLevelRestriction } from './shift-level-restriction';
import type { activityLog } from './audit';
import type { subscription, paySubMap } from './billing';
import type { contactEmail } from './contact';
import type { fieldPolicy } from './field-policy';
import type { eventOutbox } from './event-outbox';

export type BusinessUnit = typeof businessUnit.$inferSelect;
export type NewBusinessUnit = typeof businessUnit.$inferInsert;

export type Organisation = typeof organisation.$inferSelect;
export type NewOrganisation = typeof organisation.$inferInsert;
export type Team = typeof team.$inferSelect;
export type NewTeam = typeof team.$inferInsert;
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Location = typeof location.$inferSelect;
export type NewLocation = typeof location.$inferInsert;
export type OrgAccessData = typeof orgAccessData.$inferSelect;

export type Department = typeof department.$inferSelect;
export type NewDepartment = typeof department.$inferInsert;
export type DepartmentLocation = typeof departmentLocation.$inferSelect;
export type NewDepartmentLocation = typeof departmentLocation.$inferInsert;
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
export type LeaveBlackout = typeof leaveBlackout.$inferSelect;
export type NewLeaveBlackout = typeof leaveBlackout.$inferInsert;
export type LevelLeavePolicy = typeof levelLeavePolicy.$inferSelect;
export type NewLevelLeavePolicy = typeof levelLeavePolicy.$inferInsert;

export type WorkweekPattern = typeof workweekPattern.$inferSelect;
export type NewWorkweekPattern = typeof workweekPattern.$inferInsert;
export type Transfer = typeof transfer.$inferSelect;
export type NewTransfer = typeof transfer.$inferInsert;

export type Device = typeof device.$inferSelect;
export type NewDevice = typeof device.$inferInsert;
export type DeviceEnrollment = typeof deviceEnrollment.$inferSelect;
export type NewDeviceEnrollment = typeof deviceEnrollment.$inferInsert;
export type Shift = typeof shift.$inferSelect;
export type NewShift = typeof shift.$inferInsert;
export type ShiftAssignment = typeof shiftAssignment.$inferSelect;
export type NewShiftAssignment = typeof shiftAssignment.$inferInsert;
export type AttendanceRegularization = typeof attendanceRegularization.$inferSelect;
export type NewAttendanceRegularization = typeof attendanceRegularization.$inferInsert;
export type AttendanceSourcePolicy = typeof attendanceSourcePolicy.$inferSelect;
export type NewAttendanceSourcePolicy = typeof attendanceSourcePolicy.$inferInsert;
export type ShiftSupervisor = typeof shiftSupervisor.$inferSelect;
export type NewShiftSupervisor = typeof shiftSupervisor.$inferInsert;

export type Policy = typeof policy.$inferSelect;
export type NewPolicy = typeof policy.$inferInsert;
export type PolicyVersionHistory = typeof policyVersionHistory.$inferSelect;
export type NewPolicyVersionHistory = typeof policyVersionHistory.$inferInsert;
export type PolicyAcknowledgement = typeof policyAcknowledgement.$inferSelect;
export type NewPolicyAcknowledgement = typeof policyAcknowledgement.$inferInsert;

export type Holiday = typeof holiday.$inferSelect;
export type NewHoliday = typeof holiday.$inferInsert;
export type PublicHoliday = typeof publicHolidays.$inferSelect;
export type NewPublicHoliday = typeof publicHolidays.$inferInsert;

export type OrgLevel = typeof orgLevel.$inferSelect;
export type NewOrgLevel = typeof orgLevel.$inferInsert;
export type ShiftLevelRestriction = typeof shiftLevelRestriction.$inferSelect;
export type NewShiftLevelRestriction = typeof shiftLevelRestriction.$inferInsert;

export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;

export type Subscription = typeof subscription.$inferSelect;
export type NewSubscription = typeof subscription.$inferInsert;
export type PaySubMap = typeof paySubMap.$inferSelect;
export type NewPaySubMap = typeof paySubMap.$inferInsert;

export type ContactEmail = typeof contactEmail.$inferSelect;
export type NewContactEmail = typeof contactEmail.$inferInsert;

export type EventOutbox = typeof eventOutbox.$inferSelect;
export type NewEventOutbox = typeof eventOutbox.$inferInsert;

export type FieldPolicy = typeof fieldPolicy.$inferSelect;
export type NewFieldPolicy = typeof fieldPolicy.$inferInsert;
