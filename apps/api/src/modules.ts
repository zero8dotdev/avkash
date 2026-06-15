import type { Hono } from 'hono';
import type { AvkashModule } from '@avkash/shared';
import type { PlatformEnv } from '@avkash/app';
import { orgs } from './routes/orgs';
import { invitations } from './routes/invitations';
import { users } from './routes/users';
import { me } from './routes/me';
import { employees } from './routes/employees';
import { teams } from './routes/teams';
import { departments } from './routes/departments';
import { businessUnits, employeeBusinessUnit } from './routes/business-units';
import { locations } from './routes/locations';
import { orgLevels, shiftLevelRestrictions } from './routes/org-levels';
import { shiftSupervisors } from './routes/shift-supervisors';
import { transfers } from './routes/transfers';
import { leaves } from './routes/leave';
import { leaveTypes } from './routes/leave-types';
import { leavePolicies, levelPolicies } from './routes/leave-policies';
import { balances } from './routes/balances';
import { compOff } from './routes/comp-off';
import { encashments } from './routes/encashments';
import { delegations } from './routes/delegations';
import { calendar } from './routes/calendar';
import { reports } from './routes/reports';
import { accruals } from './routes/accruals';
import { blackouts } from './routes/blackouts';
import { attendance } from './routes/attendance';
import { deviceIngest } from './routes/device-ingest';
import { devices } from './routes/devices';
import { shifts } from './routes/shifts';
import { workweekPatterns } from './routes/workweek-patterns';
import { holidays } from './routes/holidays';
import { policies } from './routes/policies';
import { fieldPolicies } from './routes/field-policies';

// ── Module manifests ──────────────────────────────────────────────────────────
// entitlement: null = always-on core (never gated).
// Entitlement enforcement is Phase 4; keys are declared here so the registry
// can reference them when Phase 4 lands.

const orgModule: AvkashModule<Hono<PlatformEnv>> = {
  key: 'org',
  title: 'Organisation',
  entitlement: null,
  routes: (app) => {
    app.route('/orgs', orgs);
    app.route('/invitations', invitations);
  },
};

const usersModule: AvkashModule<Hono<PlatformEnv>> = {
  key: 'users',
  title: 'People',
  entitlement: null,
  dependsOn: ['org'],
  routes: (app) => {
    app.route('/users', users);
    app.route('/me', me);
    app.route('/employees', employees);
    app.route('/teams', teams);
    app.route('/departments', departments);
    app.route('/business-units', businessUnits);
    app.route('/employees/:userId/business-unit', employeeBusinessUnit);
    app.route('/locations', locations);
    app.route('/org-levels', orgLevels);
    app.route('/shifts/:shiftId/levels', shiftLevelRestrictions);
    app.route('/shift-supervisors', shiftSupervisors);
    app.route('/transfers', transfers);
  },
};

const leaveModule: AvkashModule<Hono<PlatformEnv>> = {
  key: 'leave',
  title: 'Leave Management',
  entitlement: 'leave',
  dependsOn: ['org', 'users'],
  routes: (app) => {
    app.route('/leaves', leaves);
    app.route('/leave-types', leaveTypes);
    app.route('/leave-policies', leavePolicies);
    app.route('/leave-policies/levels', levelPolicies);
    app.route('/balances', balances);
    app.route('/comp-off', compOff);
    app.route('/encashments', encashments);
    app.route('/delegations', delegations);
    app.route('/calendar', calendar);
    app.route('/reports', reports);
    app.route('/accruals', accruals);
    app.route('/blackouts', blackouts);
  },
};

const attendanceModule: AvkashModule<Hono<PlatformEnv>> = {
  key: 'attendance',
  title: 'Attendance',
  entitlement: 'attendance',
  dependsOn: ['org', 'users'],
  routes: (app) => {
    app.route('/attendance', deviceIngest); // POST /attendance/punch (device-authed)
    app.route('/attendance', attendance);
    app.route('/devices', devices);
    app.route('/shifts', shifts);
    app.route('/workweek-patterns', workweekPatterns);
  },
};

const holidaysModule: AvkashModule<Hono<PlatformEnv>> = {
  key: 'holidays',
  title: 'Holiday Calendars',
  entitlement: 'holidays',
  dependsOn: ['org'],
  routes: (app) => {
    app.route('/holidays', holidays);
  },
};

const policyModule: AvkashModule<Hono<PlatformEnv>> = {
  key: 'policy',
  title: 'Policy & Field Access',
  entitlement: 'policy',
  dependsOn: ['org', 'users'],
  routes: (app) => {
    app.route('/policies', policies);
    app.route('/field-policies', fieldPolicies);
  },
};

// ── Open modules (public repo — no private modules) ───────────────────────────
export const OPEN_MODULES: AvkashModule<Hono<PlatformEnv>>[] = [
  orgModule,
  usersModule,
  leaveModule,
  attendanceModule,
  holidaysModule,
  policyModule,
];
