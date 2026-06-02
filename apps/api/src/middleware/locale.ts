import { createMiddleware } from 'hono/factory';
import { parseAcceptLanguage, type Locale } from '@avkash/i18n';

export type LocaleEnv = { Variables: { locale: Locale } };

// Resolve locale from Accept-Language (default 'en'). requireAuth later overrides
// this with the user's stored preference when present.
export const localeMw = createMiddleware<LocaleEnv>(async (c, next) => {
  c.set('locale', parseAcceptLanguage(c.req.header('accept-language')));
  await next();
});
