import { relations } from 'drizzle-orm';
import { organisation, team, user } from './core';
import { session, account } from './auth';
import { invitation, orgDomain } from './membership';
import { leaveType, leave, leavePolicy } from './leave';
import { holiday } from './holiday';

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
  leaves: many(leave),
  sessions: many(session),
  accounts: many(account),
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
