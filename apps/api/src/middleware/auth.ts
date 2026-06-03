import { createMiddleware } from 'hono/factory';
import { type AuthContext, UnauthenticatedError } from '@avkash/shared';
import { getAuthContext } from '@avkash/auth';
import { resolveLocale, type Locale } from '@avkash/i18n';

// Typed Hono env so handlers can read c.get('auth') and c.get('locale').
export type AppEnv = { Variables: { auth: AuthContext; locale: Locale; requestId: string } };

// Resolve the session → ctx at the edge. No session → throw, so onError emits the
// single error envelope. The user's stored language overrides the header locale.
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const ctx = await getAuthContext(c.req.raw.headers);
  if (!ctx) throw new UnauthenticatedError();
  c.set('auth', ctx);
  if (ctx.language) c.set('locale', resolveLocale(ctx.language));
  await next();
});
