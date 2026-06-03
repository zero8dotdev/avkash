import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { auth } from '@avkash/auth';
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
import { orgs } from './routes/orgs';
import { invitations } from './routes/invitations';
import { users } from './routes/users';
import { internal } from './routes/internal';

// Expose real error internals only in lower environments. Explicit flag wins;
// otherwise derive from NODE_ENV (anything but production is exposed). See plans/15.
const EXPOSE_ERRORS =
  process.env.EXPOSE_ERRORS != null ? process.env.EXPOSE_ERRORS === 'true' : process.env.NODE_ENV !== 'production';

// The wiring layer. Each route group is thin: parse request -> call a domain
// function with ctx -> return json. The exported AppType is the type-safe
// contract the web client consumes (no codegen).
export const app = new Hono<{ Variables: { locale: Locale; requestId: string } }>()
  .use('*', requestIdMw)
  .use('*', localeMw)
  .get('/health', (c) => c.json({ ok: true, service: 'api' }))
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
