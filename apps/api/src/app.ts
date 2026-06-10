import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { auth } from '@avkash/auth';
import { ping } from '@avkash/db';
import { authzHealthy } from '@avkash/authz';
import { DomainError, mapDatabaseError } from '@avkash/shared';
import { translate, type Locale } from '@avkash/i18n';
import { requestIdMw } from './middleware/request-id';
import { localeMw } from './middleware/locale';
import { leaves } from './routes/leave';
import { leaveTypes } from './routes/leave-types';
import { leavePolicies } from './routes/leave-policies';
import { balances } from './routes/balances';
import { compOff } from './routes/comp-off';
import { encashments } from './routes/encashments';
import { delegations } from './routes/delegations';
import { calendar } from './routes/calendar';
import { reports } from './routes/reports';
import { holidays } from './routes/holidays';
import { teams } from './routes/teams';
import { me } from './routes/me';
import { employees } from './routes/employees';
import { attendance } from './routes/attendance';
import { deviceIngest } from './routes/device-ingest';
import { accruals } from './routes/accruals';
import { locations } from './routes/locations';
import { devices } from './routes/devices';
import { shifts } from './routes/shifts';
import { orgs } from './routes/orgs';
import { invitations } from './routes/invitations';
import { users } from './routes/users';
import { internal } from './routes/internal';
import { departments } from './routes/departments';
import { orgLevels, shiftLevelRestrictions } from './routes/org-levels';
import { shiftSupervisors } from './routes/shift-supervisors';
import { policies } from './routes/policies';
import { businessUnits, employeeBusinessUnit } from './routes/business-units';
import { workweekPatterns } from './routes/workweek-patterns';
import { blackouts } from './routes/blackouts';
import { transfers } from './routes/transfers';
import { levelPolicies } from './routes/leave-policies';
import { fieldPolicies } from './routes/field-policies';

// Expose real error internals only in lower environments. Explicit flag wins;
// otherwise derive from NODE_ENV (anything but production is exposed). See plans/15.
const EXPOSE_ERRORS =
  process.env.EXPOSE_ERRORS != null ? process.env.EXPOSE_ERRORS === 'true' : process.env.NODE_ENV !== 'production';

// Browser clients on these origins may call the API with credentials (Better Auth
// cookies). Comma-separated allow-list; defaults to the local web app. Never '*'
// with credentials, so the origin must be explicit.
const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',');

// The wiring layer. Each route group is thin: parse request -> call a domain
// function with ctx -> return json. The exported AppType is the type-safe
// contract the web client consumes (no codegen).
export const app = new Hono<{ Variables: { locale: Locale; requestId: string } }>()
  .use('*', requestIdMw)
  .use('*', cors({ origin: CORS_ORIGINS, credentials: true }))
  .use('*', localeMw)
  // Liveness: the process is up. Readiness: dependencies (DB + FGA) are reachable —
  // an orchestrator routes traffic only when ready, and pulls it on 503.
  // FGA is probed with the same timeout discipline as the DB ping. Both must pass.
  .get('/health', (c) => c.json({ status: 'live', service: 'api' }))
  .get('/health/ready', async (c) => {
    try {
      const [fgaOk] = await Promise.all([
        authzHealthy(2000),
        ping(), // throws on DB failure — caught below
      ]);
      if (!fgaOk) {
        return c.json({ status: 'unavailable', reason: 'fga' }, 503);
      }
      return c.json({ status: 'ready' });
    } catch {
      return c.json({ status: 'unavailable' }, 503);
    }
  })
  // Better Auth owns /api/auth/* (sign-in, sign-up, OAuth callbacks, OTP, …).
  .on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))
  .route('/orgs', orgs)
  .route('/invitations', invitations)
  .route('/users', users)
  .route('/leaves', leaves)
  .route('/leave-types', leaveTypes)
  .route('/leave-policies', leavePolicies)
  .route('/balances', balances)
  .route('/comp-off', compOff)
  .route('/encashments', encashments)
  .route('/delegations', delegations)
  .route('/calendar', calendar)
  .route('/reports', reports)
  .route('/holidays', holidays)
  .route('/teams', teams)
  .route('/me', me)
  .route('/employees', employees)
  .route('/attendance', deviceIngest) // POST /attendance/punch (device-authed)
  .route('/attendance', attendance)
  .route('/accruals', accruals)
  .route('/locations', locations)
  .route('/departments', departments)
  .route('/devices', devices)
  .route('/shifts', shifts)
  .route('/org-levels', orgLevels)
  .route('/shifts/:shiftId/levels', shiftLevelRestrictions)
  .route('/shift-supervisors', shiftSupervisors)
  .route('/policies', policies)
  .route('/business-units', businessUnits)
  .route('/employees/:userId/business-unit', employeeBusinessUnit)
  .route('/workweek-patterns', workweekPatterns)
  .route('/blackouts', blackouts)
  .route('/transfers', transfers)
  .route('/leave-policies/levels', levelPolicies)
  .route('/field-policies', fieldPolicies)
  .route('/internal', internal)
  // Single error envelope. DomainError carries its own status + code + params;
  // anything else is a system error (500), logged fully, internals hidden in prod.
  .onError((err, c) => {
    const requestId = c.get('requestId') ?? crypto.randomUUID();
    const locale = c.get('locale') ?? 'en';
    // Known DomainError, or a translatable DB constraint violation → typed envelope.
    const domainErr = err instanceof DomainError ? err : mapDatabaseError(err);
    if (domainErr) {
      return c.json(
        {
          error: {
            code: domainErr.code,
            message: translate(locale, domainErr.code, domainErr.params),
            details: domainErr.params,
            requestId,
          },
        },
        domainErr.status as ContentfulStatusCode
      );
    }
    console.error(`[${requestId}]`, err);
    return c.json(
      {
        error: {
          code: 'INTERNAL',
          message: translate(locale, 'INTERNAL'),
          requestId,
          ...(EXPOSE_ERRORS
            ? {
                details: {
                  message: err instanceof Error ? err.message : String(err),
                  stack: err instanceof Error ? err.stack : undefined,
                },
              }
            : {}),
        },
      },
      500
    );
  });
export type AppType = typeof app;
