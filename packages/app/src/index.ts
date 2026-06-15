import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { AvkashModule } from '@avkash/shared';
import { DomainError, mapDatabaseError } from '@avkash/shared';
import { translate, type Locale } from '@avkash/i18n';
import { auth } from '@avkash/auth';
import { authzHealthy } from '@avkash/authz';
import { ping } from '@avkash/db';
import { requestIdMw } from './middleware/request-id';
import { localeMw } from './middleware/locale';

export { requestIdMw, type RequestIdEnv } from './middleware/request-id';
export { localeMw, type LocaleEnv } from './middleware/locale';
export { requireAuth, type AppEnv } from './middleware/auth';
export { requireInternalToken } from './middleware/internal-auth';

// The minimum context every request carries after platform middleware runs.
// Module route handlers receive this via the typed Hono instance.
export type PlatformEnv = { Variables: { locale: Locale; requestId: string } };

const EXPOSE_ERRORS =
  process.env.EXPOSE_ERRORS != null ? process.env.EXPOSE_ERRORS === 'true' : process.env.NODE_ENV !== 'production';

const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(',');

/**
 * Assembles the Hono app from a list of module manifests (Plan 49 Seam 2 / Phase 3).
 *
 * Platform middleware (request-id, CORS, locale), health + readiness endpoints, and
 * the Better Auth handler are always present. Each module's `routes` function is
 * called in order so it can mount its routes on the app. The error envelope is
 * applied last.
 *
 * Adding a module = create its package + append ONE entry to OPEN_MODULES (or
 * PRIVATE_MODULES in avkash-cloud). Zero edits to this factory, app.ts, i18n
 * catalogs, or the job scheduler.
 */
export function createApp(modules: AvkashModule<Hono<PlatformEnv>>[]): Hono<PlatformEnv> {
  const app = new Hono<PlatformEnv>();

  // ── Platform middleware ───────────────────────────────────────────────────
  app.use('*', requestIdMw);
  app.use('*', cors({ origin: CORS_ORIGINS, credentials: true }));
  app.use('*', localeMw);

  // ── Health ────────────────────────────────────────────────────────────────
  app.get('/health', (c) => c.json({ status: 'live', service: 'api' }));
  app.get('/health/ready', async (c) => {
    try {
      const [fgaOk] = await Promise.all([authzHealthy(2000), ping()]);
      if (!fgaOk) return c.json({ status: 'unavailable', reason: 'fga' }, 503);
      return c.json({ status: 'ready' });
    } catch {
      return c.json({ status: 'unavailable' }, 503);
    }
  });

  // ── Better Auth ───────────────────────────────────────────────────────────
  app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

  // ── Module routes ─────────────────────────────────────────────────────────
  // Entitlement gating (Phase 4) will wrap each gated module's router here.
  for (const mod of modules) {
    mod.routes?.(app);
  }

  // ── Error envelope ────────────────────────────────────────────────────────
  app.onError((err, c) => {
    const requestId = c.get('requestId') ?? crypto.randomUUID();
    const locale = c.get('locale') ?? 'en';
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

  return app;
}
