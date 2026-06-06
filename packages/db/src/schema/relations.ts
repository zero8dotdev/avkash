import { relations } from 'drizzle-orm';
import { organisation, team, user, location } from './core';
import { session, account } from './auth';
import { invitation, orgDomain } from './membership';
import { leaveType, leave, leavePolicy, leaveBlackout, levelLeavePolicy } from './leave';
import { holiday } from './holiday';
import { department, departmentLocation } from './department';
import { orgLevel } from './org-level';
import { shift } from './shift';
import { shiftLevelRestriction } from './shift-level-restriction';
import { workweekPattern } from './workweek-pattern';
import { transfer } from './transfer';

// Relations power the type-safe `db.query.*` API (e.g.
// db.query.user.findMany({ with: { leaves: true } })). They are NOT foreign
// keys — the FKs live on the columns in core.ts / leave.ts.

export const organisationRelations = relations(organisation, ({ many }) => ({
  teams: many(team),
  users: many(user),
  leaveTypes: many(leaveType),
  leaves: many(leave),
  holidays: many(holiday),
  invitations: many(invitation),
  domains: many(orgDomain),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organisation: one(organisation, { fields: [invitation.orgId], references: [organisation.orgId] }),
  team: one(team, { fields: [invitation.teamId], references: [team.teamId] }),
}));

export const orgDomainRelations = relations(orgDomain, ({ one }) => ({
  organisation: one(organisation, { fields: [orgDomain.orgId], references: [organisation.orgId] }),
}));

export const teamRelations = relations(team, ({ one, many }) => ({
  organisation: one(organisation, { fields: [team.orgId], references: [organisation.orgId] }),
  users: many(user),
  leaves: many(leave),
  leavePolicies: many(leavePolicy),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  organisation: one(organisation, { fields: [user.orgId], references: [organisation.orgId] }),
  team: one(team, { fields: [user.teamId], references: [team.teamId] }),
  department: one(department, { fields: [user.departmentId], references: [department.id] }),
  leaves: many(leave),
  sessions: many(session),
  accounts: many(account),
}));

export const departmentRelations = relations(department, ({ one, many }) => ({
  organisation: one(organisation, { fields: [department.orgId], references: [organisation.orgId] }),
  locations: many(departmentLocation),
  users: many(user),
}));

export const departmentLocationRelations = relations(departmentLocation, ({ one }) => ({
  department: one(department, { fields: [departmentLocation.departmentId], references: [department.id] }),
  location: one(location, { fields: [departmentLocation.locationId], references: [location.id] }),
  head: one(user, { fields: [departmentLocation.headUserId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const leaveTypeRelations = relations(leaveType, ({ one, many }) => ({
  organisation: one(organisation, { fields: [leaveType.orgId], references: [organisation.orgId] }),
  leaves: many(leave),
  policies: many(leavePolicy),
}));

export const leaveRelations = relations(leave, ({ one }) => ({
  leaveType: one(leaveType, { fields: [leave.leaveTypeId], references: [leaveType.leaveTypeId] }),
  user: one(user, { fields: [leave.userId], references: [user.id] }),
  team: one(team, { fields: [leave.teamId], references: [team.teamId] }),
  organisation: one(organisation, { fields: [leave.orgId], references: [organisation.orgId] }),
}));

export const leavePolicyRelations = relations(leavePolicy, ({ one }) => ({
  leaveType: one(leaveType, { fields: [leavePolicy.leaveTypeId], references: [leaveType.leaveTypeId] }),
  team: one(team, { fields: [leavePolicy.teamId], references: [team.teamId] }),
}));

export const leaveBlackoutRelations = relations(leaveBlackout, ({ one }) => ({
  organisation: one(organisation, { fields: [leaveBlackout.orgId], references: [organisation.orgId] }),
  leaveType: one(leaveType, { fields: [leaveBlackout.leaveTypeId], references: [leaveType.leaveTypeId] }),
}));

export const levelLeavePolicyRelations = relations(levelLeavePolicy, ({ one }) => ({
  organisation: one(organisation, { fields: [levelLeavePolicy.orgId], references: [organisation.orgId] }),
  leaveType: one(leaveType, { fields: [levelLeavePolicy.leaveTypeId], references: [leaveType.leaveTypeId] }),
}));

export const workweekPatternRelations = relations(workweekPattern, ({ one }) => ({
  organisation: one(organisation, { fields: [workweekPattern.orgId], references: [organisation.orgId] }),
}));

export const orgLevelRelations = relations(orgLevel, ({ one, many }) => ({
  organisation: one(organisation, { fields: [orgLevel.orgId], references: [organisation.orgId] }),
  shiftRestrictions: many(shiftLevelRestriction),
}));

export const shiftLevelRestrictionRelations = relations(shiftLevelRestriction, ({ one }) => ({
  organisation: one(organisation, { fields: [shiftLevelRestriction.orgId], references: [organisation.orgId] }),
  shift: one(shift, { fields: [shiftLevelRestriction.shiftId], references: [shift.id] }),
  level: one(orgLevel, { fields: [shiftLevelRestriction.levelId], references: [orgLevel.id] }),
}));

export const transferRelations = relations(transfer, ({ one }) => ({
  organisation: one(organisation, { fields: [transfer.orgId], references: [organisation.orgId] }),
  user: one(user, { fields: [transfer.userId], references: [user.id] }),
  fromLocation: one(location, { fields: [transfer.fromLocationId], references: [location.id] }),
  toLocation: one(location, { fields: [transfer.toLocationId], references: [location.id] }),
  authorizedBy: one(user, { fields: [transfer.authorizedBy], references: [user.id] }),
}));
